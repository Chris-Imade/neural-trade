'use client';

import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  BarChart3,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { BacktestTrade, BacktestEquityPoint } from '@/lib/backtesting-engine';
import { formatCurrency } from '@/lib/utils';

interface EquityChartProps {
  equityData: BacktestEquityPoint[];
  trades: BacktestTrade[];
  initialBalance: number;
  selectedTrade?: BacktestTrade | null;
  onTradeSelect?: (trade: BacktestTrade | null) => void;
}

export function EquityChart({ 
  equityData, 
  trades, 
  initialBalance, 
  selectedTrade,
  onTradeSelect 
}: EquityChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTradeMarkers, setShowTradeMarkers] = useState(true);
  const [showDrawdown, setShowDrawdown] = useState(true);

  // Calculate chart dimensions and scales
  const chartData = useMemo(() => {
    if (!equityData || !Array.isArray(equityData) || equityData.length === 0) return null;

    const minBalance = Math.min(...equityData.map(d => d.balance));
    const maxBalance = Math.max(...equityData.map(d => d.balance));
    const maxDrawdown = Math.max(...equityData.map(d => d.drawdown));
    
    const balanceRange = maxBalance - minBalance;
    
    // Handle case where all balances are the same (no trades)
    if (balanceRange === 0) {
      const padding = minBalance * 0.05; // 5% padding of the balance value
      const chartMinBalance = minBalance - padding;
      const chartMaxBalance = maxBalance + padding;
      const chartRange = chartMaxBalance - chartMinBalance;
      
      return {
        minBalance: chartMinBalance,
        maxBalance: chartMaxBalance,
        range: chartRange,
        maxDrawdown,
        startTime: new Date(equityData[0]?.timestamp || new Date()).getTime(),
        endTime: new Date(equityData[equityData.length - 1]?.timestamp || new Date()).getTime()
      };
    }
    
    const padding = balanceRange * 0.1; // 10% padding
    const chartMinBalance = minBalance - padding;
    const chartMaxBalance = maxBalance + padding;
    const chartRange = chartMaxBalance - chartMinBalance;

    return {
      minBalance: chartMinBalance,
      maxBalance: chartMaxBalance,
      range: chartRange,
      maxDrawdown,
      startTime: new Date(equityData[0]?.timestamp || new Date()).getTime(),
      endTime: new Date(equityData[equityData.length - 1]?.timestamp || new Date()).getTime()
    };
  }, [equityData]);

  if (!chartData || !equityData || equityData.length === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Chart Data</h3>
          <p className="text-gray-400">
            Run a backtest to see the equity curve and trade markers
          </p>
        </div>
      </div>
    );
  }

  const chartWidth = 800;
  const chartHeight = isFullscreen ? 500 : 300;
  const timeRange = chartData.endTime - chartData.startTime;

  // Convert data points to SVG coordinates
  const getX = (timestamp: string): number => {
    const time = new Date(timestamp).getTime();
    return ((time - chartData.startTime) / timeRange) * (chartWidth - 40) + 20;
  };

  const getY = (balance: number): number => {
    // Handle case where all balances are the same (no trades)
    if (chartData.range === 0) {
      return chartHeight / 2; // Center the line
    }
    return chartHeight - 40 - ((balance - chartData.minBalance) / chartData.range) * (chartHeight - 80);
  };

  const getDrawdownY = (drawdown: number): number => {
    const drawdownPercent = drawdown / initialBalance;
    return 20 + (Math.abs(drawdownPercent) * 0.3 * (chartHeight - 80)); // Scale drawdown to 30% of chart
  };

  // Create equity curve path
  const equityPath = equityData.map((point, index) => {
    const x = getX(point.timestamp);
    const y = getY(point.balance);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Create drawdown area path
  const drawdownPath = equityData.map((point, index) => {
    const x = getX(point.timestamp);
    const y = getDrawdownY(point.drawdown);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Create area under equity curve
  const lastPoint = equityData[equityData.length - 1];
  const firstPoint = equityData[0];
  const equityAreaPath = lastPoint && firstPoint ? 
    `${equityPath} L ${getX(lastPoint.timestamp)} ${getY(chartData.minBalance)} L ${getX(firstPoint.timestamp)} ${getY(chartData.minBalance)} Z` : 
    '';

  // Filter trades that have both entry and exit times
  const completedTrades = (trades || []).filter(trade => trade.exitTime);

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 ${
      isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Equity Curve & Trade Analysis</h3>
          <p className="text-sm text-gray-400">
            Account balance progression with trade entry/exit markers
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Chart Controls */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={showTradeMarkers}
                onChange={(e) => setShowTradeMarkers(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-500"
              />
              <span>Trade Markers</span>
            </label>
            
            <label className="flex items-center space-x-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={showDrawdown}
                onChange={(e) => setShowDrawdown(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
              />
              <span>Drawdown</span>
            </label>
          </div>
          
          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-4 overflow-x-auto">
        <svg 
          width={chartWidth} 
          height={chartHeight} 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5"/>
            </pattern>
            
            {/* Gradients */}
            <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
            </linearGradient>
            
            <linearGradient id="drawdownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Drawdown area */}
          {showDrawdown && (
            <>
              <path
                d={lastPoint && firstPoint ? `${drawdownPath} L ${getX(lastPoint.timestamp)} 20 L ${getX(firstPoint.timestamp)} 20 Z` : ''}
                fill="url(#drawdownGradient)"
              />
              <path
                d={drawdownPath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.7"
              />
            </>
          )}
          
          {/* Equity area */}
          <path
            d={equityAreaPath}
            fill="url(#equityGradient)"
          />
          
          {/* Equity line */}
          <path
            d={equityPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Initial balance line */}
          <line
            x1="20"
            y1={getY(initialBalance)}
            x2={chartWidth - 20}
            y2={getY(initialBalance)}
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="5,5"
            opacity="0.5"
          />
          
          {/* Trade markers */}
          {showTradeMarkers && completedTrades.map((trade) => {
            const entryX = getX(trade.entryTime);
            const exitX = getX(trade.exitTime!);
            const entryY = getY(
              equityData.find(d => new Date(d.timestamp).getTime() >= new Date(trade.entryTime).getTime())?.balance || initialBalance
            );
            const exitY = getY(
              equityData.find(d => new Date(d.timestamp).getTime() >= new Date(trade.exitTime!).getTime())?.balance || initialBalance
            );
            
            const isWin = (trade.pnl || 0) > 0;
            const isSelected = selectedTrade?.id === trade.id;
            
            return (
              <g key={trade.id}>
                {/* Trade duration line */}
                <line
                  x1={entryX}
                  y1={entryY}
                  x2={exitX}
                  y2={exitY}
                  stroke={isWin ? "#10b981" : "#ef4444"}
                  strokeWidth={isSelected ? "3" : "1"}
                  opacity={isSelected ? "1" : "0.6"}
                  strokeDasharray={isSelected ? "none" : "2,2"}
                />
                
                {/* Entry marker */}
                <circle
                  cx={entryX}
                  cy={entryY}
                  r={isSelected ? "6" : "4"}
                  fill={trade.action === 'buy' ? "#10b981" : "#ef4444"}
                  stroke="#ffffff"
                  strokeWidth="1"
                  className="cursor-pointer hover:r-6 transition-all"
                  onClick={() => onTradeSelect?.(trade)}
                >
                  <title>
                    {`Entry: ${trade.action.toUpperCase()} at ${trade.entryPrice.toFixed(5)}\n${new Date(trade.entryTime).toLocaleString()}`}
                  </title>
                </circle>
                
                {/* Exit marker */}
                <circle
                  cx={exitX}
                  cy={exitY}
                  r={isSelected ? "6" : "4"}
                  fill={isWin ? "#10b981" : "#ef4444"}
                  stroke="#ffffff"
                  strokeWidth="1"
                  className="cursor-pointer hover:r-6 transition-all"
                  onClick={() => onTradeSelect?.(trade)}
                >
                  <title>
                    {`Exit: ${trade.exitReason} at ${trade.exitPrice?.toFixed(5)}\nP&L: ${formatCurrency(trade.pnl || 0)}\n${new Date(trade.exitTime!).toLocaleString()}`}
                  </title>
                </circle>
                
                {/* Trade P&L label */}
                {isSelected && (
                  <text
                    x={(entryX + exitX) / 2}
                    y={Math.min(entryY, exitY) - 10}
                    textAnchor="middle"
                    fill={isWin ? "#10b981" : "#ef4444"}
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {formatCurrency(trade.pnl || 0)}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Y-axis labels */}
          <text x="15" y="25" fill="#9ca3af" fontSize="10" textAnchor="end">
            {formatCurrency(chartData.maxBalance)}
          </text>
          <text x="15" y={chartHeight / 2} fill="#9ca3af" fontSize="10" textAnchor="end">
            {formatCurrency((chartData.maxBalance + chartData.minBalance) / 2)}
          </text>
          <text x="15" y={chartHeight - 25} fill="#9ca3af" fontSize="10" textAnchor="end">
            {formatCurrency(chartData.minBalance)}
          </text>
          
          {/* Initial balance label */}
          <text x="15" y={getY(initialBalance) - 5} fill="#6b7280" fontSize="10" textAnchor="end">
            Initial
          </text>
          
          {/* X-axis labels */}
          {firstPoint && (
            <text x="20" y={chartHeight - 5} fill="#9ca3af" fontSize="10" textAnchor="start">
              {new Date(firstPoint.timestamp).toLocaleDateString()}
            </text>
          )}
          {lastPoint && (
            <text x={chartWidth - 20} y={chartHeight - 5} fill="#9ca3af" fontSize="10" textAnchor="end">
              {new Date(lastPoint.timestamp).toLocaleDateString()}
            </text>
          )}
        </svg>
      </div>

      {/* No Trades Message */}
      {(!trades || trades.length === 0) && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-yellow-400 text-sm">
              📊 No trades generated - Strategy conditions not met during this period
            </span>
          </div>
        </div>
      )}

      {/* Chart Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-green-400"></div>
          <span className="text-gray-400">Equity Curve</span>
        </div>
        
        {showDrawdown && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-red-400 opacity-70" style={{ borderTop: '1px dashed' }}></div>
            <span className="text-gray-400">Drawdown</span>
          </div>
        )}
        
        <div className="w-px h-4 bg-gray-600"></div>
        
        {showTradeMarkers && (
          <>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full border border-white"></div>
              <span className="text-gray-400">Buy Entry</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full border border-white"></div>
              <span className="text-gray-400">Sell Entry</span>
            </div>
          </>
        )}
        
        <div className="w-px h-4 bg-gray-600"></div>
        
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-gray-500 opacity-50" style={{ borderTop: '1px dashed' }}></div>
          <span className="text-gray-400">Initial Balance</span>
        </div>
      </div>

      {/* Selected Trade Info */}
      {selectedTrade && (
        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-white">Selected Trade Details</h4>
            <button
              onClick={() => onTradeSelect?.(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Action</div>
              <div className={`font-medium ${
                selectedTrade.action === 'buy' ? 'text-green-400' : 'text-red-400'
              }`}>
                {selectedTrade.action.toUpperCase()}
              </div>
            </div>
            
            <div>
              <div className="text-gray-400">P&L</div>
              <div className={`font-medium ${
                (selectedTrade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(selectedTrade.pnl || 0)}
              </div>
            </div>
            
            <div>
              <div className="text-gray-400">Duration</div>
              <div className="text-white">
                {selectedTrade.duration ? 
                  `${Math.floor(selectedTrade.duration / (1000 * 60))}m` : 
                  'N/A'
                }
              </div>
            </div>
            
            <div>
              <div className="text-gray-400">Exit Reason</div>
              <div className="text-white">
                {selectedTrade.exitReason?.replace('-', ' ').toUpperCase() || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
