/**
 * Additional Enhanced Backtesting Methods
 * Completing the institutional-grade backtesting engine
 */

import { BacktestTrade, MarketData, TradingSignal, TechnicalIndicators, BacktestEquityPoint, TradingSignalMetadata, BacktestParams } from './backtesting-engine';
import { EnhancedBacktestHelpers } from './enhanced-backtest-helpers';

// Enhanced type definitions for backtest state management
export interface BacktestState {
  currentBalance: number;
  maxBalance: number;
  openTrades: BacktestTrade[];
  closedTrades: BacktestTrade[];
  equityHistory: BacktestEquityPoint[];
  maxDrawdown: number;
  maxDrawdownPercent: number;
  currentDrawdown: number;
  highWaterMark: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  totalCommission: number;
  totalSlippage: number;
  signalsGenerated: number;
  signalsExecuted: number;
  lastRebalance: string;
  initialBalance: number;
}

// Type for backtest ID generation parameters
interface BacktestIdParams {
  strategy: string;
  datasetId: string;
}

export class EnhancedBacktestMethods {
  
  // ==================== MISSING ENGINE METHODS ====================
  
  static generateBacktestId(params: BacktestIdParams): string {
    const timestamp = Date.now();
    const strategyHash = params.strategy.substring(0, 8);
    const datasetHash = params.datasetId.substring(0, 8);
    return `${strategyHash}_${datasetHash}_${timestamp}`;
  }
  
  static calculateEnhancedTechnicalIndicators(data: MarketData[]): TechnicalIndicators {
    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);
    
    // Enhanced Bollinger Bands
    const sma20 = EnhancedBacktestHelpers.calculateSMA(closes, 20);
    const stdDev20 = EnhancedBacktestHelpers.calculateStandardDeviation(closes.slice(-20), sma20);
    const bbUpper = sma20 + stdDev20 * 2;
    const bbLower = sma20 - stdDev20 * 2;
    const bbWidth = ((bbUpper - bbLower) / sma20) * 100;
    const bbPosition = (closes[closes.length - 1] - bbLower) / (bbUpper - bbLower);
    
    // Enhanced RSI with divergence detection
    const rsi = EnhancedBacktestHelpers.calculateRSI(closes, 14);
    const rsiDivergence = EnhancedBacktestHelpers.detectRSIDivergence(
      closes.slice(-20), 
      EnhancedBacktestHelpers.calculateRSIArray(closes, 14).slice(-20)
    );
    
    // Multiple timeframe moving averages
    const ema20 = EnhancedBacktestHelpers.calculateEMA(closes, 20);
    const ema50 = EnhancedBacktestHelpers.calculateEMA(closes, 50);
    const ema200 = EnhancedBacktestHelpers.calculateEMA(closes, 200);
    const sma50 = EnhancedBacktestHelpers.calculateSMA(closes, 50);
    
    // Trend alignment score
    const currentPrice = closes[closes.length - 1];
    const trendAlignment = EnhancedBacktestHelpers.calculateTrendAlignment(currentPrice, ema20, ema50, ema200);
    
    // Enhanced MACD
    const macdData = EnhancedBacktestHelpers.calculateMACD(closes);
    
    // Volatility metrics
    const atr = EnhancedBacktestHelpers.calculateATR(data, 14);
    const volatilityRank = EnhancedBacktestHelpers.calculateVolatilityRank(data, 20);
    
    // Volume analysis
    const avgVolume = EnhancedBacktestHelpers.calculateSMA(volumes, 20);
    const volumeRatio = volumes[volumes.length - 1] / avgVolume;
    const vwap = EnhancedBacktestHelpers.calculateVWAP(data.slice(-20));
    
    // Support/Resistance levels
    const pivotLevels = EnhancedBacktestHelpers.calculatePivotLevels(data.slice(-20));
    
    // Stochastic oscillator
    const stochastic = EnhancedBacktestHelpers.calculateStochastic(highs, lows, closes, 14);
    
    // Momentum indicator
    const momentum = EnhancedBacktestHelpers.calculateMomentum(closes, 10);

