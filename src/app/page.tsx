'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { RealTimeEquity } from '@/components/dashboard/real-time-equity';
import { TradingChart } from '@/components/charts/trading-chart';
import { LiveTrades } from '@/components/dashboard/live-trades';
import { RefreshCw } from 'lucide-react';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Simple Header with Refresh */}
        <div className="flex items-center justify-end">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Real-Time Equity Display */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <RealTimeEquity />
          <div className="md:col-span-3">
            {/* Metrics Grid */}
            <MetricsGrid />
          </div>
        </div>

        {/* Trading Chart - Full Width */}
        <div className="w-full">
          <TradingChart />
        </div>


        {/* Live Trade History */}
        <LiveTrades />
      </div>
    </DashboardLayout>
  );
}
