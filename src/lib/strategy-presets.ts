interface StrategyParameters {
  riskPerTrade: number;
  propFirm: string;
  maxPositions: number;
  timeframe: string;
  datasetId?: string;  // Added for backtest preset compatibility
  initialBalance?: number;  // Added for backtest preset compatibility
  // Strategy-specific parameters
  sessionStart?: number;
  sessionEnd?: number;
  emaFast?: number;
  emaSlow?: number;
  atrMultiplier?: number;
  rsiPeriod?: number;
  rsiOverbought?: number;
  rsiOversold?: number;
  lookbackPeriod?: number;
}

interface BacktestResults {
  winRate: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  totalReturnPercent: number;
}

export interface StrategyPreset {
  id: string;
  name: string;
  strategy: string;
  parameters: StrategyParameters;
  performance: {
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    totalReturn: number;
  };
  createdAt: string;
  isOptimized: boolean;
}

export class StrategyPresetManager {
  private static STORAGE_KEY = 'neuraltrade_strategy_presets';

  static getPresets(): StrategyPreset[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) as StrategyPreset[] : this.getDefaultPresets();
    } catch {
      return this.getDefaultPresets();
    }
  }

  static savePreset(preset: StrategyPreset): void {
    if (typeof window === 'undefined') return;
    
    const presets = this.getPresets();
    const existingIndex = presets.findIndex(p => p.id === preset.id);
    
    if (existingIndex >= 0) {
      presets[existingIndex] = preset;
    } else {
      presets.push(preset);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
  }

  static deletePreset(id: string): void {
    if (typeof window === 'undefined') return;
    
    const presets = this.getPresets().filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
  }

  static getDefaultPresets(): StrategyPreset[] {
    return [
      {
        id: 'london_breakout_conservative',
        name: 'London Breakout - Conservative',
        strategy: 'london_breakout',
        parameters: {
          riskPerTrade: 0.5,
          propFirm: 'equity-edge',
          maxPositions: 2,
          timeframe: '15m',
          sessionStart: 7,
          sessionEnd: 10,
          emaFast: 20,
          emaSlow: 50,
          atrMultiplier: 1.2
        },
        performance: {
          winRate: 72,
          profitFactor: 1.8,
          maxDrawdown: 3.2,
          totalReturn: 15.6
        },
        createdAt: new Date().toISOString(),
        isOptimized: true
      },
      {
        id: 'support_resistance_aggressive',
        name: 'Support/Resistance - Aggressive',
        strategy: 'support_resistance_bounce',
        parameters: {
          riskPerTrade: 1.0,
          propFirm: 'fundednext',
          maxPositions: 3,
          timeframe: '5m',
          rsiPeriod: 14,
          rsiOverbought: 70,
          rsiOversold: 30,
          lookbackPeriod: 50
        },
        performance: {
          winRate: 68,
          profitFactor: 2.1,
          maxDrawdown: 4.8,
          totalReturn: 22.3
        },
        createdAt: new Date().toISOString(),
        isOptimized: true
      }
    ];
  }

  static createPresetFromBacktest(
    name: string,
    strategy: string,
    parameters: StrategyParameters,
    results: BacktestResults
  ): StrategyPreset {
    return {
      id: `${strategy}_${Date.now()}`,
      name,
      strategy,
      parameters,
      performance: {
        winRate: results.winRate || 0,
        profitFactor: results.profitFactor || 0,
        maxDrawdown: results.maxDrawdownPercent || 0,
        totalReturn: results.totalReturnPercent || 0
      },
      createdAt: new Date().toISOString(),
      isOptimized: false
    };
  }
}

export { StrategyPresetManager as PresetManager };
