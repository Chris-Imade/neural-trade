import { QuantumScalperStrategy } from './quantum-scalper-strategy';
import { AggressiveScalperStrategy } from './aggressive-scalper';
import { DatasetManager } from './dataset-manager';

// Interfaces
export interface MarketData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
}

export interface TradingSignal {
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  strategy: string;
  reason: string;
  timeframe: string;
}

export interface TechnicalIndicators {
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  rsi: number;
  ema20: number;
  ema50: number;
  sma20: number;
  atr: number;
  atrMultiplier: number;
  sessionHigh: number;
  sessionLow: number;
  volume: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
}

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
  holdTime?: number;
  mfe?: number;
  mae?: number;
  exitReason?: string;
}

export interface BacktestEquityPoint {
  timestamp: string;
  balance: number;
  drawdown: number;
  trades: number;
}

export interface BacktestResults {
  // Key Metrics
  initialBalance: number;
  finalBalance: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalProfit: number;
  totalLoss: number;
  
  // Trading Statistics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  
  // Risk Metrics
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  profitFactor: number;
  
  // Trade Details
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageHoldTime: number;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  averageMFE: number;
  averageMAE: number;
  
  // Data Arrays
  trades: BacktestTrade[];
  equityData: BacktestEquityPoint[];
  equityCurve: BacktestEquityPoint[];  // Alias for compatibility
  
  // Execution Details
  executionTime: number;
  dataPoints: number;
  isRealBacktest: boolean;
}

export interface BacktestParams {
  strategy: 'aggressive_scalper' | 'quantum_scalper';
  datasetId: string;
  initialBalance: number;
  riskPerTrade: number;
  maxDrawdownPercent?: number;  // Fail-safe: stop if drawdown exceeds this
}

export class BacktestEngine {
  private quantumScalper: QuantumScalperStrategy;
  private aggressiveScalper: AggressiveScalperStrategy;

  constructor() {
    this.quantumScalper = new QuantumScalperStrategy();
    this.aggressiveScalper = new AggressiveScalperStrategy();
  }

