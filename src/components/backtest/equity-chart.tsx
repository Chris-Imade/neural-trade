import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Maximize2,
  Minimize2,
  Activity,
  AlertTriangle,
  Award,
  Clock,
  DollarSign,
  Filter,
  Layers,
  TrendingUpIcon,
  Eye,
  EyeOff,
  Target
} from 'lucide-react';

// Mock types for the component to work standalone
interface BacktestTrade {
  id: string;
  action: 'buy' | 'sell';
  entryTime: string;
  exitTime?: string;
  entryPrice?: number;
  exitPrice?: number;
  pnl?: number;
  duration?: number;
  exitReason?: string;
  size?: number;
  commission?: number;
}

interface BacktestEquityPoint {
  timestamp: string;
  balance: number;
  drawdown?: number;
  highWaterMark?: number;
}

interface EquityChartProps {
  equityData: BacktestEquityPoint[];
  trades: BacktestTrade[];
  initialBalance: number;
  selectedTrade?: BacktestTrade | null;
  onTradeSelect?: (trade: BacktestTrade | null) => void;
}

// Enhanced formatCurrency function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Advanced metrics calculator
const calculateAdvancedMetrics = (equityData: BacktestEquityPoint[], trades: BacktestTrade[], initialBalance: number) => {
  if (!equityData.length || !trades.length) {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      profitFactor: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      volatility: 0,
      calmarRatio: 0
    };
  }

  const finalBalance = equityData[equityData.length - 1]?.balance || initialBalance;
  const totalReturn = ((finalBalance - initialBalance) / initialBalance) * 100;
  
  // Calculate time period in years
  const startDate = new Date(equityData[0].timestamp);
  const endDate = new Date(equityData[equityData.length - 1].timestamp);
  const timePeriodYears = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  
  const annualizedReturn = timePeriodYears > 0 ? (Math.pow(finalBalance / initialBalance, 1 / timePeriodYears) - 1) * 100 : 0;
  
  // Max drawdown
  const maxDrawdown = Math.max(...equityData.map(p => p.drawdown || 0)) / initialBalance * 100;
  
  // Win/Loss statistics
  const completedTrades = trades.filter(t => t.pnl !== undefined);
  const wins = completedTrades.filter(t => (t.pnl || 0) > 0);
  const losses = completedTrades.filter(t => (t.pnl || 0) < 0);
  
  const winRate = completedTrades.length > 0 ? (wins.length / completedTrades.length) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length) : 0;
  
  const profitFactor = (avgLoss > 0 && wins.length > 0) ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
  
  // Consecutive wins/losses
  let currentWinStreak = 0, currentLossStreak = 0;
  let maxWinStreak = 0, maxLossStreak = 0;
  
  completedTrades.forEach(trade => {
    if ((trade.pnl || 0) > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    }
  });
  
  // Volatility (standard deviation of daily returns)
  const dailyReturns = [];
  for (let i = 1; i < equityData.length; i++) {
    const prevBalance = equityData[i-1].balance;
    const currentBalance = equityData[i].balance;
    if (prevBalance > 0) {
      dailyReturns.push((currentBalance - prevBalance) / prevBalance);
    }
  }
  
  const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const volatility = Math.sqrt(
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length
  ) * Math.sqrt(252) * 100; // Annualized volatility
  
  // Sharpe Ratio (assuming 2% risk-free rate)
  const riskFreeRate = 2;
  const excessReturn = annualizedReturn - riskFreeRate;
  const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;
  
  // Calmar Ratio
  const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

  return {
    totalReturn,
    annualizedReturn,
    maxDrawdown,
    sharpeRatio,
    profitFactor,
    winRate,
    avgWin,
    avgLoss,
    maxConsecutiveWins: maxWinStreak,
    maxConsecutiveLosses: maxLossStreak,
    volatility,
    calmarRatio
  };
};

