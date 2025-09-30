/**
 * Enhanced Backtesting Helper Methods
 * Professional-grade calculations for institutional trading systems
 */

import { BacktestTrade, BacktestEquityPoint, TradingSignal, MarketData, TechnicalIndicators } from './backtesting-engine';

export class EnhancedBacktestHelpers {
  
  // ==================== RISK METRICS ====================
  
  static calculateSharpeRatio(equityData: BacktestEquityPoint[]): number {
    if (equityData.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < equityData.length; i++) {
      const dailyReturn = (equityData[i].balance - equityData[i-1].balance) / equityData[i-1].balance;
      returns.push(dailyReturn);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = this.calculateStandardDeviation(returns, avgReturn);
    
    return stdDev > 0 ? (avgReturn * Math.sqrt(252)) / stdDev : 0;
  }
  
  static calculateSortinoRatio(equityData: BacktestEquityPoint[]): number {
    if (equityData.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < equityData.length; i++) {
      const dailyReturn = (equityData[i].balance - equityData[i-1].balance) / equityData[i-1].balance;
      returns.push(dailyReturn);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const negativeReturns = returns.filter(r => r < 0);
    
    if (negativeReturns.length === 0) return avgReturn > 0 ? 999 : 0;
    
    const downDeviation = Math.sqrt(
      negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
    );
    
    return downDeviation > 0 ? (avgReturn * Math.sqrt(252)) / downDeviation : 0;
  }
  
  // ==================== TRADE ANALYSIS ====================
  
  static calculateAverageHoldTime(trades: BacktestTrade[]): number {
    const completedTrades = trades.filter(t => t.exitTime && t.duration);
    if (completedTrades.length === 0) return 0;
    
    const totalDuration = completedTrades.reduce((sum, t) => sum + (t.duration || 0), 0);
    return totalDuration / completedTrades.length;
  }
  
  static calculateAverageMFE(trades: BacktestTrade[]): number {
    const tradesWithMFE = trades.filter(t => t.mfe !== undefined);
    if (tradesWithMFE.length === 0) return 0;
    
    return tradesWithMFE.reduce((sum, t) => sum + (t.mfe || 0), 0) / tradesWithMFE.length;
  }
  
  static calculateAverageMAE(trades: BacktestTrade[]): number {
    const tradesWithMAE = trades.filter(t => t.mae !== undefined);
    if (tradesWithMAE.length === 0) return 0;
    
    return tradesWithMAE.reduce((sum, t) => sum + (t.mae || 0), 0) / tradesWithMAE.length;
  }
  
  static calculateConsistency(trades: BacktestTrade[]): number {
    if (trades.length === 0) return 0;
    
    const profits = trades.map(t => t.profit || 0);
    const positiveMonths = profits.filter(p => p > 0).length;
    
    return (positiveMonths / trades.length) * 100;
  }
  
  static calculateTradeDistribution(trades: BacktestTrade[]): {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  } {
    const distribution = { excellent: 0, good: 0, average: 0, poor: 0 };
    
    for (const trade of trades) {
      switch (trade.tradeQuality) {
        case 'excellent':
          distribution.excellent++;
          break;
        case 'good':
          distribution.good++;
          break;
        case 'average':
          distribution.average++;
          break;
        case 'poor':
          distribution.poor++;
          break;
      }
    }
    
    return distribution;
  }
  
  // ==================== TECHNICAL INDICATORS ====================
  
  static calculateSMA(values: number[], period: number): number {
    if (values.length < period) return 0;
    const slice = values.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }
  
  static calculateEMA(values: number[], period: number): number {
    if (values.length < period) return 0;
    
    const k = 2 / (period + 1);
    let ema = this.calculateSMA(values.slice(0, period), period);
    
    for (let i = period; i < values.length; i++) {
      ema = values[i] * k + ema * (1 - k);
    }
    
    return ema;
  }
  
  static calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

    const avgGain = this.calculateSMA(gains, period);
    const avgLoss = this.calculateSMA(losses, period);

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  static calculateRSIArray(prices: number[], period: number): number[] {
    const rsiArray = [];
    for (let i = period; i < prices.length; i++) {
      const slice = prices.slice(i - period, i + 1);
      rsiArray.push(this.calculateRSI(slice, period));
    }
    return rsiArray;
  }
  
  static calculateATR(data: MarketData[], period: number): number {
    if (data.length < period + 1) return 0;

    const trueRanges = [];
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i - 1].close;
      
      trueRanges.push(Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      ));
    }