  async runBacktest(params: BacktestParams): Promise<BacktestResults> {
    const startTime = Date.now();
    console.log(`🚀 Starting backtest for ${params.strategy}`);
    console.log(`📁 Using dataset: ${params.datasetId}`);

    // Load dataset
    const manager = new DatasetManager();
    const datasets = await manager.getDatasets();
    const dataset = datasets.find(d => d.id === params.datasetId);

    if (!dataset) {
      throw new Error(`Dataset not found: ${params.datasetId}`);
    }

    const rawData = manager.loadDataset(dataset.filePath);
    
    // Filter out null values and add timeframe
    const historicalData: MarketData[] = rawData
      .filter((candle): candle is NonNullable<typeof candle> => candle !== null)
      .map(candle => ({
        ...candle,
        timeframe: '5m' // Default timeframe for datasets
      }));
    
    console.log(`✅ Loaded ${historicalData.length} candles from dataset`);

    // Run backtest
    const trades: BacktestTrade[] = [];
    const openTrades: BacktestTrade[] = [];
    const equityData: BacktestEquityPoint[] = [];
    let currentBalance = params.initialBalance;
    let maxBalance = params.initialBalance;
    let maxDrawdown = 0;

    // Process each candle
    console.log(`📊 Processing ${historicalData.length - 50} candles...`);
    let signalCount = 0;
    let tradeCount = 0;
    
    for (let i = 50; i < historicalData.length; i++) {
      const currentCandle = historicalData[i];
      const marketWindow = historicalData.slice(Math.max(0, i - 50), i + 1);
      
      // Log progress every 100 candles
      if (i % 100 === 0) {
        console.log(`⏳ Progress: ${i}/${historicalData.length} candles (${Math.round((i/historicalData.length) * 100)}%)`);
      }
      
      // Calculate indicators
      const indicators = this.calculateTechnicalIndicators(marketWindow);
      
      // Check for exits
      const { updatedTrades, closedTradesThisPeriod } = this.checkTradeExits(
        openTrades, 
        currentCandle, 
        indicators
      );

      // Update balance from closed trades
      for (const closedTrade of closedTradesThisPeriod) {
        if (closedTrade.profit) {
          currentBalance += closedTrade.profit;
        }
        trades.push(closedTrade);
      }

      // Get strategy signal
      const signal = this.getStrategySignal(
        params.strategy,
        marketWindow,
        indicators
      );
      
      // Track signals
      if (signal.action !== 'hold') {
        signalCount++;
        if (signalCount <= 5) {  // Log first 5 signals for proof
          console.log(`🎯 Signal #${signalCount}: ${signal.action.toUpperCase()} @ ${currentCandle.close} (confidence: ${signal.confidence}%)`);
        }
      }

      // Execute trade if signal is strong
      if (signal.action !== 'hold' && signal.confidence >= 75 && openTrades.length < 3) {
        const newTrade = this.createTradeFromSignal(
          signal,
          currentCandle,
          currentBalance,
          params.riskPerTrade
        );

        if (newTrade) {
          openTrades.push(newTrade);
          tradeCount++;
          console.log(`💰 Trade #${tradeCount} OPENED: ${newTrade.action.toUpperCase()} @ ${newTrade.entryPrice} | SL: ${newTrade.stopLoss} | TP: ${newTrade.takeProfit}`);
        }
      }

      // Update equity curve
      const unrealizedPnL = this.calculateUnrealizedPnL(openTrades, currentCandle);
      const currentEquity = currentBalance + unrealizedPnL;
      
      if (currentEquity > maxBalance) {
        maxBalance = currentEquity;
      }
      
      const drawdown = ((maxBalance - currentEquity) / maxBalance) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
      
      // FAIL-SAFE: Stop if drawdown exceeds maximum allowed
      if (params.maxDrawdownPercent && drawdown > params.maxDrawdownPercent) {
        console.log(`🛑 FAIL-SAFE TRIGGERED! Drawdown ${drawdown.toFixed(1)}% exceeds maximum ${params.maxDrawdownPercent}%`);
        console.log(`💔 Stopping backtest to protect capital. Balance: $${currentEquity.toFixed(2)}`);
        
        // Close all open trades
        for (const trade of openTrades) {
          trade.exitTime = currentCandle.timestamp;
          trade.exitPrice = currentCandle.close;
          trade.exitReason = 'Fail-safe stop';
          
          const profit = trade.action === 'buy' 
            ? (trade.exitPrice - trade.entryPrice) * trade.volume * 100
            : (trade.entryPrice - trade.exitPrice) * trade.volume * 100;
          
          trade.profit = profit;
          trade.profitPercent = (profit / (trade.entryPrice * trade.volume * 100)) * 100;
          trades.push(trade);
          currentBalance += profit;
        }
        
        break; // Exit the backtest loop
      }

      equityData.push({
        timestamp: currentCandle.timestamp,
        balance: currentEquity,
        drawdown: drawdown,
        trades: trades.length
      });
    }

    // Close remaining open trades
    for (const trade of openTrades) {
      const lastCandle = historicalData[historicalData.length - 1];
      trade.exitTime = lastCandle.timestamp;
      trade.exitPrice = lastCandle.close;
      trade.exitReason = 'End of backtest';
      
      const profit = trade.action === 'buy' 
        ? (trade.exitPrice - trade.entryPrice) * trade.volume * 100
        : (trade.entryPrice - trade.exitPrice) * trade.volume * 100;
      
      trade.profit = profit;
      trade.profitPercent = (profit / (trade.entryPrice * trade.volume * 100)) * 100;
      trades.push(trade);
      currentBalance += profit;
    }

    // Final summary
    const executionTime = Date.now() - startTime;
    console.log(`\n✅ BACKTEST COMPLETE!`);
    console.log(`📈 Total Signals Generated: ${signalCount}`);
    console.log(`💰 Total Trades Executed: ${tradeCount}`); 
    console.log(`⏱️ Execution Time: ${executionTime}ms`);
    console.log(`📊 Candles Processed: ${historicalData.length}`);
    
    // Calculate metrics
    return this.calculateBacktestMetrics(
      params,
      trades,
      equityData,
      currentBalance,
      maxDrawdown,
      Date.now() - startTime,
      historicalData.length
    );
  }

  private getStrategySignal(
    strategy: string,
    data: MarketData[],
    indicators: TechnicalIndicators
  ): TradingSignal {
    switch (strategy) {
      case 'aggressive_scalper':
        return this.aggressiveScalper.analyzeMarket(data, indicators);
      case 'quantum_scalper':
        return this.quantumScalper.analyzeMarket(data, indicators);
      default:
        return {
          action: 'hold',
          confidence: 0,
          stopLoss: 0,
          takeProfit: 0,
          riskReward: 0,
          strategy: 'unknown',
          reason: 'Unknown strategy',
          timeframe: '5m'
        };
    }
  }

