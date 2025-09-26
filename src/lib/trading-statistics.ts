// Real Trading Statistics from MetaAPI
// Connects to live trading account for authentic data

export interface LiveTrade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  openTime: string;
  closeTime?: string;
  profit?: number;
  swap?: number;
  commission?: number;
  comment?: string;
  magic?: number;
  status: 'open' | 'closed';
  duration?: number; // in milliseconds
}

export interface TradingStatistics {
  // Error handling
  error?: string;
  
  // Account Info
  accountId: string;
  accountName: string;
  broker: string;
  balance: number;
  equity: number;
  initialBalance: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  
  // Trade Metrics
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  
  // P&L Analysis
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  
  // Time Analysis
  bestHour: string;
  bestDay: string;
  averageTradeDuration: number;
  
  // Risk Metrics
  maxDrawdown: number;
  currentDrawdown: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  
  // Market Analysis
  volatility: number;
  sharpeRatio: number;
  
  // Live Data
  lastUpdate: string;
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

export interface DailyStats {
  date: string;
  trades: number;
  profit: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
}

export interface HourlyStats {
  hour: number;
  trades: number;
  profit: number;
  winRate: number;
  averageProfit: number;
}

// REMOVED: LiveTradingStatistics class contained dummy data
// All live trading data now comes from real MetaAPI endpoints:
// - /api/live/metrics - for account statistics
// - /api/live/trades - for individual trades
// No more fake data generation!
