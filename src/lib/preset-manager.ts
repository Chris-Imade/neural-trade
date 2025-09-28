/**
 * Preset Manager - Saves and loads backtest presets for Bot Trading
 */

export interface TradingPreset {
  id: string;
  name: string;
  strategy: 'aggressive_scalper' | 'quantum_scalper';
  datasetId: string;
  initialBalance: number;
  riskPerTrade: number;
  winRate?: number;
  profitFactor?: number;
  totalReturn?: number;
  createdAt: Date;
  lastUsed?: Date;
}

export class PresetManager {
  private readonly STORAGE_KEY = 'trading_presets';

  /**
   * Save a preset to local storage (or database in production)
   */
  savePreset(preset: Omit<TradingPreset, 'id' | 'createdAt'>): TradingPreset {
    const presets = this.loadPresets();
    const newPreset: TradingPreset = {
      ...preset,
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    
    presets.push(newPreset);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
    }
    
    return newPreset;
  }

  /**
   * Load all presets
   */
  loadPresets(): TradingPreset[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const presets = JSON.parse(stored);
      return presets.map((p: TradingPreset) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        lastUsed: p.lastUsed ? new Date(p.lastUsed) : undefined
      }));
    } catch {
      return [];
    }
  }

  /**
   * Update preset with backtest results
   */
  updatePresetResults(
    presetId: string,
    results: { winRate: number; profitFactor: number; totalReturn: number }
  ): void {
    const presets = this.loadPresets();
    const index = presets.findIndex(p => p.id === presetId);
    
    if (index >= 0) {
      presets[index] = {
        ...presets[index],
        ...results,
        lastUsed: new Date()
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
      }
    }
  }

  /**
   * Delete a preset
   */
  deletePreset(presetId: string): void {
    const presets = this.loadPresets();
    const filtered = presets.filter(p => p.id !== presetId);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    }
  }

  /**
   * Get preset by ID
   */
  getPreset(presetId: string): TradingPreset | null {
    const presets = this.loadPresets();
    return presets.find(p => p.id === presetId) || null;
  }

  /**
   * Get best performing presets
   */
  getBestPresets(): TradingPreset[] {
    return this.loadPresets()
      .filter(p => p.winRate && p.profitFactor)
      .sort((a, b) => (b.profitFactor || 0) - (a.profitFactor || 0))
      .slice(0, 5);
  }
}
