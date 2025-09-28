'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { BacktestForm } from '@/components/backtest/backtest-form';
import { BacktestResults } from '@/components/backtest/backtest-results';
import { StrategyPresets } from '@/components/backtest/strategy-presets';
import { TrendingUp } from 'lucide-react';

interface BacktestParams {
  strategy: 'aggressive_scalper' | 'quantum_scalper';
  datasetId: string;
  initialBalance: number;
  riskPerTrade: number;
}

interface BacktestResults {
  totalTrades: number;
  winRate: number;
  finalBalance: number;
  totalReturnPercent: number;
  winningTrades: number;
  losingTrades: number;
  executionTime: number;
  isRealBacktest: boolean;
}

export default function BacktestPage() {
  const [backtestParams, setBacktestParams] = useState<BacktestParams | undefined>();
  const [backtestResults, setBacktestResults] = useState<BacktestResults | undefined>();

  const handleRunBacktest = async (params: BacktestParams) => {
    setBacktestParams(params);
    setBacktestResults(undefined); // Clear previous results
    
    try {
      const queryParams = new URLSearchParams({
        strategy: params.strategy,
        datasetId: params.datasetId,
        initialBalance: params.initialBalance.toString(),
        riskPerTrade: params.riskPerTrade.toString()
      });
      
      const response = await fetch(`/api/backtest?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Backtest failed: ${response.status}`);
      }
      
      const results = await response.json();
      setBacktestResults(results);
      handleBacktestComplete(results);
    } catch (error) {
      console.error('Backtest error:', error);
      alert('Backtest failed. Please try again.');
    }
  };

  const handleBacktestComplete = (results: BacktestResults) => {
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
              strategy: preset.strategy as 'aggressive_scalper' | 'quantum_scalper',
              datasetId: preset.parameters.datasetId || '',
              initialBalance: preset.parameters.initialBalance || 10000,
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

          {/* Results - Use the proper BacktestResults component with charts and trade history */}
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
