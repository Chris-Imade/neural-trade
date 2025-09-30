/**
 * Client-safe backtest types and interfaces
 * No Node.js dependencies - safe for client-side imports
 */

export interface BacktestTrade {
  id: string;
  entryTime: string;
  exitTime?: string;
  symbol: string;
  action: 'buy' | 'sell';
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  volume: number;
  strategy: string;
  confidence: number;
  reason: string;
  profit?: number;
  profitPercent?: number;
  pnl?: number;
  pnlPips?: number;
  duration?: number;
  holdTime?: number;
  mfe?: number;
  mae?: number;
  maxFavorableExcursion?: number;
  maxAdverseExcursion?: number;
  exitReason?: string;
  exitConfidence?: number;
  commission?: number;
  swap?: number;
  slippage?: number;
  fillPrice?: number;
  tradeQuality: 'excellent' | 'good' | 'average' | 'poor';
  riskReward: number;
  actualRiskReward?: number;
  marketConditions?: {
    volatility: number;
    trend: string;
    volume: number;
    spread: number;
  };
}

export interface BacktestEquityPoint {
  timestamp: string;
  balance: number;
  drawdown: number;
  drawdownPercent: number;
  trades: number;
  openTrades: number;
  unrealizedPnl: number;
  realizedPnl: number;
  highWaterMark: number;
  volatility: number;
  sharpeRatio: number;
}

export interface BacktestResults {
  // Basic metrics
  initialBalance: number;
  finalBalance: number;
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  
  // Trading statistics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  lossRate: number;
  
  // Performance metrics
  profitFactor: number;
  payoffRatio: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  
  // Risk metrics
  maxDrawdown: number;
  maxDrawdownPercent: number;
  maxDrawdownDuration: number;
  averageDrawdown: number;
  recoveryFactor: number;
  
  // Statistical measures
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  sterlingRatio: number;
  informationRatio: number;
  
  // Consistency metrics
  winStreakMax: number;
  lossStreakMax: number;
  averageHoldTime: number;
  averageMFE: number;
  averageMAE: number;
  consistency: number;
  
  // Market efficiency metrics
  alphaGeneration: number;
  betaExposure: number;
  correlationToMarket: number;
  
  // Trade distribution
  tradeDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  
  // Monthly returns
  monthlyReturns: Array<{
    month: string;
    return: number;
    trades: number;
    winRate: number;
  }>;
  
  // Data arrays
  trades: BacktestTrade[];
  equityData: BacktestEquityPoint[];
  equityCurve: BacktestEquityPoint[];
  
  // Execution details
  executionTime: number;
  dataPoints: number;
  isRealBacktest: boolean;
  
  // Performance attribution
  performanceAttribution: {
    strategyContribution: number;
    timingContribution: number;
    riskManagementContribution: number;
  };
  
  // Risk-adjusted metrics
  riskAdjustedMetrics: {
    volAdjustedReturn: number;
    downDeviationAdjustedReturn: number;
    varAdjustedReturn: number;
  };
}
