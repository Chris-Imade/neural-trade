'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useMetaAPI } from '@/hooks/use-metaapi';
import { formatCurrency } from '@/lib/utils';

export function RealTimeEquity() {
  const { accountInfo, error } = useMetaAPI();
  const [previousEquity, setPreviousEquity] = useState<number | null>(null);
  const [equityChange, setEquityChange] = useState<'up' | 'down' | 'same' | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (accountInfo?.equity && previousEquity !== null) {
      const currentEquity = accountInfo.equity;
      
      if (currentEquity > previousEquity) {
        setEquityChange('up');
        setShowFlash(true);
      } else if (currentEquity < previousEquity) {
        setEquityChange('down');
        setShowFlash(true);
      } else {
        setEquityChange('same');
      }

      // Clear flash after animation
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      flashTimeoutRef.current = setTimeout(() => {
        setShowFlash(false);
      }, 1000);
    }

    if (accountInfo?.equity) {
      setPreviousEquity(accountInfo.equity);
    }
  }, [accountInfo?.equity, previousEquity]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Real-Time Equity</p>
            <p className="text-2xl font-bold text-red-400">Connection Error</p>
            <p className="text-xs text-gray-500">MetaAPI Unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  if (!accountInfo) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center animate-pulse">
            <Activity className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Real-Time Equity</p>
            <div className="h-8 bg-gray-700 rounded w-32 animate-pulse"></div>
            <p className="text-xs text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const equity = accountInfo.equity;
  const balance = accountInfo.balance;
  const unrealizedPnL = equity - balance;

  const getEquityColor = () => {
    if (equityChange === 'up') return 'text-green-400';
    if (equityChange === 'down') return 'text-red-400';
    return 'text-white';
  };

  const getIconColor = () => {
    if (equityChange === 'up') return 'bg-green-500/20 text-green-400';
    if (equityChange === 'down') return 'bg-red-500/20 text-red-400';
    return 'bg-blue-500/20 text-blue-400';
  };

  const getIcon = () => {
    if (equityChange === 'up') return <TrendingUp className="w-6 h-6" />;
    if (equityChange === 'down') return <TrendingDown className="w-6 h-6" />;
    return <Activity className="w-6 h-6" />;
  };

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 transition-all duration-300 ${
      showFlash ? (equityChange === 'up' ? 'ring-2 ring-green-500/50 bg-green-900/10' : 'ring-2 ring-red-500/50 bg-red-900/10') : ''
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300 ${getIconColor()}`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Real-Time Equity</p>
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400">LIVE</span>
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <p className={`text-2xl font-bold transition-colors duration-300 ${getEquityColor()}`}>
              {formatCurrency(equity)}
            </p>
            {unrealizedPnL !== 0 && (
              <span className={`text-sm font-medium ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(unrealizedPnL)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              Balance: {formatCurrency(balance)}
            </p>
            <p className="text-xs text-gray-400">
              Updates every 10s
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
