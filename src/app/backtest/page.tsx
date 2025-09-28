'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { BacktestForm } from '@/components/backtest/backtest-form';
import { BacktestResults } from '@/components/backtest/backtest-results';
import { StrategyPresets } from '@/components/backtest/strategy-presets';
import { TrendingUp } from 'lucide-react';

interface BacktestParams {
  strategy: 'trend_following' | 'mean_reversion' | 'momentum_trading' | 'intraday_breakout' | 'statistical_pairs' | 'volatility_channel' | 'vwap_strategy' | 'crossover_systems' | 'fibonacci_bot' | 'risk_adjusted_scalping' | 'latency_arbitrage' | 'hft_tick_scalping' | 'martingale_grid';
  datasetId: string;
  initialBalance: number;
  propFirm: 'equity-edge' | 'fundednext';
  riskPerTrade: number;
}

export default function BacktestPage() {
  const [backtestParams, setBacktestParams] = useState<BacktestParams | undefined>();
  const [backtestResults, setBacktestResults] = useState<any>(undefined);

  const handleRunBacktest = (params: BacktestParams) => {
    setBacktestParams(params);
    setBacktestResults(undefined); // Clear previous results
  };

  const handleBacktestComplete = (results: any) => {
    setBacktestResults(results);
  };
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Strategy Backtesting
            </h1>
            <p className="text-gray-400 mt-1">
              Test your trading strategies with historical data
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>Historical Analysis</span>
          </div>
        </div>

        {/* Strategy Presets */}
        <StrategyPresets 
          currentStrategy={backtestParams?.strategy}
          currentParams={backtestParams}
          lastBacktestResults={backtestResults}
          onLoadPreset={(preset) => {
            setBacktestParams({
              strategy: preset.strategy as any,
              datasetId: preset.parameters.datasetId || '',
              initialBalance: preset.parameters.initialBalance || 10000,
              propFirm: preset.parameters.propFirm || 'equity-edge',
              riskPerTrade: preset.parameters.riskPerTrade || 1
            });
          }}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Backtest Form */}
          <div>
            <BacktestForm onRunBacktest={handleRunBacktest} />
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <BacktestResults 
              backtestParams={backtestParams} 
              onBacktestComplete={handleBacktestComplete}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
