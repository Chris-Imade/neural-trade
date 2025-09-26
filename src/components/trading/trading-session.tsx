'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function TradingSession() {
  const [sessionData, setSessionData] = useState({
    startTime: new Date().toLocaleTimeString(),
    duration: '2h 15m',
    totalTrades: 8,
    winningTrades: 6,
    losingTrades: 2,
    totalPnL: 145.50,
    currentDrawdown: 0.8,
    maxDrawdown: 2.1,
  });

  const [recentTrades] = useState([
    {
      id: '1',
      symbol: 'XAUUSD',
      type: 'buy',
      volume: 0.1,
      openPrice: 2001.25,
      closePrice: 2003.75,
      pnL: 25.00,
      time: '14:32:15',
      strategy: 'ICC Strategy',
    },
    {
      id: '2',
      symbol: 'XAUUSD',
      type: 'sell',
      volume: 0.1,
      openPrice: 2002.50,
      closePrice: 2001.80,
      pnL: 7.00,
      time: '14:28:42',
      strategy: 'Gold Scalper',
    },
    {
      id: '3',
      symbol: 'EURUSD',
      type: 'buy',
      volume: 0.2,
      openPrice: 1.0845,
      closePrice: 1.0838,
      pnL: -14.00,
      time: '14:25:18',
      strategy: 'EMA Breakout',
    },
  ]);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Trading Session</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Started: {sessionData.startTime}</span>
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Duration</span>
            <Clock className="w-3 h-3 text-blue-400" />
          </div>
          <div className="text-lg font-semibold text-white">{sessionData.duration}</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Total Trades</span>
            <Activity className="w-3 h-3 text-purple-400" />
          </div>
          <div className="text-lg font-semibold text-white">{sessionData.totalTrades}</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Win Rate</span>
            <CheckCircle className="w-3 h-3 text-green-400" />
          </div>
          <div className="text-lg font-semibold text-green-400">
            {((sessionData.winningTrades / sessionData.totalTrades) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Session P&L</span>
            <TrendingUp className="w-3 h-3 text-green-400" />
          </div>
          <div className={`text-lg font-semibold ${
            sessionData.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(sessionData.totalPnL)}
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Trades</h4>
        <div className="space-y-2">
          {recentTrades.map((trade) => (
            <div
              key={trade.id}
              className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                    trade.type === 'buy' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {trade.type === 'buy' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {trade.symbol} • {trade.volume}
                    </div>
                    <div className="text-xs text-gray-400">{trade.strategy}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    trade.pnL >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(trade.pnL)}
                  </div>
                  <div className="text-xs text-gray-400">{trade.time}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Open: {trade.openPrice.toFixed(5)}</span>
                <span>Close: {trade.closePrice.toFixed(5)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Controls */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-400">Live Session</span>
            </div>
            <div className="text-gray-500">
              Max DD: {sessionData.maxDrawdown}%
            </div>
          </div>
          
          <button className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm hover:bg-red-500/30 transition-colors">
            End Session
          </button>
        </div>
      </div>
    </div>
  );
}