  private createTradeFromSignal(
    signal: TradingSignal,
    candle: MarketData,
    balance: number,
    riskPercent: number
  ): BacktestTrade | null {
    // Calculate position size based on risk
    const riskAmount = balance * (riskPercent / 100);
    const stopDistance = Math.abs(candle.close - signal.stopLoss);
    
    console.log(`📊 Risk Management: ${riskPercent}% of $${balance.toFixed(2)} = $${riskAmount.toFixed(2)} risk`);
    
    if (stopDistance === 0) return null;
    
    // Calculate lot size
    let volume = riskAmount / (stopDistance * 100);
    
    // Ensure minimum trade size
    if (volume < 0.01) {
      volume = 0.01;
    }
    
    // Maximum lot size cap
    if (volume > 1.0) {
      volume = 1.0;
    }

    return {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entryTime: candle.timestamp,
      symbol: 'XAUUSD',
      action: signal.action as 'buy' | 'sell',
      entryPrice: candle.close,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      volume: Math.round(volume * 100) / 100,
      strategy: signal.strategy,
      confidence: signal.confidence,
      reason: signal.reason
    };
  }

  private checkTradeExits(
    openTrades: BacktestTrade[],
    candle: MarketData,
    indicators: TechnicalIndicators
  ): {
    updatedTrades: BacktestTrade[];
    closedTradesThisPeriod: BacktestTrade[];
  } {
    const stillOpen: BacktestTrade[] = [];
    const closed: BacktestTrade[] = [];

    for (const trade of openTrades) {
      let shouldClose = false;
      let exitReason = '';

      // Check stop loss
      if (trade.action === 'buy' && candle.low <= trade.stopLoss) {
        shouldClose = true;
        exitReason = 'Stop loss hit';
        trade.exitPrice = trade.stopLoss;
      } else if (trade.action === 'sell' && candle.high >= trade.stopLoss) {
        shouldClose = true;
        exitReason = 'Stop loss hit';
        trade.exitPrice = trade.stopLoss;
      }

      // Check take profit
      if (!shouldClose) {
        if (trade.action === 'buy' && candle.high >= trade.takeProfit) {
          shouldClose = true;
          exitReason = 'Take profit hit';
          trade.exitPrice = trade.takeProfit;
        } else if (trade.action === 'sell' && candle.low <= trade.takeProfit) {
          shouldClose = true;
          exitReason = 'Take profit hit';
          trade.exitPrice = trade.takeProfit;
        }
      }

      if (shouldClose) {
        trade.exitTime = candle.timestamp;
        trade.exitReason = exitReason;
        
        // Calculate profit
        const profit = trade.action === 'buy' 
          ? (trade.exitPrice! - trade.entryPrice) * trade.volume * 100
          : (trade.entryPrice - trade.exitPrice!) * trade.volume * 100;
        
        trade.profit = profit;
        trade.profitPercent = (profit / (trade.entryPrice * trade.volume * 100)) * 100;
        
        closed.push(trade);
      } else {
        stillOpen.push(trade);
      }
    }

    return {
      updatedTrades: stillOpen,
      closedTradesThisPeriod: closed
    };
  }

  private calculateUnrealizedPnL(openTrades: BacktestTrade[], candle: MarketData): number {
    let unrealizedPnL = 0;

    for (const trade of openTrades) {
      const currentPrice = candle.close;
      const pnl = trade.action === 'buy'
        ? (currentPrice - trade.entryPrice) * trade.volume * 100
        : (trade.entryPrice - currentPrice) * trade.volume * 100;
      
      unrealizedPnL += pnl;
    }

    return unrealizedPnL;
  }

  private calculateTechnicalIndicators(data: MarketData[]): TechnicalIndicators {
    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);

    // Calculate indicators
    const sma20 = this.calculateSMA(closes, 20);
    const stdDev = this.calculateStandardDeviation(closes.slice(-20), sma20);
    const bollingerUpper = sma20 + stdDev * 2;
    const bollingerMiddle = sma20;
    const bollingerLower = sma20 - stdDev * 2;

