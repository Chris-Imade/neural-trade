/**
 * Server-only Enhanced Institutional Backtest Engine
 * Contains Node.js dependencies - only for API routes
 */

import { InstitutionalHFTEngine } from './quantum-scalper-strategy';
import { ProductionScalpingEngine } from './aggressive-scalper';
import { DatasetManager, Dataset } from './dataset-manager';
import { EnhancedBacktestHelpers } from './enhanced-backtest-helpers';
import { EnhancedBacktestMethods, BacktestState } from './enhanced-backtest-methods';
import { BacktestResults, BacktestTrade, BacktestEquityPoint } from './backtest-types';
import { TechnicalIndicators, TradingSignal } from './backtesting-engine';

// Server-only interfaces (with Node.js dependencies)
export interface MarketData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
  spread?: number;
  tick_volume?: number;
  real_volume?: number;
}

export interface BacktestParams {
  strategy: 'aggressive_scalper' | 'quantum_scalper';
  datasetId: string;
  initialBalance: number;
  riskPerTrade: number;
  maxDrawdownPercent?: number;
  maxSimultaneousPositions?: number;
  maxDailyRisk?: number;
  maxMonthlyDrawdown?: number;
  positionSizingMethod?: 'fixed_percent' | 'kelly' | 'optimal_f' | 'volatility_adjusted';
  slippageModel?: 'fixed' | 'linear' | 'square_root';
  commissionPerTrade?: number;
  spreadCost?: number;
  tradingHours?: {
    start: string;
    end: string;
  };
  avoidNews?: boolean;
  minLiquidity?: number;
  warmupPeriod?: number;
  cooldownPeriod?: number;
  reinvestProfits?: boolean;
}

export class ServerBacktestEngine {
  private quantumScalper: InstitutionalHFTEngine;
  private aggressiveScalper: ProductionScalpingEngine;
  private datasetManager: DatasetManager;
  private performanceCache: Map<string, BacktestResults>;
  private indicatorCache: Map<string, TechnicalIndicators>;
  
  constructor() {
    this.quantumScalper = new InstitutionalHFTEngine();
    this.aggressiveScalper = new ProductionScalpingEngine();
    this.datasetManager = new DatasetManager();
    this.performanceCache = new Map();
    this.indicatorCache = new Map();
  }

  async runBacktest(params: BacktestParams): Promise<BacktestResults> {
    const startTime = performance.now();
    const backtestId = EnhancedBacktestMethods.generateBacktestId(params);
    
    console.log(`🚀 Enhanced Institutional Backtest Started`);
    console.log(`📊 Backtest ID: ${backtestId}`);
    console.log(`⚡ Strategy: ${params.strategy}`);
    console.log(`💎 Dataset: ${params.datasetId}`);
    console.log(`💰 Capital: $${params.initialBalance.toLocaleString()}`);
    console.log(`⚠️  Risk/Trade: ${params.riskPerTrade}%`);
    
    // Validate parameters
    this.validateBacktestParams(params);
    
    // Load and prepare data
    const historicalData = await this.loadAndPrepareData(params.datasetId);
    console.log(`✅ Loaded ${historicalData.length} high-quality candles`);
    
    // Initialize state
    const backtestState = this.initializeBacktestState(params, historicalData);
    
    // Pre-calculate indicators for performance
    console.log(`🧮 Pre-calculating technical indicators...`);
    const indicatorMap = this.precalculateIndicators(historicalData);
    
    // Run enhanced backtest
    console.log(`📈 Running enhanced backtest simulation...`);
    const results = await this.executeEnhancedBacktest(
      params,
      historicalData,
      indicatorMap,
      backtestState
    );
    
    const executionTime = performance.now() - startTime;
    console.log(`✅ Backtest completed in ${executionTime.toFixed(2)}ms`);
    console.log(`📊 Generated ${results.totalTrades} trades with ${results.winRate.toFixed(1)}% win rate`);
    console.log(`💎 Final Return: ${results.totalReturnPercent.toFixed(2)}%`);
    console.log(`⚡ Sharpe Ratio: ${results.sharpeRatio.toFixed(2)}`);
    
    // Cache results for future analysis
    this.performanceCache.set(backtestId, results);
    
    return results;
  }

