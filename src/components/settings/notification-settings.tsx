'use client';

import { useState } from 'react';
import { 
  Bell, 
  Mail,
  MessageSquare,
  Smartphone,
  Save
} from 'lucide-react';

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    // Trade Notifications
    tradeExecuted: true,
    tradeClosed: true,
    stopLossHit: true,
    takeProfitHit: true,
    
    // Risk Notifications
    dailyLossWarning: true,
    drawdownWarning: true,
    marginCall: true,
    connectionLost: true,
    
    // Performance Notifications
    profitTarget: true,
    winRateAlert: false,
    newHighBalance: true,
    
    // Notification Methods
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    discordWebhook: false,
    
    // Contact Info
    email: 'trader@neuratrade.com',
    phone: '+1234567890',
    discordWebhookUrl: '',
    
    // Notification Timing
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '06:00',
    },
    
    // Alert Thresholds
    thresholds: {
      dailyLossPercent: 80, // 80% of daily limit
      drawdownPercent: 80, // 80% of max drawdown
      profitTargetPercent: 90, // 90% of profit target
    }
  });

  const handleSave = () => {
    console.log('Notification settings saved:', settings);
    alert('Notification settings saved successfully!');
  };

  const testNotification = () => {
    alert('Test notification sent! Check your configured channels.');
    console.log('Test notification sent to:', {
      email: settings.emailNotifications ? settings.email : 'disabled',
      push: settings.pushNotifications ? 'enabled' : 'disabled',
      sms: settings.smsNotifications ? settings.phone : 'disabled',
    });
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Bell className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">Notification Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Trade Notifications */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-4">
            Trade Notifications
          </h4>
          
          <div className="space-y-3">
            {[
              { key: 'tradeExecuted' as keyof typeof settings, label: 'Trade Executed', desc: 'When a new trade is opened' },
              { key: 'tradeClosed' as keyof typeof settings, label: 'Trade Closed', desc: 'When a trade is closed' },
              { key: 'stopLossHit' as keyof typeof settings, label: 'Stop Loss Hit', desc: 'When stop loss is triggered' },
              { key: 'takeProfitHit' as keyof typeof settings, label: 'Take Profit Hit', desc: 'When take profit is reached' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings[item.key] ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Notifications */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-4">
            Risk Alerts
          </h4>
          
          <div className="space-y-3">
            {[
              { key: 'dailyLossWarning' as keyof typeof settings, label: 'Daily Loss Warning', desc: 'Approaching daily loss limit' },
              { key: 'drawdownWarning' as keyof typeof settings, label: 'Drawdown Warning', desc: 'Approaching max drawdown' },
              { key: 'marginCall' as keyof typeof settings, label: 'Margin Call', desc: 'Low margin level alert' },
              { key: 'connectionLost' as keyof typeof settings, label: 'Connection Lost', desc: 'MetaAPI connection issues' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings[item.key] ? 'bg-red-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Methods */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-4">
            Notification Methods
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm font-medium text-white">Email Notifications</div>
                  <div className="text-xs text-gray-400">Send alerts via email</div>
                </div>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotifications ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.emailNotifications && (
              <div className="ml-8">
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-sm font-medium text-white">Push Notifications</div>
                  <div className="text-xs text-gray-400">Browser push notifications</div>
                </div>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.pushNotifications ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-sm font-medium text-white">Discord Webhook</div>
                  <div className="text-xs text-gray-400">Send alerts to Discord channel</div>
                </div>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, discordWebhook: !prev.discordWebhook }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.discordWebhook ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.discordWebhook ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.discordWebhook && (
              <div className="ml-8">
                <input
                  type="url"
                  value={settings.discordWebhookUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, discordWebhookUrl: e.target.value }))}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Alert Thresholds */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-4">
            Alert Thresholds
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Daily Loss Alert (%)
              </label>
              <input
                type="number"
                min="50"
                max="95"
                value={settings.thresholds.dailyLossPercent}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  thresholds: { ...prev.thresholds, dailyLossPercent: Number(e.target.value) }
                }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
              <div className="text-xs text-gray-500 mt-1">% of daily limit</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Drawdown Alert (%)
              </label>
              <input
                type="number"
                min="50"
                max="95"
                value={settings.thresholds.drawdownPercent}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  thresholds: { ...prev.thresholds, drawdownPercent: Number(e.target.value) }
                }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
              <div className="text-xs text-gray-500 mt-1">% of max drawdown</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Profit Target Alert (%)
              </label>
              <input
                type="number"
                min="50"
                max="99"
                value={settings.thresholds.profitTargetPercent}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  thresholds: { ...prev.thresholds, profitTargetPercent: Number(e.target.value) }
                }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
              <div className="text-xs text-gray-500 mt-1">% of profit target</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-700 space-y-3">
          <button
            onClick={testNotification}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span>Test Notifications</span>
          </button>
          
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Notification Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
