// Real Backtesting Engine - No Fake Data!
// Executes actual trading strategies on historical market data

import { 
  TradingSignal, 
  MarketData, 
  TechnicalIndicators,
  VolatilityAdjustedBreakoutStrategy,
  MeanReversionStrategy,
  DualTimeframeTrendStrategy,
  PropFirmRiskManager,
  NewsFilter
} from './gold-trading-strategies';
import { ICTSMCStrategy } from './ict-smc-strategy';
import { QuantumScalperStrategy } from './quantum-scalper-strategy';
import { AggressiveScalperStrategy } from './aggressive-scalper';
import axios from 'axios';
import { Agent } from "https";
import { DatasetManager } from "./dataset-manager";

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Local dataset fetcher - COMPLETELY FREE AND UNLIMITED
async function fetchHistoricalCandlesFromDataset(
  datasetId: string
): Promise<MarketData[]> {
  console.log(
    `📁 Loading REAL historical data from local dataset: ${datasetId}`
  );

  const manager = new DatasetManager();

  try {
    const datasets = await manager.getDatasets();
    const dataset = datasets.find((d) => d.id === datasetId);

    if (!dataset) {
      throw new Error(`Dataset ${datasetId} not found`);
    }

    const data = manager.loadDataset(dataset.filePath);
    console.log(
      `✅ Loaded ${data.length} REAL candles from local dataset (UNLIMITED)`
    );
    return data;
  } catch (error) {
    console.error("❌ Dataset loading failed:", error);
    throw new Error(
      `Failed to load dataset: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export interface BacktestTrade {
  id: string;
  entryTime: string;
  exitTime?: string;
  symbol: string;
  action: "buy" | "sell";
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  volume: number;
  pnl?: number;
  pnlPips?: number;
  duration?: number; // in minutes
  exitReason?: "take-profit" | "stop-loss" | "manual" | "end-of-test";
  strategy: string;
  confidence: number;
  reason: string;
  maxFavorableExcursion?: number; // MFE - how much profit it could have made
  maxAdverseExcursion?: number; // MAE - how much loss it went into
}

export interface BacktestEquityPoint {
  timestamp: string;
  balance: number;
  drawdown: number;
  runningPnL: number;
  openTrades: number;
}

export interface BacktestResults {
  // Basic Info
  strategy: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;

  // Performance Metrics
  totalReturn: number;
  totalReturnPercent: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;

  // Trade Statistics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageTradeDuration: number; // in minutes

  // Risk Metrics
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  averageMFE: number;
  averageMAE: number;

  // Data Arrays
  trades: BacktestTrade[];
  equityData: BacktestEquityPoint[];

  // Execution Details
  executionTime: number; // ms
  dataPoints: number;
  isRealBacktest: boolean; // Always true for this engine
}

export interface BacktestParams {
  strategy: "aggressive_scalper" | "vab_breakout" | "mean_reversion" | "dual_timeframe_trend" | "ict_smc" | "quantum_scalper" | "smart_money";
  datasetId: string; // Changed from symbol/dates to dataset selection
  initialBalance: number;
  propFirm: "equity-edge" | "fundednext";
  riskPerTrade: number; // percentage
}
export class BacktestEngine {
  private vabStrategy: VolatilityAdjustedBreakoutStrategy;
  private meanReversionStrategy: MeanReversionStrategy;
  private trendStrategy: DualTimeframeTrendStrategy;
  private ictSmcStrategy: ICTSMCStrategy;
  private quantumScalper: QuantumScalperStrategy;
  private aggressiveScalper: AggressiveScalperStrategy;
  private riskManager: PropFirmRiskManager;
  private newsFilter: NewsFilter;
  // MetaAPI clients removed - using Yahoo Finance for historical data
  // MetaAPI still used for live trading execution only

  constructor() {
    this.vabStrategy = new VolatilityAdjustedBreakoutStrategy();
    this.meanReversionStrategy = new MeanReversionStrategy();
    this.trendStrategy = new DualTimeframeTrendStrategy();
    this.ictSmcStrategy = new ICTSMCStrategy();
    this.quantumScalper = new QuantumScalperStrategy();
    this.aggressiveScalper = new AggressiveScalperStrategy();
    this.riskManager = new PropFirmRiskManager();
    this.newsFilter = new NewsFilter();
  }

  // Main backtesting function - executes real strategy logic
  async runBacktest(params: BacktestParams): Promise<BacktestResults> {
    const startTime = Date.now();
    console.log(`🚀 Starting REAL backtest for ${params.strategy}`);
    console.log(`📁 Using local dataset: ${params.datasetId}`);
    console.log(
      `📡 Loading REAL historical data from dataset (UNLIMITED & FREE)`
    );

    // Load real historical data from local dataset
    const historicalData = await fetchHistoricalCandlesFromDataset(
      params.datasetId
    );

    if (historicalData.length === 0) {
      throw new Error("No historical data found in the selected dataset.");
    }

    // If dual timeframe trend is selected, fetch HTF data as well
    let htfData: MarketData[] | null = null;
    if (params.strategy === "dual_timeframe_trend") {
      const htf = params.htfTimeframe || this.getDefaultHTF(params.timeframe);
      htfData = await fetchHistoricalCandlesYahoo(
        params.symbol,
        htf,
        params.startDate,
        params.endDate
      );
    }

    console.log(`📊 Processing ${historicalData.length} data points...`);

    // Initialize backtest state
    let currentBalance = params.initialBalance;
    let maxBalance = currentBalance;
    let maxDrawdown = 0;
    let openTrades: BacktestTrade[] = [];
    const closedTrades: BacktestTrade[] = [];
    const equityData: BacktestEquityPoint[] = [];

    // Process each data point
    for (let i = 20; i < historicalData.length; i++) {
      // Start at 20 for indicators
      const currentData = historicalData.slice(i - 19, i + 1); // 20 periods for indicators
      const currentCandle = currentData[currentData.length - 1];

      // Calculate technical indicators
      const indicators = this.calculateTechnicalIndicators(currentData);

      // Check for trade exits first
      const { updatedTrades, closedTradesThisPeriod } = this.checkTradeExits(
        openTrades,
        currentCandle,
        indicators
      );
      openTrades = updatedTrades;
      closedTrades.push(...closedTradesThisPeriod);

      // Update balance with closed trades
      for (const trade of closedTradesThisPeriod) {
        if (trade.pnl) {
          currentBalance += trade.pnl;
        }
      }

      // Check for new trade entries (only if we have less than 3 open trades)
      if (openTrades.length < 3) {
        let signal: TradingSignal;
        if (params.strategy === "dual_timeframe_trend" && htfData) {
          const currentTime = new Date(currentCandle.timestamp).getTime();
          const htfWindow = this.getHTFWindowForTime(htfData, currentTime);
          const htfIndicators = this.calculateTechnicalIndicators(htfWindow);
          signal = this.trendStrategy.analyzeMarket(
            currentData,
            htfWindow,
            indicators,
            htfIndicators
          );
        } else {
          signal = this.getStrategySignal(
            params.strategy,
            currentData,
            indicators
          );
        }

        // DEBUG: Log signal to see what's happening
        if (signal.action !== 'hold') {
          console.log(`📊 Signal generated: ${signal.action} with confidence ${signal.confidence}%`);
        }
        
        if (
          signal.confidence >= 75 &&
          (signal.action === "buy" || signal.action === "sell")
        ) {
          // Risk management - simplified check for now
          const canTrade = openTrades.length < 3; // Max 3 concurrent trades
          
          if (canTrade) {
            const newTrade = this.createTradeFromSignal(
              signal,
              currentCandle,
              currentBalance,
              params.riskPerTrade
            );

            if (newTrade) {
              openTrades.push(newTrade);
              console.log(
                `📈 New ${newTrade.action.toUpperCase()} trade: ${
                  newTrade.entryPrice
                } | SL: ${newTrade.stopLoss} | TP: ${newTrade.takeProfit}`
              );
            }
          }
        }
      }

      // Update equity curve
      const runningPnL = closedTrades.reduce(
        (sum, trade) => sum + (trade.pnl || 0),
        0
      );
      const unrealizedPnL = this.calculateUnrealizedPnL(
        openTrades,
        currentCandle
      );
      const totalEquity = params.initialBalance + runningPnL + unrealizedPnL;

      // Track drawdown
      if (totalEquity > maxBalance) {
        maxBalance = totalEquity;
      }
      const currentDrawdown = maxBalance - totalEquity;
      maxDrawdown = Math.max(maxDrawdown, currentDrawdown);

      // Record equity point every 10 periods to reduce data size
      if (i % 10 === 0) {
        equityData.push({
          timestamp: currentCandle.timestamp,
          balance: totalEquity,
          drawdown: currentDrawdown,
          runningPnL: runningPnL,
          openTrades: openTrades.length,
        });
      }
    }

    // Close any remaining open trades at the end
    for (const trade of openTrades) {
      const finalCandle = historicalData[historicalData.length - 1];
      trade.exitTime = finalCandle.timestamp;
      trade.exitPrice = finalCandle.close;
      trade.exitReason = "end-of-test";

      // Calculate final P&L
      if (trade.action === "buy") {
        trade.pnl = (trade.exitPrice - trade.entryPrice) * trade.volume;
      } else {
        trade.pnl = (trade.entryPrice - trade.exitPrice) * trade.volume;
      }

      trade.pnlPips = (Math.abs(trade.pnl) / trade.volume) * 10000;
      trade.duration =
        new Date(trade.exitTime).getTime() -
        new Date(trade.entryTime).getTime();

      closedTrades.push(trade);
      currentBalance += trade.pnl;
    }

    // Calculate final metrics
    const results = this.calculateBacktestMetrics(
      params,
      closedTrades,
      equityData,
      currentBalance,
      maxDrawdown,
      Date.now() - startTime,
      historicalData.length
    );

    console.log(`✅ Backtest completed in ${results.executionTime}ms`);
    console.log(
      `📊 Results: ${results.totalTrades} trades, ${results.winRate.toFixed(
        1
      )}% win rate, ${results.totalReturnPercent.toFixed(2)}% return`
    );

    return results;
  }

  // Determine a sensible HTF for a given LTF
  private getDefaultHTF(
    lt: BacktestParams["timeframe"]
  ): BacktestParams["timeframe"] {
    const map: Record<
      BacktestParams["timeframe"],
      BacktestParams["timeframe"]
    > = {
      "1m": "15m",
      "5m": "30m",
      "15m": "1h",
      "30m": "4h",
      "1h": "1d",
      "4h": "1d",
      "1d": "1d",
    };
    return map[lt];
  }

  // Return HTF window up to the HTF candle containing ts
  private getHTFWindowForTime(htfData: MarketData[], ts: number): MarketData[] {
    if (!htfData.length) return [];
    const idx = htfData.findIndex((d) => new Date(d.timestamp).getTime() > ts);
    const endIdx = idx === -1 ? htfData.length : Math.max(idx, 1);
    const startIdx = Math.max(0, endIdx - 200);
    return htfData.slice(startIdx, endIdx);
  }

  // Cache symbol spec in-memory per process
  private symbolSpecCache: { minVolume: number; volumeStep: number } | null =
    null;
  private getSymbolSpecSync() {
    // Provide safe defaults if spec not loaded yet; will be set on first call lazily
    if (!this.symbolSpecCache) {
      this.symbolSpecCache = { minVolume: 0.01, volumeStep: 0.01 };
    }
    return this.symbolSpecCache;
  }
  // REMOVED: ensureSymbolSpec - not needed for Yahoo Finance backtesting

  private calculateTechnicalIndicators(
    data: MarketData[]
  ): TechnicalIndicators {
    const closes = data.map((d) => d.close);
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);

    // Calculate ATR
    const atr = this.calculateATR(data, 14);

    // Calculate Bollinger Bands
    const sma20 = this.calculateSMA(closes, 20);
    const stdDev = this.calculateStandardDeviation(closes.slice(-20), sma20);

    // Calculate RSI
    const rsi = this.calculateRSI(closes, 14);

    // Calculate EMAs
    const ema50 = this.calculateEMA(closes, 50);
    const ema200 = this.calculateEMA(closes, 200);

    // Session high/low - dynamic based on timeframe (8 hours worth of data)
    const timeframeToSessionPeriods: Record<string, number> = {
      "1m": 480, // 8 hours = 480 minutes
      "5m": 96, // 8 hours = 96 * 5min periods
      "15m": 32, // 8 hours = 32 * 15min periods
      "30m": 16, // 8 hours = 16 * 30min periods
      "1h": 8, // 8 hours = 8 * 1hour periods
      "4h": 2, // 8 hours = 2 * 4hour periods
      "1d": 1, // Use 1 day for daily timeframe
    };

    const sessionPeriods = timeframeToSessionPeriods[data[0]?.timeframe] || 32;
    const sessionData = data.slice(-sessionPeriods);
    const sessionHigh = Math.max(...sessionData.map((d) => d.high));
    const sessionLow = Math.min(...sessionData.map((d) => d.low));

    return {
      bollingerUpper: sma20 + stdDev * 2,
      bollingerMiddle: sma20,
      bollingerLower: sma20 - stdDev * 2,
      rsi,
      ema50,
      ema200,
      sma20,
      atr,
      atrMultiplier: 2.0,
      sessionHigh,
      sessionLow,
      isHighVolatility:
        atr >
        this.calculateSMA(
          data
            .slice(-20)
            .map((d, i, arr) =>
              i > 0 ? this.calculateTrueRange(d, arr[i - 1]) : d.high - d.low
            ),
          20
        ) *
          1.5,
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
      let exitReason: "take-profit" | "stop-loss" = "stop-loss";
      let exitPrice = candle.close;

      // Update MFE and MAE
      if (trade.action === "buy") {
        const currentProfit = (candle.high - trade.entryPrice) * trade.volume;
        const currentLoss = (candle.low - trade.entryPrice) * trade.volume;
        trade.maxFavorableExcursion = Math.max(
          trade.maxFavorableExcursion || 0,
          currentProfit
        );
        trade.maxAdverseExcursion = Math.min(
          trade.maxAdverseExcursion || 0,
          currentLoss
        );

        // Check exits
        if (candle.high >= trade.takeProfit) {
          shouldClose = true;
          exitReason = "take-profit";
          exitPrice = trade.takeProfit;
        } else if (candle.low <= trade.stopLoss) {
          shouldClose = true;
          exitReason = "stop-loss";
          exitPrice = trade.stopLoss;
        }
      } else {
        const currentProfit = (trade.entryPrice - candle.low) * trade.volume;
        const currentLoss = (trade.entryPrice - candle.high) * trade.volume;
        trade.maxFavorableExcursion = Math.max(
          trade.maxFavorableExcursion || 0,
          currentProfit
        );
        trade.maxAdverseExcursion = Math.min(
          trade.maxAdverseExcursion || 0,
          currentLoss
        );

        // Check exits
        if (candle.low <= trade.takeProfit) {
          shouldClose = true;
          exitReason = "take-profit";
          exitPrice = trade.takeProfit;
        } else if (candle.high >= trade.stopLoss) {
          shouldClose = true;
          exitReason = "stop-loss";
          exitPrice = trade.stopLoss;
        }
      }

      if (shouldClose) {
        trade.exitTime = candle.timestamp;
        trade.exitPrice = exitPrice;
        trade.exitReason = exitReason;

        // Calculate P&L
        if (trade.action === "buy") {
          trade.pnl = (exitPrice - trade.entryPrice) * trade.volume;
        } else {
          trade.pnl = (trade.entryPrice - exitPrice) * trade.volume;
        }

        trade.pnlPips = (Math.abs(trade.pnl) / trade.volume) * 10000;
        trade.duration =
          new Date(trade.exitTime).getTime() -
          new Date(trade.entryTime).getTime();

        closed.push(trade);
      } else {
        stillOpen.push(trade);
      }
    }

    return { updatedTrades: stillOpen, closedTradesThisPeriod: closed };
  }

  private getStrategySignal(
    strategy: string,
    data: MarketData[],
    indicators: TechnicalIndicators
  ): TradingSignal {
    switch (strategy) {
      case "aggressive_scalper":
        // Use the aggressive scalper that ACTUALLY TRADES
        return this.aggressiveScalper.analyzeMarket(data, indicators);
      case "vab_breakout":
        return this.vabStrategy.analyzeMarket(data, indicators);
      case "mean_reversion":
        return this.meanReversionStrategy.analyzeMarket(data, indicators);
      case "dual_timeframe_trend":
        // Simplified - using same timeframe for both
        return this.trendStrategy.analyzeMarket(
          data,
          data,
          indicators,
          indicators
        );
      case "ict_smc":
      case "smart_money":
        // Professional ICT/SMC strategy
        return this.ictSmcStrategy.analyzeMarket(data, indicators);
      case "quantum_scalper":
        // AI Quantum Scalper - Beyond human capability
        return this.quantumScalper.analyzeMarket(data, indicators);
      default:
        // Default to Quantum Scalper as it's the most advanced
        return this.quantumScalper.analyzeMarket(data, indicators);
    }
  }

  private createTradeFromSignal(
    signal: TradingSignal,
    candle: MarketData,
    balance: number,
    riskPercent: number
  ): BacktestTrade | null {
    // Calculate volume (position size) - PROPER FOREX LOT SIZING
    const riskAmount = balance * (riskPercent / 100);
    const stopDistance = Math.abs(candle.close - signal.stopLoss);
    const pipValue = 0.01; // For XAUUSD, 1 pip = $0.01 per 0.01 lot

    // Proper lot size calculation
    let volume = riskAmount / (stopDistance * 100); // Divide by 100 for proper scaling

    // Ensure minimum trade size
    if (volume < 0.01) {
      volume = 0.01;
    }
    
    // Maximum lot size cap to prevent crazy positions
    if (volume > 1.0) {
      volume = 1.0; // Max 1 standard lot
    }

    const { minVolume, volumeStep } = this.getSymbolSpecSync();
    volume = Math.max(minVolume, Math.floor(volume / volumeStep) * volumeStep);
    if (volume < minVolume) return null;

    return {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entryTime: candle.timestamp,
      symbol: "XAUUSD",
      action: signal.action as "buy" | "sell",
      entryPrice: candle.close,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      volume: Math.round(volume / volumeStep) * volumeStep,
      strategy: signal.strategy,
      confidence: signal.confidence,
      reason: signal.reason,
    };
  }

  private calculateUnrealizedPnL(
    openTrades: BacktestTrade[],
    candle: MarketData
  ): number {
    return openTrades.reduce((total, trade) => {
      if (trade.action === "buy") {
        return total + (candle.close - trade.entryPrice) * trade.volume;
      } else {
        return total + (trade.entryPrice - candle.close) * trade.volume;
      }
    }, 0);
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
    const winningTrades = trades.filter((t) => (t.pnl || 0) > 0);
    const losingTrades = trades.filter((t) => (t.pnl || 0) < 0);

    const totalReturn = finalBalance - params.initialBalance;
    const totalReturnPercent = (totalReturn / params.initialBalance) * 100;

    const averageWin =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) /
          winningTrades.length
        : 0;

    const averageLoss =
      losingTrades.length > 0
        ? Math.abs(
            losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) /
              losingTrades.length
          )
        : 0;

    const profitFactor =
      averageLoss > 0
        ? (averageWin * winningTrades.length) /
          (averageLoss * losingTrades.length)
        : 0;

    return {
      strategy: params.strategy
        .replace("_", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      symbol: params.symbol,
      timeframe: params.timeframe,
      startDate: params.startDate,
      endDate: params.endDate,
      initialBalance: params.initialBalance,
      finalBalance: Math.round(finalBalance * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
      winRate:
        trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      profitFactor: Math.round(profitFactor * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      maxDrawdownPercent:
        Math.round((maxDrawdown / params.initialBalance) * 10000) / 100,
      sharpeRatio: 0, // Simplified for now
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageWin: Math.round(averageWin * 100) / 100,
      averageLoss: Math.round(averageLoss * 100) / 100,
      largestWin:
        winningTrades.length > 0
          ? Math.max(...winningTrades.map((t) => t.pnl || 0))
          : 0,
      largestLoss:
        losingTrades.length > 0
          ? Math.min(...losingTrades.map((t) => t.pnl || 0))
          : 0,
      averageTradeDuration:
        trades.length > 0
          ? trades.reduce((sum, t) => sum + (t.duration || 0), 0) /
            trades.length /
            (1000 * 60) // Convert to minutes
          : 0,
      maxConsecutiveLosses: this.calculateMaxConsecutive(trades, false),
      maxConsecutiveWins: this.calculateMaxConsecutive(trades, true),
      averageMFE:
        trades.length > 0
          ? trades.reduce((sum, t) => sum + (t.maxFavorableExcursion || 0), 0) /
            trades.length
          : 0,
      averageMAE:
        trades.length > 0
          ? trades.reduce((sum, t) => sum + (t.maxAdverseExcursion || 0), 0) /
            trades.length
          : 0,
      trades,
      equityData,
      executionTime,
      dataPoints,
      isRealBacktest: true,
    };
  }

  // Helper calculation methods
  private calculateSMA(values: number[], period: number): number {
    const slice = values.slice(-period);
    return slice.reduce((sum, val) => sum + val, 0) / slice.length;
  }

  private calculateEMA(values: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = values[0];

    for (let i = 1; i < values.length; i++) {
      ema = values[i] * multiplier + ema * (1 - multiplier);
    }

    return ema;
  }

  private calculateRSI(prices: number[], period: number): number {
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < Math.min(prices.length, period + 1); i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;

    return 100 - 100 / (1 + rs);
  }

  private calculateATR(data: MarketData[], period: number): number {
    let atr = 0;

    for (let i = 1; i < Math.min(data.length, period + 1); i++) {
      atr += this.calculateTrueRange(data[i], data[i - 1]);
    }

    return atr / period;
  }

  private calculateTrueRange(
    current: MarketData,
    previous?: MarketData
  ): number {
    if (!previous) {
      return current.high - current.low;
    }

    return Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
    const avgSquaredDiff =
      squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private calculateMaxConsecutive(
    trades: BacktestTrade[],
    wins: boolean
  ): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const trade of trades) {
      const isWin = (trade.pnl || 0) > 0;
      if (isWin === wins) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }
}
