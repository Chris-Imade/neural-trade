'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { BacktestForm } from '@/components/backtest/backtest-form';
import { BacktestResults } from '@/components/backtest/backtest-results';
import { TrendingUp } from 'lucide-react';

interface BacktestParams {
  strategy: 'vab_breakout' | 'mean_reversion' | 'dual_timeframe_trend';
  timeframe: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';
  htfTimeframe?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';
  startDate: string;
  endDate: string;
  initialBalance: number;
  propFirm: 'equity-edge' | 'fundednext';
  riskPerTrade: number;
}

export default function BacktestPage() {
  const [backtestParams, setBacktestParams] = useState<BacktestParams | undefined>();

  const handleRunBacktest = (params: BacktestParams) => {
    setBacktestParams(params);
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Backtest Form */}
          <div>
            <BacktestForm onRunBacktest={handleRunBacktest} />
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <BacktestResults backtestParams={backtestParams} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
