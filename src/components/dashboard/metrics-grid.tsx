'use client';

import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  BarChart3,
  Target,
  Award,
  Percent
} from 'lucide-react';
import { useMetaAPI } from '@/hooks/use-metaapi';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function MetricsGrid() {
  const { accountInfo, positions, isLoading, error } = useMetaAPI();
  const [tradingStats, setTradingStats] = useState<any>(null);

  useEffect(() => {
    const fetchTradingStats = async () => {
      try {
        const response = await fetch('/api/live/metrics');
        if (response.ok) {
          const data = await response.json();
          setTradingStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch trading stats:', err);
      }
    };

    fetchTradingStats();
    const interval = setInterval(fetchTradingStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // Handle error state - show empty state instead of dummy data
  if (error || !accountInfo) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Connection Error</p>
              <p className="text-2xl font-bold text-red-400">--</p>
              <p className="text-xs text-gray-500">MetaAPI Unavailable</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalPnL = positions.reduce((sum, pos) => sum + pos.profit, 0);
  const equity = accountInfo?.equity || 0;
  const balance = accountInfo?.balance || 0;
  const dailyChange = equity - balance;
  const dailyChangePercent = balance > 0 ? (dailyChange / balance) * 100 : 0;

  // Get real trading statistics from API
  const winRate = tradingStats?.winRate || 0;
  const profitFactor = tradingStats?.profitFactor || 0;
  const totalTrades = tradingStats?.totalTrades || 0;
  const winningTrades = tradingStats?.winningTrades || 0;

  const metrics = [
    {
      title: 'Account Balance',
      value: formatCurrency(balance),
      change: null,
      icon: DollarSign,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      title: 'Total P&L',
      value: formatCurrency(totalPnL),
      change: formatPercentage((totalPnL / balance) * 100),
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: totalPnL >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: totalPnL >= 0 ? 'bg-green-500/20' : 'bg-red-500/20',
    },
    {
      title: 'Win Rate',
      value: formatPercentage(winRate),
      change: totalTrades > 0 ? `${winningTrades}/${totalTrades} trades` : 'No trades yet',
      icon: Award,
      color: winRate >= 50 ? 'text-green-400' : 'text-yellow-400',
      bgColor: winRate >= 50 ? 'bg-green-500/20' : 'bg-yellow-500/20',
    },
    {
      title: 'Profit Factor',
      value: profitFactor > 0 ? profitFactor.toFixed(2) : '--',
      change: profitFactor >= 1.5 ? 'Excellent' : profitFactor >= 1.0 ? 'Good' : 'Poor',
      icon: BarChart3,
      color: profitFactor >= 1.5 ? 'text-green-400' : profitFactor >= 1.0 ? 'text-yellow-400' : 'text-red-400',
      bgColor: profitFactor >= 1.5 ? 'bg-green-500/20' : profitFactor >= 1.0 ? 'bg-yellow-500/20' : 'bg-red-500/20',
    },
    {
      title: 'Open Positions',
      value: positions.length.toString(),
      change: `${positions.filter(p => p.profit > 0).length} winning`,
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <div
            key={index}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                <IconComponent className={`w-6 h-6 ${metric.color}`} />
              </div>
            {metric.change && (
              <div className={`text-sm font-medium ${metric.color}`}>
                {metric.change}
              </div>
            )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-gray-400">{metric.title}</p>
              <p className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </p>

            </div>
          </div>
        );
      })}
    </div>
  );
}