export default function EnhancedEquityChart({ 
  equityData = [], 
  trades = [], 
  initialBalance = 10000, 
  selectedTrade,
  onTradeSelect 
}: EquityChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTradeMarkers, setShowTradeMarkers] = useState(true);
  const [showDrawdown, setShowDrawdown] = useState(true);
  const [showVolume, setShowVolume] = useState(false);
  const [timeframeFilter, setTimeframeFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('all'); // all, wins, losses
  const [hoveredTrade, setHoveredTrade] = useState<BacktestTrade | null>(null);
  const [showMetrics, setShowMetrics] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');

  // Advanced metrics calculation
  const metrics = useMemo(() => {
    return calculateAdvancedMetrics(equityData, trades, initialBalance);
  }, [equityData, trades, initialBalance]);

  // Chart data processing with memoization
  const chartData = useMemo(() => {
    if (!equityData || equityData.length === 0) return null;

    const balances = equityData.map(p => p.balance).filter(b => b != null);
    const drawdowns = equityData.map(p => p.drawdown || 0);
    
    const minBalance = Math.min(...balances, initialBalance);
    const maxBalance = Math.max(...balances, initialBalance);
    const maxDrawdownValue = Math.max(...drawdowns);
    
    const balanceRange = maxBalance - minBalance;
    
    // Handle case where all balances are the same
    if (balanceRange === 0) {
      const padding = Math.max(minBalance * 0.1, 100);
      return {
        minBalance: minBalance - padding,
        maxBalance: maxBalance + padding,
        range: padding * 2,
        maxDrawdown: maxDrawdownValue,
        startTime: new Date(equityData[0]?.timestamp || new Date()).getTime(),
        endTime: new Date(equityData[equityData.length - 1]?.timestamp || new Date()).getTime()
      };
    }
    
    const padding = Math.max(balanceRange * 0.15, 100);
    return {
      minBalance: minBalance - padding,
      maxBalance: maxBalance + padding,
      range: balanceRange + (padding * 2),
      maxDrawdown: maxDrawdownValue,
      startTime: new Date(equityData[0]?.timestamp || new Date()).getTime(),
      endTime: new Date(equityData[equityData.length - 1]?.timestamp || new Date()).getTime()
    };
  }, [equityData, initialBalance]);

  // Filter trades based on current filters
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      if (!trade.exitTime) return false;
      
      // Trade type filter
      if (tradeFilter === 'wins' && (trade.pnl || 0) <= 0) return false;
      if (tradeFilter === 'losses' && (trade.pnl || 0) > 0) return false;
      
      // Timeframe filter (implement based on your needs)
      if (timeframeFilter !== 'all') {
        // Add timeframe filtering logic here
      }
      
      return true;
    });
  }, [trades, tradeFilter, timeframeFilter]);

  // Chart dimensions and coordinate functions (MOVED BEFORE EARLY RETURN)
  const chartWidth = 1000;
  const chartHeight = isFullscreen ? 600 : 400;
  const timeRange = chartData ? (chartData.endTime - chartData.startTime || 1) : 1;

  // Coordinate conversion functions (MOVED BEFORE EARLY RETURN)
  const getX = useCallback((timestamp: string): number => {
    if (!chartData) return 0;
    const time = new Date(timestamp).getTime();
    return ((time - chartData.startTime) / timeRange) * (chartWidth - 80) + 60;
  }, [chartData, timeRange, chartWidth]);

  const getY = useCallback((balance: number): number => {
    if (!chartData || chartData.range === 0) return chartHeight / 2;
    const clampedBalance = Math.max(chartData.minBalance, Math.min(chartData.maxBalance, balance));
    return chartHeight - 60 - ((clampedBalance - chartData.minBalance) / chartData.range) * (chartHeight - 120);
  }, [chartData, chartHeight]);

  const getDrawdownY = useCallback((drawdown: number): number => {
    const drawdownPercent = drawdown / initialBalance;
    return 40 + (Math.abs(drawdownPercent) * 0.25 * (chartHeight - 120));
  }, [initialBalance, chartHeight]);

  if (!chartData || !equityData || equityData.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl">
        <div className="text-center py-16">
          <div className="relative">
            <BarChart3 className="w-20 h-20 text-gray-500 mx-auto mb-6" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Ready for Analysis</h3>
          <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
            Run your trading strategy backtest to see detailed performance metrics, 
            equity curves, and trade analysis that will help improve your results.
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Award className="w-4 h-4" />
              <span>Performance Metrics</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Target className="w-4 h-4" />
              <span>Risk Analysis</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create paths for visualization
  const equityPath = equityData.map((point, index) => {
    const x = getX(point.timestamp);
    const y = getY(point.balance || 0);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const drawdownPath = equityData.map((point, index) => {
    const x = getX(point.timestamp);
    const y = getDrawdownY(point.drawdown || 0);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const lastPoint = equityData[equityData.length - 1];
  const firstPoint = equityData[0];
  const equityAreaPath = lastPoint && firstPoint ? 
    `${equityPath} L ${getX(lastPoint.timestamp)} ${getY(chartData.minBalance)} L ${getX(firstPoint.timestamp)} ${getY(chartData.minBalance)} Z` : 
    '';

  return (
    <div className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl ${
      isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : ''
    }`}>
      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
                <TrendingUpIcon className="w-6 h-6 text-white" />
              </div>
              <span>Advanced Equity Analysis</span>
            </h3>
            <p className="text-gray-400 mt-1">
              Comprehensive trading performance with institutional-grade metrics
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Enhanced Controls */}
            <div className="flex items-center space-x-3 bg-gray-800/50 rounded-xl p-3">
              <select
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-sm text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Trades</option>
                <option value="wins">Wins Only</option>
                <option value="losses">Losses Only</option>
              </select>
              
              <div className="h-4 w-px bg-gray-600"></div>
              
              <label className="flex items-center space-x-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={showTradeMarkers}
                  onChange={(e) => setShowTradeMarkers(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-offset-0"
                />
                <span>Markers</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={showDrawdown}
                  onChange={(e) => setShowDrawdown(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500 focus:ring-offset-0"
                />
                <span>Drawdown</span>
              </label>
            </div>
            
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-800/50 rounded-lg hover:bg-gray-700/50"
              title={showMetrics ? "Hide Metrics" : "Show Metrics"}
            >
              {showMetrics ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-800/50 rounded-lg hover:bg-gray-700/50"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Performance Metrics Dashboard */}
        {showMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-green-300">Total Return</span>
              </div>
              <div className="text-xl font-bold text-white">
                {metrics.totalReturn > 0 ? '+' : ''}{metrics.totalReturn.toFixed(2)}%
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-blue-300">Sharpe Ratio</span>
              </div>
              <div className="text-xl font-bold text-white">
                {metrics.sharpeRatio.toFixed(2)}
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-purple-300">Win Rate</span>
              </div>
              <div className="text-xl font-bold text-white">
                {metrics.winRate.toFixed(1)}%
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-red-300">Max Drawdown</span>
              </div>
              <div className="text-xl font-bold text-white">
                -{metrics.maxDrawdown.toFixed(2)}%
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-medium text-yellow-300">Profit Factor</span>
              </div>
              <div className="text-xl font-bold text-white">
                {metrics.profitFactor.toFixed(2)}
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 border border-indigo-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium text-indigo-300">Calmar Ratio</span>
              </div>
              <div className="text-xl font-bold text-white">
                {metrics.calmarRatio.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Chart */}
      <div className="p-6">
        <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 p-6 overflow-x-auto">
          <svg 
            width={chartWidth} 
            height={chartHeight} 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto"
          >
            {/* Enhanced Gradients and Patterns */}
            <defs>
              <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 25" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
              
              <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#059669" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#047857" stopOpacity="0.1"/>
              </linearGradient>
              
              <linearGradient id="drawdownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.1"/>
              </linearGradient>

              {/* Glow effects */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Enhanced Drawdown */}
            {showDrawdown && (
              <>
                <path
                  d={lastPoint && firstPoint ? `${drawdownPath} L ${getX(lastPoint.timestamp)} 40 L ${getX(firstPoint.timestamp)} 40 Z` : ''}
                  fill="url(#drawdownGradient)"
                />
                <path
                  d={drawdownPath}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  opacity="0.8"
                />
              </>
            )}
            
            {/* Enhanced Equity Curve */}
            <path
              d={equityAreaPath}
              fill="url(#equityGradient)"
            />
            
            <path
              d={equityPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            
            {/* Enhanced Initial Balance Line */}
            <line
              x1="60"
              y1={getY(initialBalance)}
              x2={chartWidth - 20}
              y2={getY(initialBalance)}
              stroke="#6b7280"
              strokeWidth="1"
              strokeDasharray="8,4"
              opacity="0.6"
            />
            
            {/* Enhanced Trade Markers */}
            {showTradeMarkers && filteredTrades.map((trade, index) => {
              if (!trade || !trade.entryTime || !trade.exitTime) return null;
              
              const entryX = getX(trade.entryTime);
              const exitX = getX(trade.exitTime);
              
              const entryEquityPoint = equityData.find(d => new Date(d.timestamp).getTime() >= new Date(trade.entryTime).getTime());
              const exitEquityPoint = equityData.find(d => new Date(d.timestamp).getTime() >= new Date(trade.exitTime!).getTime());
              
              const entryY = getY(entryEquityPoint?.balance ?? initialBalance);
              const exitY = getY(exitEquityPoint?.balance ?? initialBalance);
              
              const isWin = (trade.pnl || 0) > 0;
              const isSelected = selectedTrade?.id === trade.id;
              const isHovered = hoveredTrade?.id === trade.id;
              
              const markerSize = isSelected ? 8 : isHovered ? 6 : 4;
              const lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
              
              return (
                <g key={`trade-${trade.id}-${index}`}>
                  {/* Enhanced Trade Duration Line */}
                  <line
                    x1={entryX}
                    y1={entryY}
                    x2={exitX}
                    y2={exitY}
                    stroke={isWin ? "#10b981" : "#ef4444"}
                    strokeWidth={lineWidth}
                    opacity={isSelected ? "1" : "0.7"}
                    strokeDasharray={isSelected ? "none" : "3,3"}
                    filter={isSelected ? "url(#glow)" : "none"}
                  />
                  
                  {/* Enhanced Entry Marker */}
                  <circle
                    cx={entryX}
                    cy={entryY}
                    r={markerSize}
                    fill={trade.action === 'buy' ? "#10b981" : "#ef4444"}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-200"
                    filter={isSelected || isHovered ? "url(#glow)" : "none"}
                    onClick={() => onTradeSelect?.(trade)}
                    onMouseEnter={() => setHoveredTrade(trade)}
                    onMouseLeave={() => setHoveredTrade(null)}
                  />
                  
                  {/* Enhanced Exit Marker */}
                  <circle
                    cx={exitX}
                    cy={exitY}
                    r={markerSize}
                    fill={isWin ? "#10b981" : "#ef4444"}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-200"
                    filter={isSelected || isHovered ? "url(#glow)" : "none"}
                    onClick={() => onTradeSelect?.(trade)}
                    onMouseEnter={() => setHoveredTrade(trade)}
                    onMouseLeave={() => setHoveredTrade(null)}
                  />
                  
                  {/* Enhanced P&L Label */}
                  {(isSelected || isHovered) && (
                    <g>
                      <rect
                        x={(entryX + exitX) / 2 - 40}
                        y={Math.min(entryY, exitY) - 25}
                        width="80"
                        height="16"
                        fill="#000000"
                        fillOpacity="0.8"
                        rx="8"
                      />
                      <text
                        x={(entryX + exitX) / 2}
                        y={Math.min(entryY, exitY) - 12}
                        textAnchor="middle"
                        fill={isWin ? "#10b981" : "#ef4444"}
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {formatCurrency(trade.pnl || 0)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            
            {/* Enhanced Grid Lines and Labels */}
            {Array.from({ length: 6 }, (_, i) => {
              const ratio = i / 5;
              const value = chartData.minBalance + (chartData.maxBalance - chartData.minBalance) * ratio;
              const y = getY(value);
              return (
                <g key={`y-grid-${i}`}>
                  <line
                    x1="60"
                    y1={y}
                    x2={chartWidth - 20}
                    y2={y}
                    stroke="#374151"
                    strokeWidth="0.5"
                    strokeDasharray="3,3"
                    opacity="0.4"
                  />
                  <text x="50" y={y + 4} fill="#9ca3af" fontSize="10" textAnchor="end">
                    {formatCurrency(value)}
                  </text>
                </g>
              );
            })}
            
            {/* Enhanced Initial Balance Label */}
            <g>
              <rect
                x="5"
                y={getY(initialBalance) - 10}
                width="45"
                height="16"
                fill="#1f2937"
                fillOpacity="0.9"
                rx="4"
              />
              <text x="27" y={getY(initialBalance) + 1} fill="#9ca3af" fontSize="9" textAnchor="middle" fontWeight="bold">
                INITIAL
              </text>
            </g>
            
            {/* Enhanced Time Labels */}
            {firstPoint && (
              <text x="60" y={chartHeight - 10} fill="#9ca3af" fontSize="11" textAnchor="start" fontWeight="medium">
                {new Date(firstPoint.timestamp).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: '2-digit'
                })}
              </text>
            )}
            {lastPoint && (
              <text x={chartWidth - 20} y={chartHeight - 10} fill="#9ca3af" fontSize="11" textAnchor="end" fontWeight="medium">
                {new Date(lastPoint.timestamp).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: '2-digit'
                })}
              </text>
            )}
            
            {/* Performance Indicator */}
            <g transform={`translate(${chartWidth - 150}, 30)`}>
              <rect width="130" height="60" fill="#111827" fillOpacity="0.9" rx="8" stroke="#374151" strokeWidth="1"/>
              <text x="65" y="15" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="bold">
                PERFORMANCE
              </text>
              <text x="65" y="32" textAnchor="middle" fill={metrics.totalReturn >= 0 ? "#10b981" : "#ef4444"} fontSize="16" fontWeight="bold">
                {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn.toFixed(1)}%
              </text>
              <text x="65" y="47" textAnchor="middle" fill="#6b7280" fontSize="9">
                {trades.filter(t => t.pnl !== undefined).length} trades
              </text>
            </g>
          </svg>
        </div>

        {/* Enhanced Status Messages */}
        {(!trades || trades.length === 0) && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3" />
              <span className="text-yellow-300 font-medium">
                No trades generated - Strategy conditions not met during this period
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              Consider adjusting your strategy parameters or testing with different market conditions
            </p>
          </div>
        )}

        {/* Enhanced Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-sm bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-1 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
            <span className="text-gray-300 font-medium">Equity Curve</span>
          </div>
          
          {showDrawdown && (
            <div className="flex items-center space-x-3">
              <div className="w-6 h-1 bg-red-400 opacity-70 rounded-full" style={{ borderTop: '1px dashed' }}></div>
              <span className="text-gray-300 font-medium">Drawdown</span>
            </div>
          )}
          
          <div className="w-px h-6 bg-gray-600"></div>
          
          {showTradeMarkers && (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg"></div>
                <span className="text-gray-300 font-medium">Buy Entry</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-400 rounded-full border-2 border-white shadow-lg"></div>
                <span className="text-gray-300 font-medium">Sell Entry</span>
              </div>
            </>
          )}
          
          <div className="w-px h-6 bg-gray-600"></div>
          
          <div className="flex items-center space-x-3">
            <div className="w-6 h-1 bg-gray-500 opacity-60 rounded-full" style={{ borderTop: '1px dashed' }}></div>
            <span className="text-gray-300 font-medium">Initial Balance</span>
          </div>
        </div>

        {/* Enhanced Selected Trade Info */}
        {selectedTrade && (
          <div className="mt-6 p-6 bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-2xl border border-gray-600/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-white flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${selectedTrade.action === 'buy' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>Trade #{selectedTrade.id}</span>
              </h4>
              <button
                onClick={() => onTradeSelect?.(null)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              <div className="bg-gray-700/50 rounded-xl p-3">
                <div className="text-gray-400 text-xs font-medium mb-1">ACTION</div>
                <div className={`font-bold text-lg ${
                  selectedTrade.action === 'buy' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {selectedTrade.action.toUpperCase()}
                </div>
              </div>
              
              <div className="bg-gray-700/50 rounded-xl p-3">
                <div className="text-gray-400 text-xs font-medium mb-1">P&L</div>
                <div className={`font-bold text-lg ${
                  (selectedTrade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(selectedTrade.pnl || 0) >= 0 ? '+' : ''}{formatCurrency(selectedTrade.pnl || 0)}
                </div>
              </div>
              
              <div className="bg-gray-700/50 rounded-xl p-3">
                <div className="text-gray-400 text-xs font-medium mb-1">DURATION</div>
                <div className="text-white font-bold text-lg">
                  {selectedTrade.duration ? 
                    `${Math.floor(selectedTrade.duration / (1000 * 60))}m` : 
                    'N/A'
                  }
                </div>
              </div>
              
              <div className="bg-gray-700/50 rounded-xl p-3">
                <div className="text-gray-400 text-xs font-medium mb-1">EXIT REASON</div>
                <div className="text-white font-bold">
                  {(selectedTrade.exitReason?.replace('-', ' ') || 'N/A').toUpperCase()}
                </div>
              </div>
              
              <div className="bg-gray-700/50 rounded-xl p-3">
                <div className="text-gray-400 text-xs font-medium mb-1">ENTRY PRICE</div>
                <div className="text-white font-bold">
                  ${(selectedTrade.entryPrice || 0).toFixed(5)}
                </div>
              </div>
              
              <div className="bg-gray-700/50 rounded-xl p-3">
                <div className="text-gray-400 text-xs font-medium mb-1">EXIT PRICE</div>
                <div className="text-white font-bold">
                  ${(selectedTrade.exitPrice || 0).toFixed(5)}
                </div>
              </div>
            </div>
            
            {/* Trade Timeline */}
            <div className="mt-4 pt-4 border-t border-gray-600/50">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3" />
                  <span>Entry: {new Date(selectedTrade.entryTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3" />
                  <span>Exit: {selectedTrade.exitTime ? new Date(selectedTrade.exitTime).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Insights Panel */}
        {showMetrics && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Metrics */}
            <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-500/20 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>Risk Analysis</span>
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Volatility (Annualized)</span>
                  <span className="text-white font-bold">{metrics.volatility.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Max Consecutive Losses</span>
                  <span className="text-red-400 font-bold">{metrics.maxConsecutiveLosses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Average Loss</span>
                  <span className="text-red-400 font-bold">{formatCurrency(metrics.avgLoss)}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/20 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <Award className="w-5 h-5 text-green-400" />
                <span>Performance Insights</span>
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Annualized Return</span>
                  <span className="text-green-400 font-bold">
                    {metrics.annualizedReturn >= 0 ? '+' : ''}{metrics.annualizedReturn.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Max Consecutive Wins</span>
                  <span className="text-green-400 font-bold">{metrics.maxConsecutiveWins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Average Win</span>
                  <span className="text-green-400 font-bold">{formatCurrency(metrics.avgWin)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pro Tips for Better Trading */}
        <div className="mt-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span>Strategy Optimization Tips</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-300">
                  <strong className="text-white">Sharpe Ratio {'>'}1.0:</strong> Excellent risk-adjusted returns
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-300">
                  <strong className="text-white">Win Rate {'>'}50%:</strong> Good strategy consistency
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-300">
                  <strong className="text-white">Profit Factor {'>'}1.5:</strong> Strong profitability
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-300">
                  <strong className="text-white">Max Drawdown {'<'}20%:</strong> Acceptable risk level
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}