'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { BotControls, StrategyManager, TradingSession } from '@/components/trading';
import { Bot } from 'lucide-react';

export default function TradingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Automated Trading
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your trading bots and strategies
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Bot className="w-4 h-4" />
            <span>Bot Management</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bot Controls */}
          <div>
            <BotControls />
          </div>

          {/* Strategy Manager & Trading Session */}
          <div className="lg:col-span-2 space-y-6">
            <StrategyManager />
            <TradingSession />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
