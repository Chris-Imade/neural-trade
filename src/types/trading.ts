export interface AccountInfo {
  balance: number;
  equity: number;
  currency: string;
  leverage: number;
  marginLevel: number;
  freeMargin: number;
  marginUsed: number;
}

export interface Position {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  openTime: string;
  stopLoss?: number;
  takeProfit?: number;
}

export interface PriceData {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: string;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  performance: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    totalPnL: number;
  };
}

export interface BacktestResult {
  strategy: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  totalReturn: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  totalTrades: number;
  equityCurve: Array<{ date: string; value: number }>;
}
