'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronUp,
  RefreshCw,
  ExternalLink,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { LiveTrade } from '@/lib/trading-statistics';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface LiveTradesProps {
  className?: string;
}

interface TradesResponse {
  trades: LiveTrade[];
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  lastUpdate: string;
  error?: string;
}

export function LiveTrades({ className }: LiveTradesProps) {
  const [trades, setTrades] = useState<LiveTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'openTime' | 'profit' | 'duration'>('openTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'open' | 'closed' | 'wins' | 'losses'>('all');
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadTrades();
    
    // Refresh every 10 seconds for live updates
    const interval = setInterval(() => {
      refreshTrades();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadTrades = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading REAL trades from MetaAPI...');
      
      const response = await fetch('/api/live/trades');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: TradesResponse = await response.json();
      
      if (data.error) {
        setError(data.error);
        setTrades([]);
        console.error('❌ API returned error:', data.error);
      } else {
        setTrades(data.trades);
        setLastRefresh(new Date());
        console.log(`✅ Loaded ${data.trades.length} REAL trades from MetaAPI`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setTrades([]);
      console.error('❌ Failed to load trades:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshTrades = async () => {
    try {
      console.log('🔄 Refreshing trades...');
      const response = await fetch('/api/live/trades');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: TradesResponse = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setTrades(data.trades);
        setLastRefresh(new Date());
        setError(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Failed to refresh trades:', errorMessage);
    }
  };

  // Filter trades
  const filteredTrades = trades.filter(trade => {
    if (filterBy === 'open') return trade.status === 'open';
    if (filterBy === 'closed') return trade.status === 'closed';
    if (filterBy === 'wins') return trade.status === 'closed' && (trade.profit || 0) > 0;
    if (filterBy === 'losses') return trade.status === 'closed' && (trade.profit || 0) < 0;
    return true;
  });

  // Sort trades
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortBy) {
      case 'openTime':
        aValue = new Date(a.openTime).getTime();
        bValue = new Date(b.openTime).getTime();
        break;
      case 'profit':
        aValue = a.profit || 0;
        bValue = b.profit || 0;
        break;
      case 'duration':
        aValue = a.duration || 0;
        bValue = b.duration || 0;
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

  if (loading) {
    return (
      <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
          <h3 className="text-lg font-semibold text-white">Loading Real Trades from MetaAPI...</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Fetching live trading data from your MetaAPI account...
        </p>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state - show empty state instead of dummy data
  if (error) {
    return (
      <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <WifiOff className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">MetaAPI Connection Failed</h3>
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-medium">Connection Error</span>
          </div>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
        <div className="text-center py-8">
          <WifiOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-400 mb-2">No Trade Data Available</h4>
          <p className="text-gray-500 text-sm mb-4">
            Unable to fetch live trading data from MetaAPI.<br />
            Please check your connection and credentials.
          </p>
          <button 
            onClick={loadTrades}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // If no trades, still show the component with filters and table structure
  // This ensures all filters work even when there are no trades

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-white">Live Trade History</h3>
            <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
              ✅ REAL METAAPI DATA
            </div>
          </div>
          <p className="text-sm text-gray-400">
            {filteredTrades.length} of {trades.length} trades shown • Last update: {lastRefresh.toLocaleTimeString()}
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
            <option value="open">Open Positions</option>
            <option value="closed">Closed Trades</option>
            <option value="wins">Winning Trades</option>
            <option value="losses">Losing Trades</option>
          </select>
          
          {/* Refresh */}
          <button 
            onClick={refreshTrades}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refresh</span>
          </button>
          
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
                onClick={() => handleSort('openTime')}
              >
                <div className="flex items-center space-x-1">
                  <span>Open Time</span>
                  <SortIcon column="openTime" />
                </div>
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Trade Details
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Prices
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                SL/TP
              </th>
              <th 
                className="text-left py-3 px-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('profit')}
              >
                <div className="flex items-center space-x-1">
                  <span>P&L</span>
                  <SortIcon column="profit" />
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
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTrades.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    {trades.length === 0 
                      ? "No trading history available yet. Start trading to see your trades here."
                      : `No trades match the current filter: "${filterBy}"`
                    }
                  </p>
                </td>
              </tr>
            ) : (
              sortedTrades.map((trade) => (
                <React.Fragment key={trade.id}>
                  <tr className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="text-white font-medium">
                          {formatDateTime(trade.openTime)}
                        </div>
                        {trade.closeTime && (
                          <div className="text-gray-400 text-xs">
                            Closed: {formatDateTime(trade.closeTime)}
                          </div>
                        )}
                      </div>
                    </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        trade.type === 'buy' ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      <div className="text-sm">
                        <div className={`font-medium ${
                          trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.type.toUpperCase()} {trade.symbol}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {trade.volume} lots
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="text-white font-medium">
                        Open: {trade.openPrice.toFixed(5)}
                      </div>
                      {trade.currentPrice && trade.status === 'open' && (
                        <div className="text-blue-400 text-xs">
                          Current: {trade.currentPrice.toFixed(5)}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="text-xs">
                      {trade.stopLoss && (
                        <div className="text-red-400">
                          SL: {trade.stopLoss.toFixed(5)}
                        </div>
                      )}
                      {trade.takeProfit && (
                        <div className="text-green-400">
                          TP: {trade.takeProfit.toFixed(5)}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className={`text-sm font-medium ${
                      (trade.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(trade.profit || 0)}
                    </div>
                    {trade.swap && (
                      <div className="text-xs text-gray-400">
                        Swap: {formatCurrency(trade.swap)}
                      </div>
                    )}
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-400">
                      {trade.duration ? formatDuration(trade.duration) : 
                       trade.status === 'open' ? 'Running...' : '-'}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.status === 'open' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {trade.status.toUpperCase()}
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
                      <button
                        className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                        title="View in MetaAPI"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Details */}
                {expandedTrade === trade.id && (
                  <tr>
                    <td colSpan={8} className="py-4 px-4 bg-gray-800/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Trade Details */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Trade Details</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Trade ID:</span>
                              <span className="text-white font-mono">{trade.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Magic Number:</span>
                              <span className="text-white">{trade.magic || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Comment:</span>
                              <span className="text-white">{trade.comment || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Financial Details */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Financial Details</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Profit:</span>
                              <span className={`${(trade.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(trade.profit || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Swap:</span>
                              <span className="text-white">{formatCurrency(trade.swap || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Commission:</span>
                              <span className="text-white">{formatCurrency(trade.commission || 0)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Timing */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Timing</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Opened:</span>
                              <span className="text-white">{new Date(trade.openTime).toLocaleString()}</span>
                            </div>
                            {trade.closeTime && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Closed:</span>
                                <span className="text-white">{new Date(trade.closeTime).toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-400">Duration:</span>
                              <span className="text-white">
                                {trade.duration ? formatDuration(trade.duration) : 'Ongoing'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {trades.filter(t => t.status === 'closed' && (t.profit || 0) > 0).length}
            </div>
            <div className="text-sm text-gray-400">Winners</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {trades.filter(t => t.status === 'closed' && (t.profit || 0) < 0).length}
            </div>
            <div className="text-sm text-gray-400">Losers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {trades.filter(t => t.status === 'open').length}
            </div>
            <div className="text-sm text-gray-400">Open</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {formatCurrency(trades.reduce((sum, t) => sum + (t.profit || 0), 0))}
            </div>
            <div className="text-sm text-gray-400">Total P&L</div>
          </div>
        </div>
      </div>
    </div>
  );
}
