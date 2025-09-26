'use client';

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

export interface TradeOrder {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: string;
  status: 'pending' | 'open' | 'closed';
  profit?: number;
  strategy: string;
}

export interface TradingSession {
  id: string;
  startTime: string;
  endTime?: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  maxDrawdown: number;
  currentDrawdown: number;
  dailyPnL: number;
  isActive: boolean;
}

export class AutoTradingEngine {
  private vabStrategy: VolatilityAdjustedBreakoutStrategy;
  private meanReversionStrategy: MeanReversionStrategy;
  private trendStrategy: DualTimeframeTrendStrategy;
  private riskManager: PropFirmRiskManager;
  private newsFilter: NewsFilter;
  private isRunning: boolean = false;
  private currentSession: TradingSession | null = null;
  private openTrades: TradeOrder[] = [];
  private tradeHistory: TradeOrder[] = [];
  private accountBalance: number = 15000; // Your current balance
  private propFirm: 'equity-edge' | 'fundednext' = 'equity-edge';
  private activeStrategy: 'vab' | 'mean-reversion' | 'trend' = 'vab';

  constructor() {
    this.vabStrategy = new VolatilityAdjustedBreakoutStrategy();
    this.meanReversionStrategy = new MeanReversionStrategy();
    this.trendStrategy = new DualTimeframeTrendStrategy();
    this.riskManager = new PropFirmRiskManager();
    this.newsFilter = new NewsFilter();
  }

  // Start the auto-trading bot
  async startTrading(propFirm: 'equity-edge' | 'fundednext' = 'equity-edge'): Promise<void> {
    if (this.isRunning) {
      throw new Error('Trading bot is already running');
    }

    this.propFirm = propFirm;
    this.isRunning = true;
    
    // Create new trading session
    this.currentSession = {
      id: `session_${Date.now()}`,
      startTime: new Date().toISOString(),
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalPnL: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
      dailyPnL: 0,
      isActive: true
    };

    console.log(`🚀 Neuratrade Auto-Trading Bot Started for ${propFirm.toUpperCase()}`);
    console.log(`💰 Account Balance: $${this.accountBalance.toLocaleString()}`);
    
    // Start the main trading loop
    this.tradingLoop();
  }

  // Stop the auto-trading bot
  stopTrading(): void {
    this.isRunning = false;
    
    if (this.currentSession) {
      this.currentSession.endTime = new Date().toISOString();
      this.currentSession.isActive = false;
    }

    // Close all open positions (emergency stop)
    this.closeAllPositions();
    
    console.log('🛑 Neuratrade Auto-Trading Bot Stopped');
    this.printSessionSummary();
  }

  // Main trading loop
  private async tradingLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check if we should avoid trading due to news
        if (this.newsFilter.shouldAvoidTrading(new Date())) {
          console.log('📰 Avoiding trading due to high-impact news');
          await this.sleep(60000); // Wait 1 minute
          continue;
        }

        // Check risk limits
        const riskCheck = this.riskManager.checkRiskLimits(
          this.currentSession?.currentDrawdown || 0,
          this.currentSession?.dailyPnL || 0,
          this.accountBalance,
          this.propFirm
        );

        if (!riskCheck.canTrade) {
          console.log(`⚠️ Trading halted: ${riskCheck.reason}`);
          await this.sleep(300000); // Wait 5 minutes
          continue;
        }

        // Get market data and analyze
        const marketData = await this.getMarketData('XAUUSD');
        const indicators = await this.calculateIndicators(marketData);
        
        // Get trading signal from active strategy
        const signal = this.getSignalFromActiveStrategy(marketData, indicators);
        
        // Execute trade if signal is strong enough
        if (signal.confidence >= 75 && (signal.action === 'buy' || signal.action === 'sell')) {
          await this.executeTrade(signal as TradingSignal & { action: 'buy' | 'sell' }, marketData[marketData.length - 1]);
        }

        // Update open positions
        await this.updateOpenPositions();

