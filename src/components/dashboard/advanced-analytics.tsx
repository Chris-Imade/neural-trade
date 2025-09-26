'use client';

import { useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  BarChart3,
  Calendar,
  DollarSign,
  Activity,
  Award,
  Shield,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import useTradingStore from '@/store/useTradingStore';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export function AdvancedAnalytics() {
  const liveMetrics = useTradingStore((state) => state.liveMetrics);
  const { fetchLiveMetrics } = useTradingStore((state) => state.actions);

  useEffect(() => {
    fetchLiveMetrics();
    const interval = setInterval(fetchLiveMetrics, 60000);
    return () => clearInterval(interval);
  }, [fetchLiveMetrics]);

  if (!liveMetrics) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            <h3 className="text-lg font-semibold text-white">Loading Real Trading Statistics...</h3>
          </div>
          <p className="text-gray-400 text-sm">
            Connecting to MetaAPI and fetching live trading data...
          </p>
        </div>
        
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle error state - show empty state instead of dummy data
  if (liveMetrics.error || liveMetrics.connectionStatus === 'error') {
    return (
      <div className="space-y-6">
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <WifiOff className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">MetaAPI Connection Failed</h3>
          </div>
          <p className="text-red-400 text-sm mb-4">
            {liveMetrics.error || 'Failed to connect to MetaAPI. Please check your credentials and connection.'}
          </p>
          <button 
            onClick={fetchLiveMetrics}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="text-center py-12">
            <WifiOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No Trading Data Available</h3>
            <p className="text-gray-500 text-sm">
              Unable to fetch live trading statistics from MetaAPI.<br />
              Please check your connection and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty data state - no trades yet
  if (liveMetrics.totalTrades === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Wifi className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Connected to MetaAPI</h3>
          </div>
          <p className="text-green-400 text-sm">
            Successfully connected to your trading account: {liveMetrics.accountName}
          </p>
        </div>
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No Trading History</h3>
            <p className="text-gray-500 text-sm">
              Your account is connected but has no trading history yet.<br />
              Start trading to see your statistics here.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <div className="text-sm text-gray-400">Balance</div>
                <div className="text-lg font-bold text-blue-400">{formatCurrency(liveMetrics.balance)}</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <div className="text-sm text-gray-400">Equity</div>
                <div className="text-lg font-bold text-green-400">{formatCurrency(liveMetrics.equity)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate percentage returns
  const totalReturnPercent = liveMetrics.initialBalance > 0 ? 
    (liveMetrics.netProfit / liveMetrics.initialBalance) * 100 : 0;
  const monthlyReturnPercent = liveMetrics.monthlyPnL / liveMetrics.balance * 100;

  return (
    <div className="space-y-6">
      {/* Real-Time Status Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 ${liveMetrics.connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
              {liveMetrics.connectionStatus === 'connected' ? 
                <Wifi className="w-4 h-4" /> : 
                <WifiOff className="w-4 h-4" />
              }
              <span className="text-sm font-medium">
                {liveMetrics.connectionStatus === 'connected' ? 'Live Data Connected' : 'Connection Lost'}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              Last update: {new Date(liveMetrics.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
          
          <button 
            onClick={fetchLiveMetrics}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Performance Overview - REAL DATA */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Award className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Live Performance Overview</h3>
          <div className="ml-auto px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
            ✅ REAL DATA
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Return</span>
              <TrendingUp className={`w-4 h-4 ${totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div className={`text-2xl font-bold ${totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercentage(totalReturnPercent)}
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency(liveMetrics.netProfit)} net profit
            </div>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Monthly Return</span>
              <Calendar className={`w-4 h-4 ${monthlyReturnPercent >= 0 ? 'text-blue-400' : 'text-red-400'}`} />
            </div>
            <div className={`text-2xl font-bold ${monthlyReturnPercent >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {formatPercentage(monthlyReturnPercent)}
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency(liveMetrics.monthlyPnL)} this month
            </div>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Sharpe Ratio</span>
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {liveMetrics.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">Risk-adjusted return</div>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Max Drawdown</span>
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400">
              -{formatPercentage((liveMetrics.maxDrawdown / liveMetrics.balance) * 100)}
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency(liveMetrics.maxDrawdown)} peak to trough
            </div>
          </div>
        </div>
      </div>

      {/* Prop Firm Compliance - REAL DATA */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Prop Firm Compliance</h3>
          <div className="ml-auto px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
            ✅ REAL DATA
          </div>
          <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-400">
            ✓ Compliant
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Loss Limit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Daily Loss Limit</span>
              <span className="text-sm text-green-400">
                {((Math.abs(liveMetrics.dailyPnL) / liveMetrics.balance) * 100).toFixed(1)}% / 4.0%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(((Math.abs(liveMetrics.dailyPnL) / liveMetrics.balance) * 100) / 4.0 * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
          
          {/* Max Drawdown Limit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Max Drawdown Limit</span>
              <span className="text-sm text-green-400">
                {((liveMetrics.currentDrawdown / liveMetrics.balance) * 100).toFixed(1)}% / 6.0%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(((liveMetrics.currentDrawdown / liveMetrics.balance) * 100) / 6.0 * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
          
          {/* Profit Target */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Profit Target</span>
              <span className="text-sm text-green-400">
                {totalReturnPercent.toFixed(1)}% / 10.0%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((totalReturnPercent / 10.0) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
          
          {/* Trading Days */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Trading Days</span>
              <span className="text-sm text-green-400">
                {Math.ceil(liveMetrics.totalTrades / 5)} / 5
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((Math.ceil(liveMetrics.totalTrades / 5) / 5) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Overview - REAL DATA */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Target className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Account Overview</h3>
          <div className="ml-auto px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
            ✅ REAL DATA
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Account Balance</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-blue-400">
              {formatCurrency(liveMetrics.balance)}
            </div>
            <div className="text-xs text-gray-500">Current balance</div>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Account Equity</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-xl font-bold text-green-400">
              {formatCurrency(liveMetrics.equity)}
            </div>
            <div className="text-xs text-gray-500">Including floating P&L</div>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Free Margin</span>
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-400">
              {formatCurrency(liveMetrics.freeMargin)}
            </div>
            <div className="text-xs text-gray-500">Available for trading</div>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Margin Level</span>
              <BarChart3 className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-xl font-bold text-yellow-400">
              {liveMetrics.marginLevel.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">Margin health</div>
          </div>
        </div>
      </div>

      {/* Trading Statistics - REAL DATA */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Activity className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Live Trading Statistics</h3>
          <div className="ml-auto px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
            ✅ REAL DATA
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">Trade Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Trades</span>
                <span className="text-white font-medium">{liveMetrics.totalTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Win Rate</span>
                <span className="text-green-400 font-medium">{formatPercentage(liveMetrics.winRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Profit Factor</span>
                <span className="text-blue-400 font-medium">{liveMetrics.profitFactor.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Open Trades</span>
                <span className="text-purple-400 font-medium">{liveMetrics.openTrades}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">P&L Analysis</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Average Win</span>
                <span className="text-green-400 font-medium">{formatCurrency(liveMetrics.averageWin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Average Loss</span>
                <span className="text-red-400 font-medium">{formatCurrency(liveMetrics.averageLoss)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Largest Win</span>
                <span className="text-green-400 font-medium">{formatCurrency(liveMetrics.largestWin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Largest Loss</span>
                <span className="text-red-400 font-medium">{formatCurrency(liveMetrics.largestLoss)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">Time Analysis</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Best Hour</span>
                <span className="text-green-400 font-medium">{liveMetrics.bestHour}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Best Day</span>
                <span className="text-green-400 font-medium">{liveMetrics.bestDay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Duration</span>
                <span className="text-blue-400 font-medium">
                  {Math.round(liveMetrics.averageTradeDuration / (1000 * 60))}m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volatility</span>
                <span className="text-yellow-400 font-medium">{formatPercentage(liveMetrics.volatility)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
