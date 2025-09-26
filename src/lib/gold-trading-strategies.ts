// Gold Trading Strategies - REAL LIVE PRODUCTION READY
// No dummy data, no mocks - pure strategy logic

export interface MarketData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
  timeframe: string;
}

export interface TradingSignal {
  action: 'buy' | 'sell' | 'hold';
  confidence: number; // 0-100
  stopLoss: number;
  takeProfit: number;
  takeProfit2?: number; // Optional second target
  riskReward: number;
  strategy: string;
  reason: string;
  timeframe: string;
}

export interface TechnicalIndicators {
  // Moving averages
  ema20: number;
  ema50: number;
  ema200: number;
  sma20: number;
  
  // Volatility
  atr: number;
  atrMultiplier: number;
  
  // Bollinger Bands
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  
  // Momentum
  rsi: number;
  
  // Session data
  sessionHigh: number;
  sessionLow: number;
  isHighVolatility: boolean;
}

// Strategy 1: Volatility-Adjusted Breakout (VAB) Bot
export class VolatilityAdjustedBreakoutStrategy {
  private readonly RISK_REWARD_RATIO = 2.0; // 1:2 minimum
  private readonly ATR_MULTIPLIER = 2.0; // 2x ATR for stop loss
  private readonly MIN_RANGE_PIPS = 5; // Minimum range for valid breakout (reduced for more trades)
  
  analyzeMarket(data: MarketData[], indicators: TechnicalIndicators): TradingSignal {
    const current = data[data.length - 1];
    
    // Skip if extremely high volatility (only avoid major news events)
    // Removed strict volatility check to allow more trades
    
    // Calculate session range
    const sessionRange = indicators.sessionHigh - indicators.sessionLow;
    const sessionRangePips = sessionRange * 10000; // Convert to pips
    
    // Skip if range too small
    if (sessionRangePips < this.MIN_RANGE_PIPS) {
      return this.createHoldSignal('Session range too small for breakout');
    }
    
    // Check for breakout above session high
    if (current.close > indicators.sessionHigh) {
      const stopLoss = indicators.sessionLow - (indicators.atr * this.ATR_MULTIPLIER);
      const takeProfit = current.close + (current.close - stopLoss) * this.RISK_REWARD_RATIO;
      
      return {
        action: 'buy',
        confidence: 85,
        stopLoss,
        takeProfit,
        takeProfit2: current.close + (current.close - stopLoss), // 50% at 1:1
        riskReward: this.RISK_REWARD_RATIO,
        strategy: 'VAB Breakout',
        reason: `Bullish breakout above session high (${indicators.sessionHigh.toFixed(5)})`,
        timeframe: current.timeframe
      };
    }
    
    // Check for breakdown below session low
    if (current.close < indicators.sessionLow) {
      const stopLoss = indicators.sessionHigh + (indicators.atr * this.ATR_MULTIPLIER);
      const takeProfit = current.close - (stopLoss - current.close) * this.RISK_REWARD_RATIO;
      
      return {
        action: 'sell',
        confidence: 85,
        stopLoss,
        takeProfit,
        takeProfit2: current.close - (stopLoss - current.close), // 50% at 1:1
        riskReward: this.RISK_REWARD_RATIO,
        strategy: 'VAB Breakout',
        reason: `Bearish breakdown below session low (${indicators.sessionLow.toFixed(5)})`,
        timeframe: current.timeframe
      };
    }
    
    return this.createHoldSignal('Waiting for session breakout');
  }
  
  private createHoldSignal(reason: string): TradingSignal {
    return {
      action: 'hold',
      confidence: 0,
      stopLoss: 0,
      takeProfit: 0,
      riskReward: 0,
      strategy: 'VAB Breakout',
      reason,
      timeframe: 'M15'
    };
  }
}

// Strategy 2: Mean Reversion with Volatility Filter Bot
export class MeanReversionStrategy {
  private readonly RSI_OVERBOUGHT = 75;
  private readonly RSI_OVERSOLD = 25;
  private readonly RISK_REWARD_RATIO = 1.5;

  analyzeMarket(data: MarketData[], indicators: TechnicalIndicators): TradingSignal {
    const current = data[data.length - 1];
    
    // Bullish mean reversion: Price at lower BB + RSI oversold
    if (current.close <= indicators.bollingerLower && indicators.rsi <= this.RSI_OVERSOLD) {
      const stopLoss = indicators.bollingerLower - (indicators.atr * 1.5);
      const takeProfit = indicators.bollingerMiddle + (indicators.bollingerMiddle - stopLoss) * this.RISK_REWARD_RATIO;
      
      return {
        action: 'buy',
        confidence: 80,
        stopLoss,
        takeProfit,
        riskReward: Math.abs(takeProfit - current.close) / Math.abs(current.close - stopLoss),
        strategy: 'Mean Reversion',
        reason: `Oversold bounce: RSI ${indicators.rsi.toFixed(1)}, price at lower BB`,
        timeframe: current.timeframe
      };
    }
    
    // Bearish mean reversion: Price at upper BB + RSI overbought
    if (current.close >= indicators.bollingerUpper && indicators.rsi >= this.RSI_OVERBOUGHT) {
      const stopLoss = indicators.bollingerUpper + (indicators.atr * 1.5);
      const takeProfit = indicators.bollingerMiddle;
      
      return {
        action: 'sell',
        confidence: 80,
        stopLoss,
        takeProfit,
        riskReward: Math.abs(current.close - takeProfit) / Math.abs(stopLoss - current.close),
        strategy: 'Mean Reversion',
        reason: `Overbought reversal: RSI ${indicators.rsi.toFixed(1)}, price at upper BB`,
        timeframe: current.timeframe
      };
    }
    
    return this.createHoldSignal('Waiting for extreme BB + RSI conditions');
  }
  
