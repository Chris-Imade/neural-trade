'use client';

import { 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Target,
  Shield,
  Activity
} from 'lucide-react';
import { useMetaAPI } from '@/hooks/use-metaapi';
import { formatCurrency, formatNumber } from '@/lib/utils';

export function PositionsTable() {
  const { positions, isLoading, error } = useMetaAPI();

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Open Positions</h3>
          <div className="flex items-center space-x-2 text-sm text-red-400">
            <Activity className="w-4 h-4" />
            <span>Connection Error</span>
          </div>
        </div>
        <div className="text-center py-8 text-red-400">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Unable to load positions</p>
          <p className="text-xs text-gray-500 mt-1">MetaAPI connection failed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Open Positions</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Live</span>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No open positions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((position) => (
            <div
              key={position.id}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    position.type === 'buy' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {position.type === 'buy' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-white">{position.symbol}</div>
                    <div className="text-sm text-gray-400">
                      {position.type.toUpperCase()} {position.volume}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-semibold ${
                    position.profit >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(position.profit)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatNumber(position.currentPrice, 5)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Open: </span>
                  <span className="text-white">{formatNumber(position.openPrice, 5)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Swap: </span>
                  <span className={position.swap >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {formatCurrency(position.swap)}
                  </span>
                </div>
                
                {position.stopLoss && (
                  <div className="flex items-center space-x-1">
                    <Shield className="w-3 h-3 text-red-400" />
                    <span className="text-gray-400">SL: </span>
                    <span className="text-red-400">{formatNumber(position.stopLoss, 5)}</span>
                  </div>
                )}
                
                {position.takeProfit && (
                  <div className="flex items-center space-x-1">
                    <Target className="w-3 h-3 text-green-400" />
                    <span className="text-gray-400">TP: </span>
                    <span className="text-green-400">{formatNumber(position.takeProfit, 5)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