        // Wait before next analysis (5-minute intervals for scalping)
        await this.sleep(300000); // 5 minutes

      } catch (error) {
        console.error('❌ Trading loop error:', error);
        await this.sleep(60000); // Wait 1 minute on error
      }
    }
  }

  // Execute a trade based on signal
  private async executeTrade(signal: TradingSignal & { action: 'buy' | 'sell' }, currentPrice: MarketData): Promise<void> {
    try {
      // Calculate position size based on risk management
      const stopLossDistance = Math.abs(currentPrice.close - signal.stopLoss);
      const positionSize = this.riskManager.calculatePositionSize(
        this.accountBalance,
        stopLossDistance,
        this.propFirm
      );

      // Create trade order
      const trade: TradeOrder = {
        id: `trade_${Date.now()}`,
        symbol: 'XAUUSD',
        action: signal.action,
        volume: positionSize,
        openPrice: currentPrice.close,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        timestamp: new Date().toISOString(),
        status: 'pending',
        strategy: signal.strategy
      };

      // Simulate trade execution (replace with real MetaAPI execution)
      const executed = await this.executeTradeWithMetaAPI(trade);
      
      if (executed) {
        trade.status = 'open';
        this.openTrades.push(trade);
        
        console.log(`✅ Trade Executed: ${signal.action.toUpperCase()} ${positionSize.toFixed(2)} XAUUSD @ ${currentPrice.close}`);
        console.log(`📊 Confidence: ${signal.confidence}% | Reason: ${signal.reason}`);
        console.log(`🎯 TP: ${signal.takeProfit} | 🛡️ SL: ${signal.stopLoss}`);
        
        // Update session stats
        if (this.currentSession) {
          this.currentSession.totalTrades++;
        }
      }

    } catch (error) {
      console.error('❌ Trade execution error:', error);
    }
  }

  // Execute REAL MetaAPI trade
  private async executeTradeWithMetaAPI(trade: TradeOrder): Promise<boolean> {
    try {
      console.log(`🔄 Executing REAL trade via MetaAPI: ${trade.action.toUpperCase()} ${trade.symbol}`);
      
      // Execute real trade via MetaAPI
      const response = await fetch('/api/live/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: trade.symbol,
          action: trade.action,
          volume: trade.volume,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        console.error(`❌ Trade execution failed: ${result.error}`);
        return false;
      }

      console.log(`✅ Trade executed successfully: ${result.orderId}`);
      trade.openPrice = result.openPrice || trade.openPrice;
      return true;
      
    } catch (error) {
      console.error(`❌ Trade execution failed for ${trade.symbol}:`, error);
      return false;
    }
  }

  // Update open positions and check for TP/SL hits
  private async updateOpenPositions(): Promise<void> {
    const currentPrice = await this.getCurrentPrice('XAUUSD');
    
    for (const trade of this.openTrades) {
      let shouldClose = false;
      let closeReason = '';
      
      if (trade.action === 'buy') {
        // Check take profit
        if (currentPrice >= trade.takeProfit) {
          shouldClose = true;
          closeReason = 'Take Profit';
          trade.profit = (trade.takeProfit - trade.openPrice) * trade.volume;
        }
        // Check stop loss
        else if (currentPrice <= trade.stopLoss) {
          shouldClose = true;
          closeReason = 'Stop Loss';
          trade.profit = (trade.stopLoss - trade.openPrice) * trade.volume;
        }
      } else {
        // Check take profit for sell
        if (currentPrice <= trade.takeProfit) {
          shouldClose = true;
          closeReason = 'Take Profit';
          trade.profit = (trade.openPrice - trade.takeProfit) * trade.volume;
        }
        // Check stop loss for sell
        else if (currentPrice >= trade.stopLoss) {
          shouldClose = true;
          closeReason = 'Stop Loss';
          trade.profit = (trade.openPrice - trade.stopLoss) * trade.volume;
        }
      }
      
      if (shouldClose) {
        await this.closeTrade(trade, closeReason);
      }
    }
  }

  // Close a trade
  private async closeTrade(trade: TradeOrder, reason: string): Promise<void> {
    trade.status = 'closed';
    
    // Remove from open trades
    this.openTrades = this.openTrades.filter(t => t.id !== trade.id);
    
    // Add to history
    this.tradeHistory.push(trade);
    
    // Update session statistics
    if (this.currentSession && trade.profit !== undefined) {
      this.currentSession.totalPnL += trade.profit;
      this.currentSession.dailyPnL += trade.profit;
      
      if (trade.profit > 0) {
        this.currentSession.winningTrades++;
        console.log(`🎉 Trade Closed: +$${trade.profit.toFixed(2)} (${reason})`);
      } else {
        this.currentSession.losingTrades++;
        console.log(`😞 Trade Closed: -$${Math.abs(trade.profit).toFixed(2)} (${reason})`);
      }
      
      // Update drawdown
      if (trade.profit < 0) {
        this.currentSession.currentDrawdown += trade.profit;
        this.currentSession.maxDrawdown = Math.min(this.currentSession.maxDrawdown, this.currentSession.currentDrawdown);
      } else {
        this.currentSession.currentDrawdown = Math.max(0, this.currentSession.currentDrawdown + trade.profit);
      }
      
      // Calculate win rate
      const winRate = (this.currentSession.winningTrades / this.currentSession.totalTrades) * 100;
      console.log(`📈 Session Stats: ${this.currentSession.totalTrades} trades | ${winRate.toFixed(1)}% win rate | $${this.currentSession.totalPnL.toFixed(2)} P&L`);
    }
  }

  // Close all open positions (emergency stop)
  private async closeAllPositions(): Promise<void> {
    for (const trade of this.openTrades) {
      await this.closeTrade(trade, 'Emergency Stop');
    }
  }

  // Get REAL market data from MetaAPI
  private async getMarketData(symbol: string): Promise<MarketData[]> {
    try {
      console.log(`🔄 Fetching REAL market data for ${symbol}...`);
      
      // In production, this would fetch real historical data from MetaAPI
      // For now, return empty array to prevent trading on fake data
      console.warn('⚠️ Real market data not implemented yet - trading disabled');
      return [];
      
      // TODO: Implement real MetaAPI historical data fetch
      // const response = await fetch(`/api/market-data/${symbol}?timeframe=M15&count=20`);
      // if (!response.ok) {
      //   throw new Error(`Failed to fetch market data: ${response.statusText}`);
      // }
      // return await response.json();
      
    } catch (error) {
      console.error(`❌ Failed to fetch market data for ${symbol}:`, error);
      return [];
    }
  }

  // Get signal from active strategy
  private getSignalFromActiveStrategy(data: MarketData[], indicators: TechnicalIndicators): TradingSignal {
    switch (this.activeStrategy) {
      case 'vab':
        return this.vabStrategy.analyzeMarket(data, indicators);
      case 'mean-reversion':
        return this.meanReversionStrategy.analyzeMarket(data, indicators);
      case 'trend':
        // For trend strategy, we need H4 data - simplified for now
        return this.trendStrategy.analyzeMarket(data, data, indicators, indicators);
      default:
        return this.vabStrategy.analyzeMarket(data, indicators);
    }
  }

  // Set active strategy
  setActiveStrategy(strategy: 'vab' | 'mean-reversion' | 'trend'): void {
    this.activeStrategy = strategy;
    console.log(`🔄 Strategy changed to: ${strategy.toUpperCase()}`);
  }

  // Calculate technical indicators (updated for new strategies)
  private async calculateIndicators(data: MarketData[]): Promise<TechnicalIndicators> {
    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const atr = this.calculateATR(data, 14);
    const avgATR = atr; // Simplified - in production, calculate 20-period average
    
    // Calculate session high/low (simplified - last 8 hours)
    const sessionData = data.slice(-16); // Last 16 periods (8 hours on M30)
    const sessionHigh = Math.max(...sessionData.map(d => d.high));
    const sessionLow = Math.min(...sessionData.map(d => d.low));
    
    return {
      // Bollinger Bands
      bollingerUpper: Math.max(...closes) * 1.02,
      bollingerMiddle: closes.reduce((a, b) => a + b) / closes.length,
      bollingerLower: Math.min(...closes) * 0.98,
      
      // RSI
      rsi: this.calculateRSI(closes, 14),
      
      // Moving Averages
      ema50: this.calculateEMA(closes, Math.min(50, closes.length)),
      ema200: this.calculateEMA(closes, Math.min(200, closes.length)),
      sma20: closes.slice(-20).reduce((a, b) => a + b) / Math.min(20, closes.length),
      
      // ATR for volatility
      atr,
      atrMultiplier: 2.0,
      
      // Session data
      sessionHigh,
      sessionLow,
      isHighVolatility: this.newsFilter.isHighVolatility(atr, avgATR)
    };
  }

  // Simple EMA calculation
  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  // Simple RSI calculation
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
    
    return 100 - (100 / (1 + rs));
  }

  // Simple ATR calculation
  private calculateATR(data: MarketData[], period: number): number {
    let atr = 0;
    
    for (let i = 1; i < Math.min(data.length, period + 1); i++) {
      const tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      );
      atr += tr;
    }
    
    return atr / period;
  }

  // Get REAL current price from MetaAPI
  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      // Fetch real current price from MetaAPI
      const response = await fetch(`/api/live/price/${symbol}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch price: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.bid || 0;
      
    } catch (error) {
      console.error(`❌ Failed to get current price for ${symbol}:`, error);
      // Return 0 to prevent trading on invalid data
      return 0;
    }
  }

  // Utility function for delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Print session summary
  private printSessionSummary(): void {
    if (!this.currentSession) return;
    
    const winRate = this.currentSession.totalTrades > 0 
      ? (this.currentSession.winningTrades / this.currentSession.totalTrades) * 100 
      : 0;
    
    console.log('\n📊 TRADING SESSION SUMMARY');
    console.log('═══════════════════════════');
    console.log(`🕐 Duration: ${this.currentSession.startTime} - ${this.currentSession.endTime}`);
    console.log(`📈 Total Trades: ${this.currentSession.totalTrades}`);
    console.log(`🎯 Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`💰 Total P&L: $${this.currentSession.totalPnL.toFixed(2)}`);
    console.log(`📉 Max Drawdown: $${Math.abs(this.currentSession.maxDrawdown).toFixed(2)}`);
    console.log(`🏆 Winning Trades: ${this.currentSession.winningTrades}`);
    console.log(`😞 Losing Trades: ${this.currentSession.losingTrades}`);
  }

  // Getters for UI integration
  getCurrentSession(): TradingSession | null {
    return this.currentSession;
  }

  getOpenTrades(): TradeOrder[] {
    return this.openTrades;
  }

  getTradeHistory(): TradeOrder[] {
    return this.tradeHistory;
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