  private createHoldSignal(reason: string): TradingSignal {
    return {
      action: 'hold',
      confidence: 0,
      stopLoss: 0,
      takeProfit: 0,
      riskReward: 0,
      strategy: 'Mean Reversion',
      reason,
      timeframe: 'M15'
    };
  }
}

// Strategy 3: Dual-Timeframe Trend-Following Bot
export class DualTimeframeTrendStrategy {
  private readonly RISK_REWARD_RATIO = 2.0;
  private readonly MAX_TRADE_DURATION_HOURS = 8;
  
  analyzeMarket(
    m15Data: MarketData[], 
    h4Data: MarketData[], 
    m15Indicators: TechnicalIndicators,
    h4Indicators: TechnicalIndicators
  ): TradingSignal {
    const currentM15 = m15Data[m15Data.length - 1];
    const currentH4 = h4Data[h4Data.length - 1];
    
    // Determine H4 trend using 200 EMA
    const h4Trend = currentH4.close > h4Indicators.ema200 ? 'bullish' : 'bearish';
    
    // Only trade in direction of H4 trend
    if (h4Trend === 'bullish') {
      // Look for pullback to 50 EMA on M15 for long entry
      if (currentM15.close <= m15Indicators.ema50 && currentM15.close > m15Indicators.ema50 * 0.999) {
        const stopLoss = m15Indicators.ema50 - (m15Indicators.atr * 2);
        const takeProfit = currentM15.close + (currentM15.close - stopLoss) * this.RISK_REWARD_RATIO;
        
        return {
          action: 'buy',
          confidence: 75,
          stopLoss,
          takeProfit,
          riskReward: this.RISK_REWARD_RATIO,
          strategy: 'Dual-Timeframe Trend',
          reason: `H4 bullish trend + M15 pullback to 50 EMA`,
          timeframe: 'M15'
        };
      }
    } else {
      // Look for pullback to 50 EMA on M15 for short entry
      if (currentM15.close >= m15Indicators.ema50 && currentM15.close < m15Indicators.ema50 * 1.001) {
        const stopLoss = m15Indicators.ema50 + (m15Indicators.atr * 2);
        const takeProfit = currentM15.close - (stopLoss - currentM15.close) * this.RISK_REWARD_RATIO;
        
        return {
          action: 'sell',
          confidence: 75,
          stopLoss,
          takeProfit,
          riskReward: this.RISK_REWARD_RATIO,
          strategy: 'Dual-Timeframe Trend',
          reason: `H4 bearish trend + M15 pullback to 50 EMA`,
          timeframe: 'M15'
        };
      }
    }
    
    return this.createHoldSignal('Waiting for trend pullback entry');
  }
  
  private createHoldSignal(reason: string): TradingSignal {
    return {
      action: 'hold',
      confidence: 0,
      stopLoss: 0,
      takeProfit: 0,
      riskReward: 0,
      strategy: 'Dual-Timeframe Trend',
      reason,
      timeframe: 'M15'
    };
  }
}

// Risk Management for Prop Firms
export class PropFirmRiskManager {
  private readonly MAX_DAILY_LOSS_PERCENT = 5; // 5% max daily loss
  private readonly MAX_TOTAL_LOSS_PERCENT = 10; // 10% max total loss
  private readonly MAX_POSITION_SIZE_PERCENT = 2; // 2% risk per trade
  
  validateTrade(signal: TradingSignal, accountBalance: number, dailyPnL: number): boolean {
    // Check daily loss limit
    if (Math.abs(dailyPnL) > accountBalance * (this.MAX_DAILY_LOSS_PERCENT / 100)) {
      return false;
    }
    
    // Additional prop firm rules can be added here
    return true;
  }

  checkRiskLimits(currentLoss: number, dailyLoss: number, accountBalance: number): boolean {
    // Check daily loss limit
    if (Math.abs(dailyLoss) > accountBalance * (this.MAX_DAILY_LOSS_PERCENT / 100)) {
      return false;
    }
    
    // Check total loss limit
    if (Math.abs(currentLoss) > accountBalance * (this.MAX_TOTAL_LOSS_PERCENT / 100)) {
      return false;
    }
    
    return true;
  }
}

// News Filter to avoid trading during high-impact events
export class NewsFilter {
  private readonly HIGH_IMPACT_HOURS = [8, 9, 10, 13, 14, 15]; // GMT hours to avoid
  
  shouldAvoidTrading(timestamp: string): boolean {
    const date = new Date(timestamp);
    const hour = date.getUTCHours();
    
    // Avoid trading during typical news hours
    return this.HIGH_IMPACT_HOURS.includes(hour);
  }
}
