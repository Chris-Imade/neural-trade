import { create } from 'zustand';
import { TradingStatistics } from '@/lib/trading-statistics';
import { BacktestResults } from '@/lib/backtesting-engine';

interface TradingState {
  isBotRunning: boolean;
  liveMetrics: TradingStatistics | null;
  backtestResults: BacktestResults | null;
  actions: {
    toggleBotStatus: () => void;
    fetchLiveMetrics: () => Promise<void>;
    runBacktest: (strategy: string, symbol: string, from: string, to: string) => Promise<void>;
    executeTrade: (symbol: string, action: 'buy' | 'sell', volume: number) => Promise<any>;
  };
}

const useTradingStore = create<TradingState>((set, get) => ({
  isBotRunning: false,
  liveMetrics: null,
  backtestResults: null,
  actions: {
    toggleBotStatus: () => set((state) => ({ isBotRunning: !state.isBotRunning })),

    fetchLiveMetrics: async () => {
      try {
        console.log('🔄 Fetching live metrics from API...');
        const response = await fetch('/api/live/metrics');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data: TradingStatistics = await response.json();
        
        // Check if the response contains an error
        if (data.error) {
          console.error('❌ API returned error:', data.error);
          // Set the data anyway to show the error state in UI
          set({ liveMetrics: data });
        } else {
          console.log('✅ Live metrics fetched successfully:', {
            totalTrades: data.totalTrades,
            winRate: data.winRate,
            balance: data.balance,
            connectionStatus: data.connectionStatus
          });
          set({ liveMetrics: data });
        }
      } catch (error) {
        console.error('❌ Error fetching live metrics:', error);
        
        // Set error state in the store
        set({ 
          liveMetrics: {
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            isConnected: false,
            connectionStatus: 'error',
            accountId: '',
            accountName: '',
            broker: '',
            balance: 0,
            equity: 0,
            initialBalance: 0,
            margin: 0,
            freeMargin: 0,
            marginLevel: 0,
            totalTrades: 0,
            openTrades: 0,
            closedTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            totalProfit: 0,
            totalLoss: 0,
            netProfit: 0,
            averageWin: 0,
            averageLoss: 0,
            largestWin: 0,
            largestLoss: 0,
            profitFactor: 0,
            bestHour: '',
            bestDay: '',
            averageTradeDuration: 0,
            maxDrawdown: 0,
            currentDrawdown: 0,
            dailyPnL: 0,
            weeklyPnL: 0,
            monthlyPnL: 0,
            volatility: 0,
            sharpeRatio: 0,
            lastUpdate: new Date().toISOString()
          } as TradingStatistics
        });
      }
    },

    runBacktest: async (strategy: string, symbol: string, from: string, to: string) => {
      try {
        const response = await fetch(`/api/backtest/run?strategy=${strategy}&symbol=${symbol}&from=${from}&to=${to}`);
        if (!response.ok) {
          throw new Error('Failed to run backtest');
        }
        const data = await response.json();
        set({ backtestResults: data });
      } catch (error) {
        console.error('Error running backtest:', error);
      }
    },

    executeTrade: async (symbol: string, action: 'buy' | 'sell', volume: number) => {
      try {
        const response = await fetch('/api/live/trade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symbol, action, volume }),
        });
        if (!response.ok) {
          throw new Error('Trade execution failed');
        }
        const data = await response.json();
        // Optionally, you can refresh live metrics after a trade
        get().actions.fetchLiveMetrics();
        return data;
      } catch (error) {
        console.error('Error executing trade:', error);
        throw error;
      }
    },
  },
}));

export default useTradingStore;