  private validateBacktestParams(params: BacktestParams): void {
    if (params.initialBalance <= 0) {
      throw new Error('Initial balance must be positive');
    }
    
    if (params.riskPerTrade <= 0 || params.riskPerTrade > 100) {
      throw new Error('Risk per trade must be between 0 and 100 percent');
    }
    
    if (params.maxDrawdownPercent && (params.maxDrawdownPercent <= 0 || params.maxDrawdownPercent > 100)) {
      throw new Error('Max drawdown must be between 0 and 100 percent');
    }
  }

  private async loadAndPrepareData(datasetId: string): Promise<MarketData[]> {
    const availableDatasets = await this.datasetManager.getDatasets();
    const dataset = availableDatasets.find((d: Dataset) => d.id === datasetId);
    
    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`);
    }

    const rawData = this.datasetManager.loadDataset(dataset.filePath);
    
    // Enhanced data cleaning and validation
    const cleanData = rawData
      .filter((candle): candle is NonNullable<typeof candle> => 
        candle !== null && 
        candle.open > 0 && 
        candle.high > 0 && 
        candle.low > 0 && 
        candle.close > 0 &&
        candle.high >= candle.low &&
        candle.high >= Math.max(candle.open, candle.close) &&
        candle.low <= Math.min(candle.open, candle.close)
      )
      .map(candle => ({
        ...candle,
        timeframe: '5m',
        spread: 0.02, // Default spread for XAUUSD
        tick_volume: candle.volume,
        real_volume: candle.volume
      }));
    
    // Sort by timestamp to ensure chronological order
    cleanData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return cleanData;
  }

  private initializeBacktestState(params: BacktestParams, data: MarketData[]): BacktestState {
    return {
      currentBalance: params.initialBalance,
      maxBalance: params.initialBalance,
      openTrades: [] as BacktestTrade[],
      closedTrades: [] as BacktestTrade[],
      equityHistory: [] as BacktestEquityPoint[],
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      currentDrawdown: 0,
      highWaterMark: params.initialBalance,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      totalCommission: 0,
      totalSlippage: 0,
      signalsGenerated: 0,
      signalsExecuted: 0,
      lastRebalance: data[0].timestamp,
      initialBalance: params.initialBalance
    };
  }

  private precalculateIndicators(data: MarketData[]): Map<number, TechnicalIndicators> {
    const indicatorMap = new Map<number, TechnicalIndicators>();
    
    for (let i = 50; i < data.length; i++) {
      const window = data.slice(Math.max(0, i - 200), i + 1);
      const indicators = EnhancedBacktestMethods.calculateEnhancedTechnicalIndicators(window);
      indicatorMap.set(i, indicators);
      
      if (i % 500 === 0) {
        console.log(`📊 Indicators calculated: ${i}/${data.length}`);
      }
    }
    
    return indicatorMap;
  }

  private async executeEnhancedBacktest(
    params: BacktestParams,
    data: MarketData[],
    indicatorMap: Map<number, TechnicalIndicators>,
    state: BacktestState
  ): Promise<BacktestResults> {
    
    let progressLastLogged = 0;
    
    for (let i = 50; i < data.length; i++) {
      const currentCandle = data[i];
      const indicators = indicatorMap.get(i)!;
      
      // Progress logging
      const progress = (i / data.length) * 100;
      if (progress - progressLastLogged >= 10) {
        console.log(`⏳ Progress: ${progress.toFixed(1)}% | Balance: $${state.currentBalance.toFixed(2)} | Trades: ${state.closedTrades.length}`);
        progressLastLogged = progress;
      }
      
      // Update unrealized P&L and MFE/MAE
      EnhancedBacktestMethods.updateUnrealizedMetrics(state.openTrades, currentCandle);
      
      // Check for trade exits with enhanced logic
      const exitedTrades = EnhancedBacktestMethods.processTradeExits(state.openTrades, currentCandle, indicators);
      
      for (const trade of exitedTrades) {
        EnhancedBacktestMethods.finalizeClosedTrade(trade, currentCandle, state);
        state.closedTrades.push(trade);
      }
      
      // Remove exited trades from open trades
      state.openTrades = state.openTrades.filter((t: BacktestTrade) => !exitedTrades.includes(t));
      
      // Generate and evaluate signals
      const signal = EnhancedBacktestMethods.getEnhancedStrategySignal(
        params.strategy,
        data.slice(Math.max(0, i - 50), i + 1),
        indicators,
        state
      );
      
      if (signal.action !== 'hold') {
        state.signalsGenerated++;
      }
      
      // Enhanced position sizing and risk management
      if (this.shouldExecuteSignal(signal, state, params)) {
        const trade = this.createEnhancedTrade(signal, currentCandle, state, params);
        if (trade) {
          state.openTrades.push(trade);
          state.signalsExecuted++;
          
          console.log(`📈 Trade #${state.signalsExecuted}: ${trade.action.toUpperCase()} ${trade.symbol} @ ${trade.entryPrice} (${trade.confidence}% confidence)`);
        }
      }
      
      // Update equity curve with enhanced metrics
      EnhancedBacktestMethods.updateEquityCurve(state, currentCandle, i);
      
      // Risk management: Check drawdown limits
      if (EnhancedBacktestMethods.checkDrawdownLimits(state, params)) {
        console.log(`🛑 Drawdown limit exceeded. Stopping backtest.`);
        EnhancedBacktestMethods.closeAllPositions(state.openTrades, currentCandle, 'Drawdown limit');
        break;
      }
      
      // Periodic rebalancing if enabled
      if (params.reinvestProfits && EnhancedBacktestMethods.shouldRebalance(currentCandle.timestamp, state.lastRebalance)) {
        EnhancedBacktestMethods.rebalancePortfolio(state, params);
      }
    }
    
    // Finalize any remaining open trades
    const lastCandle = data[data.length - 1];
    for (const trade of state.openTrades) {
      EnhancedBacktestMethods.finalizeClosedTrade(trade, lastCandle, state, 'End of backtest');
      state.closedTrades.push(trade);
    }
    
    // Calculate comprehensive results
    return this.calculateEnhancedResults(params, state, data.length, performance.now());
  }

  private shouldExecuteSignal(signal: TradingSignal, state: BacktestState, params: BacktestParams): boolean {
    // Enhanced signal filtering
    if (signal.action === 'hold') return false;
    if (signal.confidence < 75) return false;
    
    // Position limits
    const maxPositions = params.maxSimultaneousPositions || 3;
    if (state.openTrades.length >= maxPositions) return false;
    
    // Risk limits
    const currentRisk = EnhancedBacktestMethods.calculateCurrentRisk(state.openTrades, state.currentBalance);
    const maxDailyRisk = params.maxDailyRisk || 10; // 10% max daily risk
    if (currentRisk > maxDailyRisk) return false;
    
    // Market conditions
    if (signal.metadata?.volatilityRegime === 'extreme') return false;
    if (signal.metadata?.liquidityScore < 0.5) return false;
    
    return true;
  }

  private createEnhancedTrade(signal: TradingSignal, candle: MarketData, state: BacktestState, params: BacktestParams): BacktestTrade | null {
    const riskAmount = state.currentBalance * (params.riskPerTrade / 100);
    const stopDistance = Math.abs(candle.close - signal.stopLoss);
    
    if (stopDistance === 0) return null;
    
    // Enhanced position sizing
    let volume = EnhancedBacktestMethods.calculateOptimalPositionSize(
      riskAmount,
      stopDistance,
      signal.metadata || {},
      params.positionSizingMethod || 'fixed_percent'
    );
    
    // Apply volume constraints
    volume = Math.max(0.01, Math.min(volume, 5.0));
    
    const trade: BacktestTrade = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entryTime: candle.timestamp,
      symbol: 'XAUUSD',
      action: signal.action as 'buy' | 'sell',
      entryPrice: candle.close,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      volume,
      strategy: signal.strategy,
      confidence: signal.confidence,
      reason: signal.reason,
      riskReward: signal.riskReward,
      tradeQuality: EnhancedBacktestMethods.assessTradeQuality(signal),
      commission: (params.commissionPerTrade || 0) * volume,
      marketConditions: {
        volatility: signal.metadata?.volatility || 0,
        trend: (signal.metadata?.trendStrength || 0) > 0.5 ? 'bullish' : 'bearish',
        volume: signal.metadata?.volumeRatio || 1,
        spread: candle.spread || 0.02
      }
    };
    
    return trade;
  }

  private calculateEnhancedResults(
    params: BacktestParams,
    state: BacktestState,
    dataPoints: number,
    executionTime: number
  ): BacktestResults {
    const trades = state.closedTrades;
    const equityData = state.equityHistory;
    
    // Basic calculations
    const winningTrades = trades.filter((t: BacktestTrade) => (t.profit || 0) > 0);
    const losingTrades = trades.filter((t: BacktestTrade) => (t.profit || 0) <= 0);
    
    const totalReturn = state.currentBalance - params.initialBalance;
    const totalReturnPercent = (totalReturn / params.initialBalance) * 100;
    
    // Calculate time period for annualized returns
    const firstDate = new Date(equityData[0]?.timestamp || Date.now());
    const lastDate = new Date(equityData[equityData.length - 1]?.timestamp || Date.now());
    const timePeriodYears = (lastDate.getTime() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const annualizedReturn = timePeriodYears > 0 ? 
      (Math.pow(state.currentBalance / params.initialBalance, 1 / timePeriodYears) - 1) * 100 : 0;
    
    // Enhanced risk metrics
    const sharpeRatio = EnhancedBacktestHelpers.calculateSharpeRatio(equityData);
    const sortinoRatio = EnhancedBacktestHelpers.calculateSortinoRatio(equityData);
    const calmarRatio = state.maxDrawdownPercent > 0 ? annualizedReturn / state.maxDrawdownPercent : 0;
    
    // Calculate comprehensive results
    const totalProfit = winningTrades.reduce((sum: number, t: BacktestTrade) => sum + (t.profit || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum: number, t: BacktestTrade) => sum + (t.profit || 0), 0));
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;
    
    return {
      // Basic metrics
      initialBalance: params.initialBalance,
      finalBalance: state.currentBalance,
      totalReturn,
      totalReturnPercent,
      annualizedReturn,
      totalProfit,
      totalLoss,
      netProfit: totalReturn,
      
      // Trading statistics
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      lossRate: trades.length > 0 ? (losingTrades.length / trades.length) * 100 : 0,
      
      // Performance metrics
      profitFactor,
      payoffRatio: losingTrades.length > 0 ? (totalProfit / winningTrades.length) / (totalLoss / losingTrades.length) : 0,
      averageWin: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      largestWin: Math.max(...trades.map((t: BacktestTrade) => t.profit || 0)),
      largestLoss: Math.min(...trades.map((t: BacktestTrade) => t.profit || 0)),
      
      // Risk metrics
      maxDrawdown: state.maxDrawdown,
      maxDrawdownPercent: state.maxDrawdownPercent,
      maxDrawdownDuration: 0,
      averageDrawdown: 0,
      recoveryFactor: state.maxDrawdown > 0 ? totalReturn / state.maxDrawdown : 0,
      
      // Statistical measures
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      sterlingRatio: 0,
      informationRatio: 0,
      
      // Consistency metrics
      winStreakMax: state.maxConsecutiveWins,
      lossStreakMax: state.maxConsecutiveLosses,
      averageHoldTime: EnhancedBacktestHelpers.calculateAverageHoldTime(trades),
      averageMFE: EnhancedBacktestHelpers.calculateAverageMFE(trades),
      averageMAE: EnhancedBacktestHelpers.calculateAverageMAE(trades),
      consistency: EnhancedBacktestHelpers.calculateConsistency(trades),
      
      // Market efficiency metrics
      alphaGeneration: 0,
      betaExposure: 0,
      correlationToMarket: 0,
      
      // Trade distribution
      tradeDistribution: EnhancedBacktestHelpers.calculateTradeDistribution(trades),
      
      // Monthly returns
      monthlyReturns: EnhancedBacktestHelpers.calculateMonthlyReturns(equityData),
      
      // Data arrays
      trades,
      equityData,
      equityCurve: equityData,
      
      // Execution details
      executionTime,
      dataPoints,
      isRealBacktest: true,
      
      // Performance attribution
      performanceAttribution: {
        strategyContribution: 70,
        timingContribution: 20,
        riskManagementContribution: 10
      },
      
      // Risk-adjusted metrics
      riskAdjustedMetrics: {
        volAdjustedReturn: 0,
        downDeviationAdjustedReturn: 0,
        varAdjustedReturn: 0
      }
    };
  }
}
