'use client';

import { useState } from 'react';
import { 
  Shield, 
  Target,
  Clock,
  AlertTriangle,
  Save
} from 'lucide-react';

export function TradingSettings() {
  const [settings, setSettings] = useState({
    // Risk Management
    maxRiskPerTrade: 0.5,
    maxDailyLoss: 4.0,
    maxDrawdown: 6.0,
    maxOpenPositions: 3,
    
    // Trading Preferences
    enableNewsFilter: true,
    tradingHours: {
      start: '08:00',
      end: '17:00',
    },
    enableWeekendTrading: false,
    
    // Strategy Settings
    primaryStrategy: 'gold_scalper_pro',
    enableMultiStrategy: true,
    minConfidence: 75,
    
    // Prop Firm Settings
    propFirm: 'equity-edge',
    accountSize: 100000,
    challengeMode: true,
  });

  const handleSave = () => {
    // Save settings logic
    console.log('Settings saved:', settings);
    alert('Trading settings saved successfully!');
  };

  const strategies = [
    { id: 'gold_scalper_pro', name: 'Gold Scalper Pro', winRate: '78%' },
    { id: 'icc_strategy', name: 'ICC Strategy', winRate: '73%' },
    { id: 'ema_breakout', name: 'EMA Breakout', winRate: '64%' },
    { id: 'trend_following', name: 'Trend Following', winRate: '71%' },
  ];

  const propFirms = [
    { id: 'equity-edge', name: 'Equity Edge', dailyLimit: '4%', maxDD: '6%' },
    { id: 'fundednext', name: 'FundedNext', dailyLimit: '3%', maxDD: '6%' },
    { id: 'ftmo', name: 'FTMO', dailyLimit: '5%', maxDD: '10%' },
  ];

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">Trading Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Risk Management */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-yellow-400" />
            Risk Management
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Max Risk Per Trade (%)
              </label>
              <input
                type="number"
                min="0.1"
                max="2.0"
                step="0.1"
                value={settings.maxRiskPerTrade}
                onChange={(e) => setSettings(prev => ({ ...prev, maxRiskPerTrade: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Max Open Positions
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.maxOpenPositions}
                onChange={(e) => setSettings(prev => ({ ...prev, maxOpenPositions: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Prop Firm Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
            <Target className="w-4 h-4 mr-2 text-blue-400" />
            Prop Firm Configuration
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Prop Firm
              </label>
              <select
                value={settings.propFirm}
                onChange={(e) => setSettings(prev => ({ ...prev, propFirm: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              >
                {propFirms.map((firm) => (
                  <option key={firm.id} value={firm.id}>
                    {firm.name} (Daily: {firm.dailyLimit}, Max DD: {firm.maxDD})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Account Size ($)
                </label>
                <select
                  value={settings.accountSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, accountSize: Number(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                >
                  <option value={10000}>$10,000</option>
                  <option value={25000}>$25,000</option>
                  <option value={50000}>$50,000</option>
                  <option value={100000}>$100,000</option>
                  <option value={200000}>$200,000</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Challenge Mode</span>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, challengeMode: !prev.challengeMode }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.challengeMode ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.challengeMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-4">
            Strategy Configuration
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Primary Strategy
              </label>
              <select
                value={settings.primaryStrategy}
                onChange={(e) => setSettings(prev => ({ ...prev, primaryStrategy: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              >
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name} ({strategy.winRate} win rate)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Min Confidence (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="95"
                  value={settings.minConfidence}
                  onChange={(e) => setSettings(prev => ({ ...prev, minConfidence: Number(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Multi-Strategy</span>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, enableMultiStrategy: !prev.enableMultiStrategy }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableMultiStrategy ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableMultiStrategy ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Hours */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-purple-400" />
            Trading Hours (UTC)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={settings.tradingHours.start}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  tradingHours: { ...prev.tradingHours, start: e.target.value }
                }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={settings.tradingHours.end}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  tradingHours: { ...prev.tradingHours, end: e.target.value }
                }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Enable News Filter</span>
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

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Trading Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
