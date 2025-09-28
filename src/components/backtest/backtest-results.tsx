'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  BarChart3,
  Download,
  Activity,
  AlertCircle,
  Clock
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { BacktestResults as RealBacktestResults } from '@/lib/backtesting-engine';
import { TradeHistory } from './trade-history';
import { EquityChart } from './equity-chart';

interface BacktestParamsInput {
  strategy: 'aggressive_scalper' | 'quantum_scalper';
  datasetId: string;
  initialBalance: number;
  riskPerTrade: number;
}

interface BacktestResultsProps {
  backtestParams?: BacktestParamsInput;
  onBacktestComplete?: (results: RealBacktestResults) => void;
}

export function BacktestResults({ backtestParams, onBacktestComplete }: BacktestResultsProps) {
  const [results, setResults] = useState<RealBacktestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Run backtest when params change
  useEffect(() => {
    if (!backtestParams) return;
    
    const runBacktest = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      
      try {
        const queryParams = new URLSearchParams({
          strategy: backtestParams.strategy,
          datasetId: backtestParams.datasetId,
          initialBalance: backtestParams.initialBalance.toString(),
          riskPerTrade: backtestParams.riskPerTrade.toString()
        });
        
        const response = await fetch(`/api/backtest?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error(`Backtest failed: ${response.status}`);
        }
        
        const data = await response.json();
        setResults(data);
        
        if (onBacktestComplete) {
          onBacktestComplete(data);
        }
      } catch (error) {
        console.error('Backtest error:', error);
        setErrorMsg(error instanceof Error ? error.message : 'Backtest failed');
      } finally {
        setIsLoading(false);
      }
    };
    
    runBacktest();
  }, [backtestParams, onBacktestComplete]);

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-8">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
          <span className="text-gray-400">Running backtest...</span>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-gray-900/50 rounded-lg border border-red-500/50 p-6">
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Error: {errorMsg}</span>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-8 text-center">
        <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Configure parameters and run a backtest to see results</p>
      </div>
    );
  }

  // Calculate key metrics
  const profitLossPercent = ((results.finalBalance - results.initialBalance) / results.initialBalance) * 100;
  const avgWin = results.winningTrades > 0 ? results.totalProfit / results.winningTrades : 0;
  const avgLoss = results.losingTrades > 0 ? Math.abs(results.totalLoss) / results.losingTrades : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Backtest Results</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{results.executionTime}ms</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Return</span>
              {profitLossPercent >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className={`text-xl font-bold ${profitLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercentage(profitLossPercent)}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Win Rate</span>
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {formatPercentage(results.winRate)}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Trades</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {results.totalTrades}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Profit Factor</span>
              <BarChart3 className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-4">Financial Metrics</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Initial Balance</span>
              <span className="text-white">{formatCurrency(results.initialBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Final Balance</span>
              <span className="text-white font-semibold">{formatCurrency(results.finalBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Max Drawdown</span>
              <span className="text-red-400">{formatPercentage(results.maxDrawdownPercent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sharpe Ratio</span>
              <span className="text-white">{results.sharpeRatio.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-4">Trading Statistics</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Winning Trades</span>
              <span className="text-green-400">{results.winningTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Losing Trades</span>
              <span className="text-red-400">{results.losingTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Average Win</span>
              <span className="text-green-400">{formatCurrency(avgWin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Average Loss</span>
              <span className="text-red-400">{formatCurrency(avgLoss)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Equity Chart */}
      {results.equityCurve && results.equityCurve.length > 0 && (
        <EquityChart 
          equityData={results.equityCurve}
          trades={results.trades}
          initialBalance={results.initialBalance}
        />
      )}

      {/* Trade History */}
      {results.trades && results.trades.length > 0 && (
        <TradeHistory trades={results.trades} />
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            const dataStr = JSON.stringify(results, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `backtest-${Date.now()}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
        >
          <Download className="w-4 h-4" />
          <span>Export Results</span>
        </button>
      </div>
    </div>
  );
}
