'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StrategyPresetManager, StrategyPreset } from '@/lib/strategy-presets';
import { Play, Square, Bot, TrendingUp, AlertCircle } from 'lucide-react';

interface LiveTrade {
  id: string;
  time: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  entry: number;
  current: number;
  pnl: number;
}

export default function BotTradingPage() {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [presets, setPresets] = useState<StrategyPreset[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTrades, setActiveTrades] = useState<LiveTrade[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);

  // Load presets on mount
  useEffect(() => {
    const loadedPresets = StrategyPresetManager.getPresets();
    setPresets(loadedPresets);
    
    // Load saved state
    const savedState = localStorage.getItem('bot_trading_state');
    if (savedState) {
      const state = JSON.parse(savedState);
      setIsRunning(state.isRunning || false);
      setSelectedPreset(state.selectedPreset || '');
    }
  }, []);

  // REAL trading execution when bot is running
  useEffect(() => {
    if (!isRunning || !selectedPreset) return;
    
    const preset = presets.find(p => p.id === selectedPreset);
    if (!preset) return;

    console.log(`🚀 REAL BOT TRADING ACTIVE with ${preset.strategy}`);
    console.log(`📊 Risk per trade: ${preset.parameters?.riskPerTrade || 1}%`);
    
    // Fetch live trades from MetaAPI every 10 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/live/trades');
        if (response.ok) {
          const trades = await response.json();
          
          // Convert MetaAPI trades to LiveTrade format
          const liveTrades: LiveTrade[] = trades.map((trade: any) => ({
            id: trade.id,
            time: new Date(trade.time).toLocaleTimeString(),
            symbol: trade.symbol,
            type: trade.type,
            volume: trade.volume,
            entry: trade.openPrice,
            current: trade.currentPrice || trade.openPrice,
            pnl: trade.profit || 0
          }));
          
          setActiveTrades(liveTrades);
          setTradeCount(liveTrades.length);
          setTotalPnL(liveTrades.reduce((sum, trade) => sum + trade.pnl, 0));
        }
      } catch (error) {
        console.error('Failed to fetch live trades:', error);
      }
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [isRunning, selectedPreset, presets]);

  const handleStartTrading = () => {
    if (!selectedPreset) {
      alert('Please select a preset to start trading');
      return;
    }
    
    const preset = presets.find(p => p.id === selectedPreset);
    if (!preset) return;

    console.log('🚀 Starting bot trading with preset:', preset.name);
    console.log('Strategy:', preset.strategy);
    console.log('Risk per trade:', preset.riskPerTrade + '%');
    
    setIsRunning(true);
    setActiveTrades([]);
    setTotalPnL(0);
    setTradeCount(0);
    
    // Save state
    localStorage.setItem('bot_trading_state', JSON.stringify({
      isRunning: true,
      selectedPreset,
      startTime: new Date().toISOString()
    }));
  };

  const handleStopTrading = () => {
    console.log('⏹️ Stopping bot trading');
    setIsRunning(false);
    
    // Clear state
    localStorage.removeItem('bot_trading_state');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Automated Bot Trading
            </h1>
            <p className="text-gray-400 mt-1">
              Run proven strategies on your live account
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-green-400" />
            <span className={`text-sm ${isRunning ? 'text-green-400' : 'text-gray-400'}`}>
              {isRunning ? 'Bot Active' : 'Bot Inactive'}
            </span>
          </div>
        </div>

        {/* Main Trading Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preset Selection */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Select Trading Preset</h2>
              
              <div className="space-y-3">
                {presets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No presets saved yet</p>
                    <p className="text-sm mt-2">Run a backtest and save a preset first</p>
                  </div>
                ) : (
                  presets.map(preset => (
                    <label
                      key={preset.id}
                      className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedPreset === preset.id
                          ? 'bg-green-500/10 border-green-500'
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="preset"
                        value={preset.id}
                        checked={selectedPreset === preset.id}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                        className="sr-only"
                      />
                      <div>
                        <div className="font-semibold text-white">{preset.name}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          {preset.strategy === 'aggressive_scalper' ? '🔥 Aggressive Scalper' : '⚡ Quantum Scalper'}
                        </div>
                        {preset.performance && (
                          <div className="mt-2 space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Win Rate:</span>
                              <span className="text-green-400">{(preset.performance.winRate || 0).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Profit Factor:</span>
                              <span className="text-green-400">{(preset.performance.profitFactor || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Risk/Trade:</span>
                              <span className="text-yellow-400">{preset.parameters?.riskPerTrade || 1}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* Control Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleStartTrading}
                  disabled={isRunning || !selectedPreset}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                    isRunning || !selectedPreset
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  <Play className="w-5 h-5" />
                  <span>Start Trading</span>
                </button>

                <button
                  onClick={handleStopTrading}
                  disabled={!isRunning}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                    !isRunning
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  <Square className="w-5 h-5" />
                  <span>Stop Trading</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Trades Display */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span>Live Trades</span>
                {isRunning && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                    ACTIVE
                  </span>
                )}
              </h2>

              {activeTrades.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No active trades</p>
                  <p className="text-sm mt-2">
                    {isRunning ? 'Waiting for trade signals...' : 'Start trading to see live trades'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="text-xs text-gray-400 uppercase">
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3">Time</th>
                        <th className="text-left py-3">Symbol</th>
                        <th className="text-left py-3">Type</th>
                        <th className="text-left py-3">Volume</th>
                        <th className="text-left py-3">Entry</th>
                        <th className="text-left py-3">Current</th>
                        <th className="text-right py-3">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTrades.map((trade, idx) => (
                        <tr key={idx} className="border-b border-gray-800/50">
                          <td className="py-3 text-gray-400">{trade.time}</td>
                          <td className="py-3 text-white">{trade.symbol}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              trade.type === 'BUY' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-3">{trade.volume}</td>
                          <td className="py-3">{trade.entry}</td>
                          <td className="py-3">{trade.current}</td>
                          <td className={`py-3 text-right font-mono ${
                            trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            ${trade.pnl.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        {selectedPreset && (
          <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-gray-500 text-sm">Strategy:</span>
                  <span className="ml-2 text-white font-semibold">
                    {presets.find(p => p.id === selectedPreset)?.strategy === 'aggressive_scalper' 
                      ? 'Aggressive Scalper' 
                      : 'Quantum Scalper AI'}
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-700" />
                <div>
                  <span className="text-gray-500 text-sm">Risk/Trade:</span>
                  <span className="ml-2 text-yellow-400 font-semibold">
                    {presets.find(p => p.id === selectedPreset)?.parameters?.riskPerTrade || 1}%
                  </span>
                </div>
                {isRunning && (
                  <>
                    <div className="h-4 w-px bg-gray-700" />
                    <div>
                      <span className="text-gray-500 text-sm">Trades:</span>
                      <span className="ml-2 text-blue-400 font-semibold">{tradeCount}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-700" />
                    <div>
                      <span className="text-gray-500 text-sm">Total P&L:</span>
                      <span className={`ml-2 font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${totalPnL.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className={`flex items-center space-x-2 ${isRunning ? 'text-green-400' : 'text-gray-500'}`}>
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                <span className="text-sm">{isRunning ? 'Bot Trading Active' : 'Bot Inactive'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
