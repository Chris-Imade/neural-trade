'use client';

import { useState } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Target,
  BarChart3,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export function StrategyManager() {
  const [strategies] = useState([
    {
      id: 'vab_breakout',
      name: 'VAB Breakout',
      description: 'Volatility-Adjusted Breakout - Session range breakouts with ATR filtering',
      isActive: true,
      performance: {
        totalTrades: 52,
        winRate: 85.0,
        profitFactor: 2.4,
        totalPnL: 2850.75,
      },
      pairs: ['XAUUSD'],
      timeframes: ['M15', 'M30'],
      riskReward: '1:2',
      confidence: 85,
    },
    {
      id: 'mean_reversion',
      name: 'Mean Reversion',
      description: 'Bollinger Bands + RSI extreme conditions with volatility filter',
      isActive: false,
      performance: {
        totalTrades: 38,
        winRate: 80.0,
        profitFactor: 2.1,
        totalPnL: 1920.50,
      },
      pairs: ['XAUUSD'],
      timeframes: ['M15', 'M30'],
      riskReward: '1:1.5',
      confidence: 80,
    },
    {
      id: 'dual_timeframe_trend',
      name: 'Dual-Timeframe Trend',
      description: 'H4 trend + M15 pullback entries with time-based exits',
      isActive: false,
      performance: {
        totalTrades: 29,
        winRate: 75.0,
        profitFactor: 1.9,
        totalPnL: 1650.25,
      },
      pairs: ['XAUUSD'],
      timeframes: ['M15', 'H4'],
      riskReward: '1:2',
      confidence: 75,
    },
  ]);

  const toggleStrategy = (strategyId: string) => {
    // Toggle strategy active state
    console.log(`Toggling strategy: ${strategyId}`);
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Strategy Manager</h3>
        </div>
        <div className="text-sm text-gray-400">
          {strategies.filter(s => s.isActive).length} of {strategies.length} active
        </div>
      </div>

      <div className="space-y-4">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className={`bg-gray-800/50 border rounded-lg p-4 transition-all ${
              strategy.isActive 
                ? 'border-green-500/30 bg-green-500/5' 
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  strategy.isActive 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-600/20 text-gray-400'
                }`}>
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-white">{strategy.name}</h4>
                  <p className="text-sm text-gray-400">{strategy.description}</p>
                </div>
              </div>
              
              <button
                onClick={() => toggleStrategy(strategy.id)}
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                  strategy.isActive
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {strategy.isActive ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>Start</span>
                  </>
                )}
              </button>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
              <div className="text-center">
                <div className="text-sm font-medium text-white">{strategy.performance.totalTrades}</div>
                <div className="text-xs text-gray-400">Trades</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-green-400">
                  {formatPercentage(strategy.performance.winRate)}
                </div>
                <div className="text-xs text-gray-400">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-purple-400">
                  {strategy.confidence}%
                </div>
                <div className="text-xs text-gray-400">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-orange-400">
                  {strategy.riskReward}
                </div>
                <div className="text-xs text-gray-400">Risk:Reward</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-blue-400">
                  {strategy.performance.profitFactor.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400">Profit Factor</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-medium ${
                  strategy.performance.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(strategy.performance.totalPnL)}
                </div>
                <div className="text-xs text-gray-400">Total P&L</div>
              </div>
            </div>

            {/* Trading Pairs & Timeframes */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Pairs:</span>
                <div className="flex space-x-1">
                  {strategy.pairs.map((pair) => (
                    <span key={pair} className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                      {pair}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Timeframes:</span>
                <div className="flex space-x-1">
                  {strategy.timeframes.map((tf) => (
                    <span key={tf} className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                      {tf}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
