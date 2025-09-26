'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  AlertTriangle,
  BarChart3,
  Download,
  Clock,
  Activity
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { BacktestResults as RealBacktestResults, BacktestTrade } from '@/lib/backtesting-engine';
import { TradeHistory } from './trade-history';
import { EquityChart } from './equity-chart';
import { useToast } from '@/components/ui/toast';

interface BacktestParamsInput {
  strategy: 'vab_breakout' | 'mean_reversion' | 'dual_timeframe_trend';
  datasetId: string;
  initialBalance: number;
  propFirm: 'equity-edge' | 'fundednext';
  riskPerTrade: number;
}

interface BacktestResultsProps {
  backtestParams?: BacktestParamsInput;
  onRunBacktest?: (params: BacktestParamsInput) => void;
}

export function BacktestResults({ backtestParams, onRunBacktest }: BacktestResultsProps) {
  const [hasResults, setHasResults] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<RealBacktestResults | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<BacktestTrade | null>(null);
  const { success, error, info } = useToast();
  // All backtests are executed on the server via API to keep tokens secure

  // Run REAL backtest via dataset API
  const runRealBacktest = async (params: BacktestParamsInput): Promise<RealBacktestResults> => {
    console.log('🚀 Starting REAL backtest via dataset API...');
    const query = new URLSearchParams({
      strategy: params.strategy,
      datasetId: params.datasetId,
      initialBalance: String(params.initialBalance),
      propFirm: params.propFirm,
      riskPerTrade: String(params.riskPerTrade),
    });
    const res = await fetch(`/api/backtest/dataset?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Backtest API failed with status ${res.status}`);
    }
    const data = await res.json();
    return data as RealBacktestResults;
  };

  // Run backtest when params change
  useEffect(() => {
    if (backtestParams) {
      setIsRunning(true);
      setHasResults(false);
      setSelectedTrade(null);
      
      info('Backtest Started', `Running ${backtestParams.strategy} strategy on dataset ${backtestParams.datasetId}`);
      
      // Run REAL backtest
      runRealBacktest(backtestParams)
        .then((backtestResults) => {
          setResults(backtestResults);
          setHasResults(true);
          setIsRunning(false);
          console.log('✅ Real backtest completed:', backtestResults);
          
          // Show success toast with results
          const tradesText = backtestResults.totalTrades === 0 ? 'No trades generated' : 
            `${backtestResults.totalTrades} trades, ${(backtestResults.winRate || 0).toFixed(1)}% win rate`;
          success(
            'Backtest Completed', 
            `${tradesText} • ${(backtestResults.totalReturnPercent || 0).toFixed(2)}% return • ${((backtestResults.executionTime || 0) / 1000).toFixed(1)}s execution`
          );
        })
        .catch((err) => {
          console.error('❌ Backtest failed:', err);
          setIsRunning(false);
          
          // Show error toast
          error(
            'Backtest Failed', 
            err.message || 'Unknown error occurred during backtest execution'
          );
        });
    }
  }, [backtestParams, info, success, error]);

  if (isRunning) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Running REAL Backtest...</h3>
          <p className="text-gray-400 mb-2">
            Executing {backtestParams?.strategy.replace('_', ' ')} strategy on XAUUSD
          </p>
          <p className="text-xs text-green-400">
            ✅ Using actual strategy logic - No fake data!
          </p>
        </div>
      </div>
    );
  }

  if (!hasResults || !results) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Results Yet</h3>
          <p className="text-gray-400">
            Configure your backtest parameters and click "Run Backtest" to see results
          </p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Return',
      value: formatPercentage(results.totalReturnPercent),
      change: formatCurrency(results.totalReturn),
      icon: TrendingUp,
      color: (results.totalReturn || 0) >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: (results.totalReturn || 0) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20',
    },
    {
      title: 'Win Rate',
      value: formatPercentage(results.winRate),
      change: `${results.winningTrades || 0}/${results.totalTrades || 0} trades`,
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      title: 'Profit Factor',
      value: (results.profitFactor || 0).toFixed(2),
      change: 'Risk-adjusted return',
      icon: Activity,
      color: (results.profitFactor || 0) >= 1.5 ? 'text-purple-400' : 'text-yellow-400',
      bgColor: (results.profitFactor || 0) >= 1.5 ? 'bg-purple-500/20' : 'bg-yellow-500/20',
    },
    {
      title: 'Max Drawdown',
      value: formatPercentage(results.maxDrawdownPercent),
      change: formatCurrency(results.maxDrawdown),
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-white">Real Backtest Results</h3>
              <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
                ✅ REAL DATA
              </div>
            </div>
            <p className="text-sm text-gray-400">
              {results.strategy} • {results.symbol} • {results.timeframe} • {results.startDate} to {results.endDate}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Executed in {results.executionTime}ms • {results.dataPoints} data points • {results.trades.length} actual trades
            </p>
          </div>
          <button className="flex items-center space-x-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                  <metric.icon className={`w-4 h-4 ${metric.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">{metric.title}</p>
                <p className={`text-lg font-bold ${metric.color}`}>
                  {metric.value}
                </p>
                <p className="text-xs text-gray-500">{metric.change}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equity Chart with Trade Markers */}
      <EquityChart 
        equityData={results.equityData}
        trades={results.trades}
        initialBalance={results.initialBalance}
        selectedTrade={selectedTrade}
        onTradeSelect={setSelectedTrade}
      />

      {/* Enhanced Trade Statistics */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Advanced Trade Statistics</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Basic Metrics</h5>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Trades</span>
              <span className="text-white font-medium">{results.totalTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Winning Trades</span>
              <span className="text-green-400 font-medium">{results.winningTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Losing Trades</span>
              <span className="text-red-400 font-medium">{results.losingTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Duration</span>
              <span className="text-white font-medium">{Math.round(results.averageTradeDuration)}m</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-300 mb-2">P&L Analysis</h5>
            <div className="flex justify-between">
              <span className="text-gray-400">Average Win</span>
              <span className="text-green-400 font-medium">{formatCurrency(results.averageWin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Average Loss</span>
              <span className="text-red-400 font-medium">{formatCurrency(results.averageLoss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Largest Win</span>
              <span className="text-green-400 font-medium">{formatCurrency(results.largestWin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Largest Loss</span>
              <span className="text-red-400 font-medium">{formatCurrency(results.largestLoss)}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Risk Metrics</h5>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Consecutive Wins</span>
              <span className="text-green-400 font-medium">{results.maxConsecutiveWins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Consecutive Losses</span>
              <span className="text-red-400 font-medium">{results.maxConsecutiveLosses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg MFE</span>
              <span className="text-blue-400 font-medium">{formatCurrency(results.averageMFE)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg MAE</span>
              <span className="text-orange-400 font-medium">{formatCurrency(results.averageMAE)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Detailed Trade History */}
      <TradeHistory 
        trades={results.trades}
        onTradeSelect={setSelectedTrade}
      />
    </div>
  );
}