    return {
      // Bollinger Bands
      bollingerUpper: bbUpper,
      bollingerMiddle: sma20,
      bollingerLower: bbLower,
      bollingerWidth: bbWidth,
      bollingerPosition: bbPosition,
      
      // RSI
      rsi,
      rsiDivergence,
      rsiOverbought: rsi > 70,
      rsiOversold: rsi < 30,
      
      // Moving averages
      ema20,
      ema50,
      ema200,
      sma20,
      sma50,
      trendAlignment,
      
      // Volatility
      atr,
      atrMultiplier: 2,
      volatilityRank,
      
      // Session data
      sessionHigh: Math.max(...highs.slice(-20)),
      sessionLow: Math.min(...lows.slice(-20)),
      sessionRange: Math.max(...highs.slice(-20)) - Math.min(...lows.slice(-20)),
      
      // Volume
      volume: volumes[volumes.length - 1],
      volumeProfile: volumeRatio,
      volumeWeightedPrice: vwap,
      
      // MACD
      macd: {
        macd: macdData.macd,
        signal: macdData.signal,
        histogram: macdData.histogram,
        trend: macdData.histogram > 0 ? 'bullish' : 'bearish',
        crossover: Math.abs(macdData.macd - macdData.signal) < 0.001
      },
      
      // Enhanced Bollinger Bands
      bollingerBands: {
        upper: bbUpper,
        middle: sma20,
        lower: bbLower,
        width: bbWidth,
        percentB: bbPosition,
        squeeze: bbWidth < 10 // Configurable threshold
      },
      
      // Additional indicators
      momentum,
      stochastic,
      
      // Market structure
      supportLevel: pivotLevels.support,
      resistanceLevel: pivotLevels.resistance,
      pivotPoint: pivotLevels.pivot
    };
  }
  
  static getEnhancedStrategySignal(
    strategy: string,
    data: MarketData[],
    indicators: TechnicalIndicators,
    state: BacktestState
  ): TradingSignal {
    // Enhanced signal generation with metadata
    let baseSignal: TradingSignal;
    
    switch (strategy) {
      case 'aggressive_scalper':
        // Use the legacy compatibility method
        baseSignal = EnhancedBacktestMethods.getAggressiveScalperSignal(data, indicators);
        break;
      case 'quantum_scalper':
        baseSignal = EnhancedBacktestMethods.getQuantumScalperSignal(data, indicators);
        break;
      default:
        baseSignal = EnhancedBacktestMethods.getDefaultHoldSignal();
    }
    
    // Enhance signal with comprehensive metadata
    if (baseSignal.action !== 'hold') {
      baseSignal.metadata = EnhancedBacktestMethods.generateEnhancedMetadata(data, indicators, baseSignal);
    }
    
    return baseSignal;
  }
  
  private static getAggressiveScalperSignal(data: MarketData[], indicators: TechnicalIndicators): TradingSignal {
    const current = data[data.length - 1];
    
    // Simplified aggressive scalper logic
    const momentum = (current.close - data[data.length - 5].close) / data[data.length - 5].close;
    const volatility = indicators.atr / current.close;
    
    if (momentum > 0.001 && indicators.rsi < 70 && volatility > 0.005) {
      return {
        action: 'buy',
        confidence: 80,
        stopLoss: current.close - indicators.atr * 1.5,
        takeProfit: current.close + indicators.atr * 2,
        riskReward: 1.33,
        strategy: 'Production HFT Scalper',
        reason: `Momentum breakout: ${(momentum * 100).toFixed(3)}%`,
        timeframe: current.timeframe,
        positionSize: 0.5,
        maxRisk: 2,
        expectedReturn: 4,
        metadata: {} as TradingSignalMetadata // Will be filled by caller
      };
    }
    
    if (momentum < -0.001 && indicators.rsi > 30 && volatility > 0.005) {
      return {
        action: 'sell',
        confidence: 80,
        stopLoss: current.close + indicators.atr * 1.5,
        takeProfit: current.close - indicators.atr * 2,
        riskReward: 1.33,
        strategy: 'Production HFT Scalper',
        reason: `Momentum breakdown: ${(momentum * 100).toFixed(3)}%`,
        timeframe: current.timeframe,
        positionSize: 0.5,
        maxRisk: 2,
        expectedReturn: 4,
        metadata: {} as TradingSignalMetadata
      };
    }
    
    return EnhancedBacktestMethods.getDefaultHoldSignal();
  }
  
  private static getQuantumScalperSignal(data: MarketData[], indicators: TechnicalIndicators): TradingSignal {
    const current = data[data.length - 1];
    
    // Simplified quantum scalper logic
    const confluence = EnhancedBacktestMethods.calculateConfluence(indicators);
    
    if (confluence > 0.7 && indicators.rsi < 65) {
      return {
        action: 'buy',
        confidence: 85,
        stopLoss: current.close - indicators.atr * 1.2,
        takeProfit: current.close + indicators.atr * 2.5,
        riskReward: 2.08,
        strategy: 'Institutional HFT Engine',
        reason: `High confluence setup: ${confluence.toFixed(2)}`,
        timeframe: current.timeframe,
        positionSize: 0.3,
        maxRisk: 1.5,
        expectedReturn: 3.5,
        metadata: {} as TradingSignalMetadata
      };
    }
    
    if (confluence < -0.7 && indicators.rsi > 35) {
      return {
        action: 'sell',
        confidence: 85,
        stopLoss: current.close + indicators.atr * 1.2,
        takeProfit: current.close - indicators.atr * 2.5,
        riskReward: 2.08,
        strategy: 'Institutional HFT Engine',
        reason: `High confluence reversal: ${confluence.toFixed(2)}`,
        timeframe: current.timeframe,
        positionSize: 0.3,
        maxRisk: 1.5,
        expectedReturn: 3.5,
        metadata: {} as TradingSignalMetadata
      };
    }
    
    return EnhancedBacktestMethods.getDefaultHoldSignal();
  }
  
  private static getDefaultHoldSignal(): TradingSignal {
    return {
      action: 'hold',
      confidence: 0,
      stopLoss: 0,
      takeProfit: 0,
      riskReward: 0,
      strategy: 'Enhanced Engine',
      reason: 'No clear signal',
      timeframe: '5m',
      positionSize: 0,
      maxRisk: 0,
      expectedReturn: 0,
      metadata: {} as TradingSignalMetadata
    };
  }
  
  private static calculateConfluence(indicators: TechnicalIndicators): number {
    let score = 0;
    
    // Trend alignment
    score += indicators.trendAlignment * 0.3;
    
    // RSI momentum
    if (indicators.rsi > 50) score += 0.2;
    else score -= 0.2;
    
    // MACD trend
    if (indicators.macd.trend === 'bullish') score += 0.2;
    else if (indicators.macd.trend === 'bearish') score -= 0.2;
    
    // Volume confirmation
    if (indicators.volumeProfile > 1.2) score += 0.15;
    else if (indicators.volumeProfile < 0.8) score -= 0.15;
    
    // Bollinger position
    if (indicators.bollingerPosition > 0.8) score -= 0.15; // Overbought
    else if (indicators.bollingerPosition < 0.2) score += 0.15; // Oversold
    
    return Math.max(-1, Math.min(1, score));
  }
  
  private static generateEnhancedMetadata(
    data: MarketData[], 
    indicators: TechnicalIndicators, 
    signal: TradingSignal
  ): TradingSignalMetadata {
    const current = data[data.length - 1];
    
    return {
      signalId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      urgency: signal.confidence > 85 ? 'immediate' : signal.confidence > 70 ? 'patient' : 'opportunistic',
      timeToLive: signal.confidence > 80 ? 300000 : 600000, // 5-10 minutes
      processingTimeMs: 1,
      
      // Market analysis
      momentum: EnhancedBacktestHelpers.calculateMomentum(data.map(d => d.close), 5),
      volatility: indicators.volatilityRank,
      confluence: EnhancedBacktestMethods.calculateConfluence(indicators),
      volumeRatio: indicators.volumeProfile,
      entryPrice: current.close,
      timestamp: Date.now(),
      
      // Risk management
      expectedSlippage: 0.0002,
      fillProbability: 0.95,
      marketImpact: 0.0001,
      riskAdjustment: 1.0,
      liquidityScore: 0.8,
      
      // Microstructure
      orderFlow: 0,
      microstructure: 0,
      bidAskSpread: current.spread || 0.02,
      marketDepth: 1000,
      
      // Analytics
      volatilityRegime: indicators.volatilityRank > 0.8 ? 'high' : 
                       indicators.volatilityRank > 0.5 ? 'normal' : 'low',
      marketSession: EnhancedBacktestMethods.determineMarketSession(current.timestamp),
      trendStrength: Math.abs(indicators.trendAlignment),
      supportResistanceLevel: signal.action === 'buy' ? indicators.supportLevel : indicators.resistanceLevel,
      correlationScore: 0.5,
      sentimentIndicator: 0,
      
      // ML features (placeholder)
      mlConfidence: signal.confidence / 100,
      featureImportance: {
        momentum: 0.3,
        volatility: 0.2,
        volume: 0.2,
        trend: 0.3
      },
      anomalyScore: 0.1
    };
  }
  
  private static determineMarketSession(timestamp: string): 'london' | 'new_york' | 'asian' | 'overlap' {
    const date = new Date(timestamp);
    const hour = date.getUTCHours();
    
    if (hour >= 0 && hour < 8) return 'asian';
    if (hour >= 8 && hour < 13) return 'london';
    if (hour >= 13 && hour < 17) return 'overlap';
    return 'new_york';
  }
  
  static updateUnrealizedMetrics(openTrades: BacktestTrade[], candle: MarketData): void {
    for (const trade of openTrades) {
      const currentPrice = candle.close;
      const unrealizedPnL = trade.action === 'buy'
        ? (currentPrice - trade.entryPrice) * trade.volume * 100
        : (trade.entryPrice - currentPrice) * trade.volume * 100;
      
      // Update MFE and MAE
      if (!trade.mfe || unrealizedPnL > trade.mfe) {
        trade.mfe = unrealizedPnL;
        trade.maxFavorableExcursion = unrealizedPnL;
      }
      
      if (!trade.mae || unrealizedPnL < trade.mae) {
        trade.mae = unrealizedPnL;
        trade.maxAdverseExcursion = unrealizedPnL;
      }
    }
  }

  // ==================== TRADE MANAGEMENT ===================="
  
  static calculateOptimalPositionSize(
    riskAmount: number,
    stopDistance: number,
    metadata: TradingSignalMetadata,
    method: string = 'fixed_percent'
  ): number {
    let baseSize = riskAmount / (stopDistance * 100);
    
    // Adjust based on method
    switch (method) {
      case 'kelly':
        // Simplified Kelly criterion
        const winRate = 0.65; // Assumed
        const avgWin = 1.5;
        const avgLoss = 1.0;
        const kellyPercent = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
        baseSize *= Math.max(0.1, Math.min(2.0, kellyPercent));
        break;
        
      case 'volatility_adjusted':
        // Adjust for volatility
        const volAdjustment = 1 / (1 + metadata.volatility);
        baseSize *= volAdjustment;
        break;
        
      case 'optimal_f':
        // Simplified optimal f
        baseSize *= 0.25; // Conservative multiplier
        break;
        
      default: // fixed_percent
        break;
    }
    
    // Apply confidence adjustment
    baseSize *= (metadata.mlConfidence || 0.8);
    
    return Math.max(0.01, Math.min(5.0, baseSize));
  }
  
  static assessTradeQuality(signal: TradingSignal): 'excellent' | 'good' | 'average' | 'poor' {
    if (signal.confidence >= 90 && signal.riskReward >= 2.0) return 'excellent';
    if (signal.confidence >= 80 && signal.riskReward >= 1.5) return 'good';
    if (signal.confidence >= 70 && signal.riskReward >= 1.0) return 'average';
    return 'poor';
  }
  
  static calculateCurrentRisk(openTrades: BacktestTrade[], balance: number): number {
    const totalRisk = openTrades.reduce((sum, trade) => {
      const riskAmount = Math.abs(trade.entryPrice - trade.stopLoss) * trade.volume * 100;
      return sum + riskAmount;
    }, 0);
    
    return (totalRisk / balance) * 100;
  }
  
  // ==================== ADDITIONAL UTILITY METHODS ====================
  
  static processTradeExits(
    openTrades: BacktestTrade[], 
    candle: MarketData, 
    indicators: TechnicalIndicators
  ): BacktestTrade[] {
    const exitedTrades: BacktestTrade[] = [];
    
    for (const trade of openTrades) {
      let shouldExit = false;
      let exitReason = '';
      let exitPrice = candle.close;
      
      // Check stop loss
      if (trade.action === 'buy' && candle.low <= trade.stopLoss) {
        shouldExit = true;
        exitReason = 'Stop loss hit';
        exitPrice = trade.stopLoss;
      } else if (trade.action === 'sell' && candle.high >= trade.stopLoss) {
        shouldExit = true;
        exitReason = 'Stop loss hit';
        exitPrice = trade.stopLoss;
      }
      
      // Check take profit
      if (!shouldExit) {
        if (trade.action === 'buy' && candle.high >= trade.takeProfit) {
          shouldExit = true;
          exitReason = 'Take profit hit';
          exitPrice = trade.takeProfit;
        } else if (trade.action === 'sell' && candle.low <= trade.takeProfit) {
          shouldExit = true;
          exitReason = 'Take profit hit';
          exitPrice = trade.takeProfit;
        }
      }
      
      if (shouldExit) {
        trade.exitTime = candle.timestamp;
        trade.exitPrice = exitPrice;
        trade.exitReason = exitReason;
        exitedTrades.push(trade);
      }
    }
    
    return exitedTrades;
  }
  
  static finalizeClosedTrade(
    trade: BacktestTrade, 
    candle: MarketData, 
    state: BacktestState, 
    reason?: string
  ): void {
    if (!trade.exitTime) {
      trade.exitTime = candle.timestamp;
      trade.exitPrice = candle.close;
      trade.exitReason = reason || 'Manual close';
    }
    
    // Calculate profit
    const profit = trade.action === 'buy' 
      ? (trade.exitPrice! - trade.entryPrice) * trade.volume * 100
      : (trade.entryPrice - trade.exitPrice!) * trade.volume * 100;
    
    trade.profit = profit;
    trade.pnl = profit;
    trade.profitPercent = (profit / (trade.entryPrice * trade.volume * 100)) * 100;
    
    // Calculate P&L in pips
    const priceDiff = trade.action === 'buy' 
      ? (trade.exitPrice! - trade.entryPrice)
      : (trade.entryPrice - trade.exitPrice!);
    trade.pnlPips = priceDiff * 100;
    
    // Calculate duration
    const entryTime = new Date(trade.entryTime).getTime();
    const exitTime = new Date(trade.exitTime).getTime();
    trade.duration = exitTime - entryTime;
    trade.holdTime = trade.duration;
    
    // Update state
    state.currentBalance += profit;
    
    // Update consecutive wins/losses
    if (profit > 0) {
      state.consecutiveWins++;
      state.consecutiveLosses = 0;
      state.maxConsecutiveWins = Math.max(state.maxConsecutiveWins, state.consecutiveWins);
    } else {
      state.consecutiveLosses++;
      state.consecutiveWins = 0;
      state.maxConsecutiveLosses = Math.max(state.maxConsecutiveLosses, state.consecutiveLosses);
    }
  }
  
  static updateEquityCurve(state: BacktestState, candle: MarketData, index: number): void {
    const unrealizedPnL = state.openTrades.reduce((sum: number, trade: BacktestTrade) => {
      const currentPrice = candle.close;
      const pnl = trade.action === 'buy'
        ? (currentPrice - trade.entryPrice) * trade.volume * 100
        : (trade.entryPrice - currentPrice) * trade.volume * 100;
      return sum + pnl;
    }, 0);
    
    const currentEquity = state.currentBalance + unrealizedPnL;
    
    // Update high water mark and drawdown
    if (currentEquity > state.highWaterMark) {
      state.highWaterMark = currentEquity;
    }
    
    const drawdown = state.highWaterMark - currentEquity;
    const drawdownPercent = (drawdown / state.highWaterMark) * 100;
    
    if (drawdown > state.maxDrawdown) {
      state.maxDrawdown = drawdown;
    }
    
    if (drawdownPercent > state.maxDrawdownPercent) {
      state.maxDrawdownPercent = drawdownPercent;
    }
    
    state.currentDrawdown = drawdown;
    
    // Add equity point every 10 candles to reduce memory usage
    if (index % 10 === 0) {
      state.equityHistory.push({
        timestamp: candle.timestamp,
        balance: currentEquity,
        drawdown: drawdownPercent,
        drawdownPercent: drawdownPercent,
        trades: state.closedTrades.length,
        openTrades: state.openTrades.length,
        unrealizedPnl: unrealizedPnL,
        realizedPnl: state.currentBalance - state.initialBalance,
        highWaterMark: state.highWaterMark,
        volatility: 0, // Placeholder
        sharpeRatio: 0 // Placeholder
      });
    }
  }
  
  static checkDrawdownLimits(state: BacktestState, params: BacktestParams): boolean {
    if (!params.maxDrawdownPercent) return false;
    
    return state.maxDrawdownPercent > params.maxDrawdownPercent;
  }
  
  static closeAllPositions(openTrades: BacktestTrade[], candle: MarketData, reason: string): void {
    for (const trade of openTrades) {
      trade.exitTime = candle.timestamp;
      trade.exitPrice = candle.close;
      trade.exitReason = reason;
    }
  }
  
  static shouldRebalance(currentTime: string, lastRebalance: string): boolean {
    const current = new Date(currentTime);
    const last = new Date(lastRebalance);
    const hoursDiff = (current.getTime() - last.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff >= 24; // Rebalance daily
  }
  
  static rebalancePortfolio(state: BacktestState, params: BacktestParams): void {
    // Simple rebalancing logic
    const totalProfit = state.currentBalance - params.initialBalance;
    if (totalProfit > 0 && params.reinvestProfits) {
      // Compound the profits
      state.lastRebalance = new Date().toISOString();
    }
  }
}
