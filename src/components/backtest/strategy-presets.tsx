'use client';

import { useState, useEffect } from 'react';
import { Save, Download, Trash2, Star, TrendingUp, Shield } from 'lucide-react';
import { StrategyPresetManager, StrategyPreset } from '@/lib/strategy-presets';

interface StrategyPresetsProps {
  onLoadPreset?: (preset: StrategyPreset) => void;
  currentStrategy?: string;
  currentParams?: any;
  lastBacktestResults?: any;
}

export function StrategyPresets({ 
  onLoadPreset, 
  currentStrategy, 
  currentParams, 
  lastBacktestResults 
}: StrategyPresetsProps) {
  const [presets, setPresets] = useState<StrategyPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    const loadedPresets = StrategyPresetManager.getPresets();
    setPresets(loadedPresets);
  };

  const handleSavePreset = () => {
    if (!presetName.trim() || !currentStrategy || !currentParams) return;

    const preset = StrategyPresetManager.createPresetFromBacktest(
      presetName.trim(),
      currentStrategy,
      currentParams,
      lastBacktestResults || {}
    );

    StrategyPresetManager.savePreset(preset);
    loadPresets();
    setShowSaveDialog(false);
    setPresetName('');
  };

  const handleDeletePreset = (id: string) => {
    StrategyPresetManager.deletePreset(id);
    loadPresets();
  };

  const isPropSuitable = (strategy: string) => {
    const nonPropStrategies = ['latency_arbitrage', 'hft_tick_scalping', 'martingale_grid'];
    return !nonPropStrategies.includes(strategy);
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Strategy Presets</h3>
          <p className="text-sm text-gray-400">Save and load optimized strategy parameters</p>
        </div>
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={!currentStrategy || !lastBacktestResults}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Current
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h4 className="text-white font-medium mb-3">Save Strategy Preset</h4>
          <div className="flex gap-3">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Presets List */}
      <div className="space-y-3">
        {presets.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No saved presets yet</p>
            <p className="text-sm">Run a backtest and save successful strategies</p>
          </div>
        ) : (
          presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-white font-medium">{preset.name}</h4>
                  {isPropSuitable(preset.strategy) ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      <Shield className="w-3 h-3" />
                      Prop Suitable
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      Live Only
                    </span>
                  )}
                  {preset.isOptimized && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                      Optimized
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="text-green-400 ml-1">{preset.performance.winRate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Profit Factor:</span>
                    <span className="text-blue-400 ml-1">{preset.performance.profitFactor.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Max DD:</span>
                    <span className="text-red-400 ml-1">{preset.performance.maxDrawdown.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Return:</span>
                    <span className={`ml-1 ${preset.performance.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {preset.performance.totalReturn.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Risk: {preset.parameters.riskPerTrade}% | {preset.parameters.propFirm} | 
                  Created: {new Date(preset.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onLoadPreset?.(preset)}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Load
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
