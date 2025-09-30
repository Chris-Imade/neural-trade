'use client';

import { useState, useEffect } from 'react';
import { Play, Settings } from 'lucide-react';
import { PresetManager } from '@/lib/strategy-presets';

interface BacktestFormProps {
  onRunBacktest?: (params: {
    strategy: 'aggressive_scalper' | 'quantum_scalper';
    datasetId: string;
    initialBalance: number;
    riskPerTrade: number;
    maxDrawdownPercent?: number;
  }) => Promise<void>;
}

export function BacktestForm({ onRunBacktest }: BacktestFormProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [datasets, setDatasets] = useState<Array<{id: string; name: string; description?: string}>>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  
  const [formData, setFormData] = useState({
    strategy: 'aggressive_scalper' as 'aggressive_scalper' | 'quantum_scalper',
    datasetId: '',
    initialBalance: 10000,
    riskPerTrade: 1,
    maxDrawdownPercent: 20  // Default 20% fail-safe
  });

  const strategies = [
    { 
      id: 'aggressive_scalper', 
      name: '🔥 AGGRESSIVE SCALPER', 
      description: 'High frequency momentum scalping',
      riskReward: '1:2',
      winRate: '38% win rate with positive expectancy',
      note: '⚡ 80,000+ trades per dataset - REAL RESULTS!'
    },
    { 
      id: 'quantum_scalper', 
      name: '⚡ QUANTUM SCALPER AI', 
      description: 'AI hyper-speed trading',
      riskReward: '1:1.5',
      winRate: '85%+ TARGET (AI-optimized)',
      note: 'BEYOND HUMAN CAPABILITY - 50+ trades/session'
    }
  ];

  // Load datasets on mount
  useEffect(() => {
    async function loadDatasets() {
      try {
        const response = await fetch('/api/datasets');
        const data = await response.json();
        if (data.datasets) {
          setDatasets(data.datasets);
        }
      } catch (error) {
        console.error('Failed to load datasets:', error);
      } finally {
        setLoadingDatasets(false);
      }
    }
    loadDatasets();
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!formData.datasetId) {
      alert('Please select a dataset');
      return;
    }
    
    setIsRunning(true);
    
    try {
      // Call the backtest API
      if (onRunBacktest) {
        await onRunBacktest(formData);
        
        // Note: Preset saving is handled in the StrategyPresets component
        // after backtest results are available
      }
    } finally {
      setTimeout(() => setIsRunning(false), 500);
    }
  };

  const isFormValid = formData.datasetId && 
                     formData.initialBalance >= 1000 && 
                     formData.riskPerTrade > 0 && 
                     !loadingDatasets;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">Backtest Configuration</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Strategy Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Strategy</label>
          <select
            value={formData.strategy}
            onChange={(e) => handleInputChange('strategy', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            {strategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
            ))}
          </select>
        </div>

        {/* Strategy Info */}
        {formData.strategy && (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-sm font-semibold text-green-400 mb-2">
              {strategies.find(s => s.id === formData.strategy)?.name}
            </h4>
            <p className="text-xs text-gray-400 mb-2">
              {strategies.find(s => s.id === formData.strategy)?.description}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Risk/Reward: </span>
                <span className="text-white">{strategies.find(s => s.id === formData.strategy)?.riskReward}</span>
              </div>
              <div>
                <span className="text-gray-500">Win Rate: </span>
                <span className="text-green-400">{strategies.find(s => s.id === formData.strategy)?.winRate}</span>
              </div>
            </div>
            <p className="text-xs text-yellow-400 mt-2">
              {strategies.find(s => s.id === formData.strategy)?.note}
            </p>
          </div>
        )}

        {/* Dataset Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Historical Dataset</label>
          {loadingDatasets ? (
            <div className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400">
              Loading datasets...
            </div>
          ) : (
            <select
              value={formData.datasetId}
              onChange={(e) => handleInputChange('datasetId', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="">Select a dataset</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name} {dataset.description && `- ${dataset.description}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Risk Management */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Initial Balance ($)</label>
            <input
              type="number"
              value={formData.initialBalance}
              onChange={(e) => handleInputChange('initialBalance', Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              min="1000" max="1000000"
            />
          </div>
          
          {/* Risk Per Trade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Risk Per Trade (%)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={formData.riskPerTrade}
                onChange={(e) => handleInputChange('riskPerTrade', parseFloat(e.target.value))}
                className="flex-1 accent-green-500"
              />
              <div className="bg-gray-800/50 px-3 py-1 rounded-md border border-gray-700 min-w-[80px] text-center">
                <span className="text-green-400 font-mono">{formData.riskPerTrade.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Conservative (0.1%)</span>
              <span>Moderate (1-2%)</span>
              <span>Aggressive (5%)</span>
            </div>
          </div>
        </div>

        {/* Max Drawdown Fail-Safe */}
        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-200 mb-2">
            <div className="flex items-center space-x-2">
              <span>Max Drawdown %</span>
              <span className="text-xs text-red-400">(Fail-Safe Stop)</span>
            </div>
            <span className="text-xs text-gray-400">Optional</span>
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={formData.maxDrawdownPercent || 20}
                onChange={(e) => handleInputChange('maxDrawdownPercent', parseFloat(e.target.value))}
                className="flex-1 accent-red-500"
              />
              <div className="bg-gray-800/50 px-3 py-1 rounded-md border border-gray-700 min-w-[80px] text-center">
                <span className="text-red-400 font-mono">{(formData.maxDrawdownPercent || 20).toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Tight (5-10%)</span>
              <span>Normal (15-20%)</span>
              <span>Loose (30-50%)</span>
            </div>
            <div className="bg-red-900/20 border border-red-800/30 rounded p-2 mt-2">
              <p className="text-xs text-red-400">
                ⚠️ Backtest will stop if drawdown exceeds {formData.maxDrawdownPercent || 20}% to protect capital
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isRunning || !isFormValid}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Backtest</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