    const rsi14 = this.calculateRSI(closes, 14);
    const ema50Array = this.calculateEMA(closes, 50);
    const ema50 = ema50Array.length > 0 ? ema50Array[ema50Array.length - 1] : sma20;

    const atr14 = this.calculateATR(data, 14);
    
    // Calculate volume (average of recent volumes)
    const volumes = data.slice(-20).map(d => d.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    return {
      bollingerUpper,
      bollingerMiddle,
      bollingerLower,
      rsi: rsi14,
      ema20: sma20,
      ema50,
      sma20,
      atr: atr14,
      atrMultiplier: 2,
      sessionHigh: Math.max(...data.slice(-20).map(d => d.high)),
      sessionLow: Math.min(...data.slice(-20).map(d => d.low)),
      volume: avgVolume,
      macd: {
        macd: 0,  // Simplified for now
        signal: 0,
        histogram: 0
      },
      bollingerBands: {
        upper: bollingerUpper,
        middle: bollingerMiddle,
        lower: bollingerLower
      }
    };
  }

  private calculateBacktestMetrics(
    params: BacktestParams,
    trades: BacktestTrade[],
    equityData: BacktestEquityPoint[],
    finalBalance: number,
    maxDrawdown: number,
    executionTime: number,
    dataPoints: number
  ): BacktestResults {
    const winningTrades = trades.filter(t => t.profit && t.profit > 0);
    const losingTrades = trades.filter(t => t.profit && t.profit <= 0);
    
    const totalReturn = finalBalance - params.initialBalance;
    const totalReturnPercent = (totalReturn / params.initialBalance) * 100;
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

    const totalProfit = winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit || 0), 0));
    
    const averageWin = winningTrades.length > 0 
      ? totalProfit / winningTrades.length
      : 0;
    
    const averageLoss = losingTrades.length > 0
      ? totalLoss / losingTrades.length
      : 0;

    const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;

    // Calculate Sharpe ratio (simplified)
    const returns = [];
    for (let i = 1; i < equityData.length; i++) {
      const dailyReturn = (equityData[i].balance - equityData[i-1].balance) / equityData[i-1].balance;
      returns.push(dailyReturn);
    }
    
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = this.calculateStandardDeviation(returns, avgReturn);
    const sharpeRatio = stdDev > 0 ? (avgReturn * Math.sqrt(252)) / stdDev : 0;

    // Calculate consecutive wins/losses
    const { maxWins, maxLosses } = this.calculateMaxConsecutive(trades);

    return {
      initialBalance: params.initialBalance,
      finalBalance,
      totalReturn,
      totalReturnPercent,
      totalProfit,
      totalLoss,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      maxDrawdown,
      maxDrawdownPercent: maxDrawdown,
      sharpeRatio,
      profitFactor,
      averageWin,
      averageLoss,
      largestWin: Math.max(...trades.map(t => t.profit || 0)),
      largestLoss: Math.min(...trades.map(t => t.profit || 0)),
      averageHoldTime: 0,
      maxConsecutiveLosses: maxLosses,
      maxConsecutiveWins: maxWins,
      averageMFE: 0,
      averageMAE: 0,
      trades,
      equityData,
      equityCurve: equityData, // Alias for compatibility
      executionTime,
      dataPoints,
      isRealBacktest: true
    };
  }

  // Helper functions
  private calculateSMA(values: number[], period: number): number {
    if (values.length < period) return 0;
    const slice = values.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  private calculateEMA(values: number[], period: number): number[] {
    if (values.length < period) return [];
    const k = 2 / (period + 1);
    const emaArray = [values.slice(0, period).reduce((a, b) => a + b, 0) / period];
    
    for (let i = period; i < values.length; i++) {
      emaArray.push(values[i] * k + emaArray[emaArray.length - 1] * (1 - k));
    }
    
    return emaArray;
  }

  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateATR(data: MarketData[], period: number): number {
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

  private calculateStandardDeviation(values: number[], mean: number): number {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private calculateMaxConsecutive(trades: BacktestTrade[]): { maxWins: number; maxLosses: number } {
    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    for (const trade of trades) {
      if (trade.profit && trade.profit > 0) {
        currentWins++;
        currentLosses = 0;
        maxWins = Math.max(maxWins, currentWins);
      } else {
        currentLosses++;
        currentWins = 0;
        maxLosses = Math.max(maxLosses, currentLosses);
      }
    }

    return { maxWins, maxLosses };
  }
}
