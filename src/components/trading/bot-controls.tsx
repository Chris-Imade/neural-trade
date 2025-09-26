'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  AlertTriangle,
  Settings,
  Activity,
  Shield,
  Clock,
  Zap
} from 'lucide-react';
import { AutoTradingEngine, TradingSession } from '@/lib/auto-trading-engine';

export function BotControls() {
  const [tradingEngine] = useState(() => new AutoTradingEngine());
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState<TradingSession | null>(null);
  const [propFirm, setPropFirm] = useState<'equity-edge' | 'fundednext'>('equity-edge');
  const [settings, setSettings] = useState({
    maxPositions: 3,
    positionSize: 0.5, // 0.5% risk per trade for prop firms
    dailyLossLimit: 200,
    enableNewsFilter: true,
  });

  useEffect(() => {
    // Update session data every second when running
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setCurrentSession(tradingEngine.getCurrentSession());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, tradingEngine]);

  const handleStart = async () => {
    try {
      await tradingEngine.startTrading(propFirm);
      setIsRunning(true);
      console.log('🚀 Neuratrade Auto-Trading Bot Started!');
    } catch (error) {
      console.error('Failed to start trading bot:', error);
      alert('Failed to start trading bot. Check console for details.');
    }
  };

  const handleStop = () => {
    tradingEngine.stopTrading();
    setIsRunning(false);
    console.log('🛑 Neuratrade Auto-Trading Bot Stopped');
  };

  const handleEmergencyStop = () => {
    tradingEngine.stopTrading();
    setIsRunning(false);
    console.log('🚨 EMERGENCY STOP - All positions closed');
    alert('Emergency stop activated! All positions have been closed.');
  };

  return (
    <div className="space-y-6">
      {/* Bot Status */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Neuratrade Pro Bot</h3>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isRunning 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            <Zap className={`w-3 h-3 ${isRunning ? 'animate-pulse' : ''}`} />
            <span>{isRunning ? 'LIVE TRADING' : 'STOPPED'}</span>
          </div>
        </div>

        {/* Live Session Stats */}
        {isRunning && currentSession && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-green-400 font-semibold">{currentSession.totalTrades}</div>
                <div className="text-gray-400">Trades</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-semibold">
                  {currentSession.totalTrades > 0 
                    ? ((currentSession.winningTrades / currentSession.totalTrades) * 100).toFixed(1)
                    : '0.0'
                  }%
                </div>
                <div className="text-gray-400">Win Rate</div>
              </div>
              <div className="text-center">
                <div className={`font-semibold ${currentSession.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${currentSession.totalPnL.toFixed(2)}
                </div>
                <div className="text-gray-400">P&L</div>
              </div>
            </div>
          </div>
        )}

        {/* Prop Firm Selection */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Prop Firm</label>
          <select
            value={propFirm}
            onChange={(e) => setPropFirm(e.target.value as 'equity-edge' | 'fundednext')}
            disabled={isRunning}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 disabled:opacity-50"
          >
            <option value="equity-edge">Equity Edge (4% daily, 6% max)</option>
            <option value="fundednext">FundedNext (3% daily, 6% max)</option>
          </select>
        </div>

        {/* Control Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Start Trading</span>
          </button>

          <button
            onClick={handleStop}
            disabled={!isRunning}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Square className="w-4 h-4" />
            <span>Stop Trading</span>
          </button>

          <button
            onClick={handleEmergencyStop}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Emergency Stop</span>
          </button>
        </div>
      </div>

      {/* Risk Settings */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Risk Management</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Max Open Positions
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.maxPositions}
              onChange={(e) => setSettings(prev => ({ ...prev, maxPositions: Number(e.target.value) }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Position Size (%)
            </label>
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={settings.positionSize}
              onChange={(e) => setSettings(prev => ({ ...prev, positionSize: Number(e.target.value) }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Daily Loss Limit ($)
            </label>
            <input
              type="number"
              min="0"
              value={settings.dailyLossLimit}
              onChange={(e) => setSettings(prev => ({ ...prev, dailyLossLimit: Number(e.target.value) }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">News Filter</span>
            <button
              onClick={() => setSettings(prev => ({ ...prev, enableNewsFilter: !prev.enableNewsFilter }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enableNewsFilter ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableNewsFilter ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Trading Sessions */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Trading Sessions</h3>
        </div>

        <div className="space-y-3">
          {[
            { name: 'London', time: '08:00 - 17:00', active: true },
            { name: 'New York', time: '13:00 - 22:00', active: true },
            { name: 'Asian', time: '00:00 - 09:00', active: false },
          ].map((session) => (
            <div key={session.name} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-white">{session.name}</div>
                <div className="text-xs text-gray-400">{session.time}</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                session.active ? 'bg-green-400' : 'bg-gray-600'
              }`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
