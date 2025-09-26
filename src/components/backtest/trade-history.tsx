'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Target,
  Shield,
  Filter,
  Download,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { BacktestTrade } from '@/lib/backtesting-engine';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface TradeHistoryProps {
  trades: BacktestTrade[];
  onTradeSelect?: (trade: BacktestTrade) => void;
}

export function TradeHistory({ trades, onTradeSelect }: TradeHistoryProps) {
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'duration' | 'pips'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'wins' | 'losses'>('all');
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);

  // Filter trades
  const filteredTrades = trades.filter(trade => {
    if (filterBy === 'wins') return (trade.pnl || 0) > 0;
    if (filterBy === 'losses') return (trade.pnl || 0) < 0;
    return true;
  });

  // Sort trades
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortBy) {
      case 'date':
        aValue = new Date(a.entryTime).getTime();
        bValue = new Date(b.entryTime).getTime();
        break;
      case 'pnl':
        aValue = a.pnl || 0;
        bValue = b.pnl || 0;
        break;
      case 'duration':
        aValue = a.duration || 0;
        bValue = b.duration || 0;
        break;
      case 'pips':
        aValue = a.pnlPips || 0;
        bValue = b.pnlPips || 0;
        break;
      default:
        aValue = 0;
        bValue = 0;
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatDateTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (trades.length === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Trades Yet</h3>
          <p className="text-gray-400">
            Run a backtest to see detailed trade history and analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Trade History</h3>
          <p className="text-sm text-gray-400">
            {filteredTrades.length} of {trades.length} trades shown
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
          >
            <option value="all">All Trades</option>
            <option value="wins">Winning Trades</option>
            <option value="losses">Losing Trades</option>
          </select>
          
          {/* Export */}
          <button className="flex items-center space-x-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
        </div>
      </div>

      {/* Trade Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th 
                className="text-left py-3 px-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center space-x-1">
                  <span>Date & Time</span>
                  <SortIcon column="date" />
                </div>
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Trade
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Entry/Exit
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                SL/TP
              </th>
              <th 
                className="text-left py-3 px-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('pnl')}
              >
                <div className="flex items-center space-x-1">
                  <span>P&L</span>
                  <SortIcon column="pnl" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('pips')}
              >
                <div className="flex items-center space-x-1">
                  <span>Pips</span>
                  <SortIcon column="pips" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('duration')}
              >
                <div className="flex items-center space-x-1">
                  <span>Duration</span>
                  <SortIcon column="duration" />
                </div>
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTrades.map((trade) => (
              <React.Fragment key={trade.id}>
                <tr className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="text-white font-medium">
                        {formatDateTime(trade.entryTime)}
                      </div>
                      {trade.exitTime && (
                        <div className="text-gray-400 text-xs">
                          Exit: {formatDateTime(trade.exitTime)}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        trade.action === 'buy' ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      <div className="text-sm">
                        <div className={`font-medium ${
                          trade.action === 'buy' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.action.toUpperCase()}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {trade.volume || 0.1} lots
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="text-white font-medium">
                        {(trade.entryPrice || 0).toFixed(5)}
                      </div>
                      {trade.exitPrice && (
                        <div className="text-gray-400 text-xs">
                          {(trade.exitPrice || 0).toFixed(5)}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="text-xs">
                      <div className="text-red-400">
                        SL: {trade.stopLoss ? trade.stopLoss.toFixed(5) : 'N/A'}
                      </div>
                      <div className="text-green-400">
                        TP: {trade.takeProfit ? trade.takeProfit.toFixed(5) : 'N/A'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className={`text-sm font-medium ${
                      (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(trade.pnl || 0)}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className={`text-sm font-medium ${
                      (trade.pnlPips || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {(trade.pnlPips || 0).toFixed(1)}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-400">
                      {trade.duration ? formatDuration(trade.duration) : '-'}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setExpandedTrade(
                          expandedTrade === trade.id ? null : trade.id
                        )}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {onTradeSelect && (
                        <button
                          onClick={() => onTradeSelect(trade)}
                          className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                          title="View on Chart"
                        >
                          <Target className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Details */}
                {expandedTrade === trade.id && (
                  <tr>
                    <td colSpan={8} className="py-4 px-4 bg-gray-800/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Strategy Info */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Strategy Details</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Strategy:</span>
                              <span className="text-white">{trade.strategy}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Confidence:</span>
                              <span className="text-white">{trade.confidence}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Exit Reason:</span>
                              <span className={`${
                                trade.exitReason === 'take-profit' ? 'text-green-400' : 
                                trade.exitReason === 'stop-loss' ? 'text-red-400' : 'text-gray-400'
                              }`}>
                                {trade.exitReason?.replace('-', ' ').toUpperCase() || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Risk Analysis */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Risk Analysis</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Max Favorable:</span>
                              <span className="text-green-400">
                                {formatCurrency(trade.maxFavorableExcursion || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Max Adverse:</span>
                              <span className="text-red-400">
                                {formatCurrency(trade.maxAdverseExcursion || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Risk/Reward:</span>
                              <span className="text-white">
                                {trade.takeProfit && trade.stopLoss && trade.entryPrice ? 
                                  `1:${((Math.abs(trade.takeProfit - trade.entryPrice) / Math.abs(trade.stopLoss - trade.entryPrice)) || 0).toFixed(2)}` :
                                  'N/A'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Trade Reason */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Trade Reason</h4>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {trade.reason || 'Strategy signal detected'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {trades.filter(t => (t.pnl || 0) > 0).length}
            </div>
            <div className="text-sm text-gray-400">Winners</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {trades.filter(t => (t.pnl || 0) < 0).length}
            </div>
            <div className="text-sm text-gray-400">Losers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {trades.length > 0 ? 
                formatDuration(trades.reduce((sum, t) => sum + (t.duration || 0), 0) / trades.length) : 
                '0m'
              }
            </div>
            <div className="text-sm text-gray-400">Avg Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {trades.length > 0 ? 
                ((trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100).toFixed(1) : 
                '0.0'
              }%
            </div>
            <div className="text-sm text-gray-400">Win Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add React import
import React from 'react';