    return this.calculateSMA(trueRanges, period);
  }
  
  static calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    
    // Simplified signal line calculation
    const signal = macd * 0.2; // Approximation
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }
  
  static calculateVWAP(data: MarketData[]): number {
    let totalVolume = 0;
    let totalVolumePrice = 0;
    
    for (const candle of data) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      totalVolumePrice += typicalPrice * candle.volume;
      totalVolume += candle.volume;
    }
    
    return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
  }
  
  static calculateStochastic(highs: number[], lows: number[], closes: number[], period: number): {
    k: number;
    d: number;
    overbought: boolean;
    oversold: boolean;
  } {
    if (highs.length < period) return { k: 50, d: 50, overbought: false, oversold: false };
    
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = k * 0.3 + 70; // Simplified D calculation
    
    return {
      k,
      d,
      overbought: k > 80,
      oversold: k < 20
    };
  }
  
  // ==================== ADVANCED CALCULATIONS ====================
  
  static calculateVolatilityRank(data: MarketData[], period: number): number {
    if (data.length < period) return 0.5;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push(Math.log(data[i].close / data[i-1].close));
    }
    
    const currentVol = this.calculateStandardDeviation(returns.slice(-period), 0);
    const historicalVols = [];
    
    for (let i = period; i < returns.length; i++) {
      const vol = this.calculateStandardDeviation(returns.slice(i-period, i), 0);
      historicalVols.push(vol);
    }
    
    const rank = historicalVols.filter(v => v < currentVol).length / historicalVols.length;
    return rank;
  }
  
  static calculateTrendAlignment(price: number, ema20: number, ema50: number, ema200: number): number {
    let score = 0;
    
    // Price vs EMAs
    if (price > ema20) score += 0.25;
    if (price > ema50) score += 0.25;
    if (price > ema200) score += 0.25;
    
    // EMA alignment
    if (ema20 > ema50 && ema50 > ema200) score += 0.25;
    else if (ema20 < ema50 && ema50 < ema200) score -= 0.25;
    
    return Math.max(-1, Math.min(1, score * 4)); // Scale to -1 to 1
  }
  
  static detectRSIDivergence(prices: number[], rsiValues: number[]): 'bullish' | 'bearish' | 'none' {
    if (prices.length < 10 || rsiValues.length < 10) return 'none';
    
    const recentPrices = prices.slice(-5);
    const recentRSI = rsiValues.slice(-5);
    
    const priceSlope = (recentPrices[4] - recentPrices[0]) / 4;
    const rsiSlope = (recentRSI[4] - recentRSI[0]) / 4;
    
    // Bullish divergence: price falling, RSI rising
    if (priceSlope < -0.001 && rsiSlope > 0.5) return 'bullish';
    
    // Bearish divergence: price rising, RSI falling
    if (priceSlope > 0.001 && rsiSlope < -0.5) return 'bearish';
    
    return 'none';
  }
  
  static calculatePivotLevels(data: MarketData[]): {
    pivot: number;
    support: number;
    resistance: number;
  } {
    if (data.length === 0) return { pivot: 0, support: 0, resistance: 0 };
    
    const lastCandle = data[data.length - 1];
    const pivot = (lastCandle.high + lastCandle.low + lastCandle.close) / 3;
    
    return {
      pivot,
      support: pivot * 2 - lastCandle.high,
      resistance: pivot * 2 - lastCandle.low
    };
  }
  
  static calculateMomentum(prices: number[], period: number): number {
    if (prices.length < period + 1) return 0;
    
    const current = prices[prices.length - 1];
    const previous = prices[prices.length - 1 - period];
    
    return ((current - previous) / previous) * 100;
  }
  
  // ==================== UTILITY METHODS ====================
  
  static calculateStandardDeviation(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    
    const actualMean = mean || values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - actualMean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
  
  static calculateMonthlyReturns(equityData: BacktestEquityPoint[]): Array<{
    month: string;
    return: number;
    trades: number;
    winRate: number;
  }> {
    // Simplified monthly returns calculation
    const monthlyData: Array<{
      month: string;
      return: number;
      trades: number;
      winRate: number;
    }> = [];
    
    // Group by month and calculate returns
    const monthlyGroups = new Map<string, BacktestEquityPoint[]>();
    
    for (const point of equityData) {
      const date = new Date(point.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, []);
      }
      monthlyGroups.get(monthKey)!.push(point);
    }
    
    for (const [month, points] of monthlyGroups) {
      if (points.length < 2) continue;
      
      const startBalance = points[0].balance;
      const endBalance = points[points.length - 1].balance;
      const monthReturn = ((endBalance - startBalance) / startBalance) * 100;
      
      monthlyData.push({
        month,
        return: monthReturn,
        trades: points[points.length - 1].trades - points[0].trades,
        winRate: 0 // Simplified
      });
    }
    
    return monthlyData;
  }
}
