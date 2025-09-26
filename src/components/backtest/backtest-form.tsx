'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  Settings, 
  Shield
} from 'lucide-react';

interface BacktestFormProps {
  onRunBacktest?: (params: {
    strategy: 'vab_breakout' | 'mean_reversion' | 'dual_timeframe_trend';
    datasetId: string;
    initialBalance: number;
    propFirm: 'equity-edge' | 'fundednext';
    riskPerTrade: number;
  }) => void;
}

export function BacktestForm({ onRunBacktest }: BacktestFormProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [formData, setFormData] = useState({
    strategy: 'vab_breakout' as 'vab_breakout' | 'mean_reversion' | 'dual_timeframe_trend',
    datasetId: '', // Selected dataset - always string, never undefined
    htfTimeframe: '1h' as '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d', // Higher timeframe for dual timeframe strategy
    initialBalance: 10000,
    propFirm: 'equity-edge' as 'equity-edge' | 'fundednext',
    riskPerTrade: 1.0, // 1% risk per trade for prop firms
    maxPositions: 3, // Default max positions
  });

  const [datasets, setDatasets] = useState<Array<{id: string, name: string}>>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);

  // Load available datasets
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const response = await fetch('/api/datasets');
        const data = await response.json();
        if (data.success && data.datasets) {
          setDatasets(data.datasets);
          // Auto-select first dataset
          if (data.datasets.length > 0) {
            setFormData(prev => ({ 
              ...prev, 
              datasetId: prev.datasetId || data.datasets[0].id 
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load datasets:', error);
      } finally {
        setLoadingDatasets(false);
      }
    };
    loadDatasets();
  }, []); // Empty dependency array is correct here

  // REAL GOLD STRATEGIES - Win rates calculated from actual backtests
  const strategies = [
    { 
      id: 'vab_breakout', 
      name: 'VAB Breakout', 
      description: 'Volatility-Adjusted Breakout - Session range breakouts with ATR filtering',
      riskReward: '1:2',
      note: 'Win rate determined by backtest results'
    },
    { 
      id: 'mean_reversion', 
      name: 'Mean Reversion', 
      description: 'Bollinger Bands + RSI extreme conditions with volatility filter',
      riskReward: '1:1.5',
      note: 'Win rate determined by backtest results'
    },
    { 
      id: 'dual_timeframe_trend', 
      name: 'Dual-Timeframe Trend', 
      description: 'H4 trend + M15 pullback entries with time-based exits',
      riskReward: '1:2',
      note: 'Win rate determined by backtest results'
    },
  ];

  // Removed unused symbols and timeframes arrays since we're using datasets now
  const htfTimeframes = [
    { value: '15m', label: '15 Minutes' },
    { value: '30m', label: '30 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' }
  ];
  
  const propFirms = [
    { value: 'equity-edge', label: 'Equity Edge (4% daily, 6% max)' },
    { value: 'fundednext', label: 'FundedNext (3% daily, 6% max)' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    
    // Trigger the backtest with current form data
    if (onRunBacktest) {
      onRunBacktest({
        strategy: formData.strategy,
        datasetId: formData.datasetId,
        initialBalance: formData.initialBalance,
        propFirm: formData.propFirm,
        riskPerTrade: formData.riskPerTrade,
      });
    }
    
    // Reset running state after a short delay
    setTimeout(() => {
      setIsRunning(false);
    }, 500);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Dataset validation - ensure a dataset is selected
  const isFormValid = formData.datasetId && !loadingDatasets;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">Backtest Configuration</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Strategy Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Trading Strategy
          </label>
          <select
            value={formData.strategy || 'vab_breakout'}
            onChange={(e) => handleInputChange('strategy', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
          >
            {strategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
          <div className="mt-2 text-xs space-y-1">
            <p className="text-gray-400">
              {strategies.find(s => s.id === formData.strategy)?.description}
            </p>
            <div className="flex space-x-4">
              <span className="text-yellow-400">
                {strategies.find(s => s.id === formData.strategy)?.note}
              </span>
              <span className="text-blue-400">
                Risk:Reward: {strategies.find(s => s.id === formData.strategy)?.riskReward}
              </span>
            </div>
          </div>
        </div>

        {/* Dataset Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📁 Historical Dataset
          </label>
          {loadingDatasets ? (
            <div className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-400">
              Loading datasets...
            </div>
          ) : (
            <select
              value={formData.datasetId || ''}
              onChange={(e) => handleInputChange('datasetId', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            >
              <option value="">Select a dataset...</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-green-400 mt-1">
            📊 Using local datasets - UNLIMITED & completely FREE
          </p>
          <p className="text-xs text-blue-400 mt-1">
            ✨ Real XAUUSD minute-by-minute data with no API limitations
          </p>
        </div>

        {/* HTF Timeframe - visible only for Dual-Timeframe strategy */}
        {formData.strategy === 'dual_timeframe_trend' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Higher Timeframe (HTF)
            </label>
            <select
              value={formData.htfTimeframe || '1h'}
              onChange={(e) => handleInputChange('htfTimeframe', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            >
              {htfTimeframes.map((tf) => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">HTF determines overall trend direction; entries use the lower timeframe.</p>
          </div>
        )}

        {/* Prop Firm Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Prop Firm
          </label>
          <select
            value={formData.propFirm || 'equity-edge'}
            onChange={(e) => handleInputChange('propFirm', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
          >
            {propFirms.map((firm) => (
              <option key={firm.value} value={firm.value}>
                {firm.label}
              </option>
            ))}
          </select>
        </div>


        {/* Risk Management */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-300 flex items-center">
            <Shield className="w-4 h-4 mr-1" />
            Risk Management
          </h4>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Initial Balance ($)
            </label>
            <input
              type="number"
              value={formData.initialBalance || 10000}
              onChange={(e) => handleInputChange('initialBalance', Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Risk Per Trade (%)
            </label>
            <input
              type="number"
              min="0.1"
              max="5"
              step="0.1"
              value={formData.riskPerTrade || 1.0}
              onChange={(e) => handleInputChange('riskPerTrade', Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended: 1% for prop firms
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Max Open Positions
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.maxPositions || 3}
              onChange={(e) => handleInputChange('maxPositions', Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        {/* Run Button */}
        <button
          type="submit"
          disabled={isRunning || !isFormValid}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg text-white font-medium hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Running Backtest...</span>
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
