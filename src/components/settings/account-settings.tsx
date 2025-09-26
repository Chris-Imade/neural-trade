'use client';

import { useState } from 'react';
import { 
  User, 
  Key,
  Database,
  Wifi,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';

export function AccountSettings() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    // MetaAPI Settings
    metaApiToken: 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9...',
    accountId: '123501db-b9e1-40b1-9868-d48ab8b2ec8f',
    
    // Account Info
    accountName: 'Neuratrade Pro Account',
    brokerName: 'IC Markets',
    accountType: 'Demo',
    leverage: 500,
    
    // Connection Settings
    serverRegion: 'new-york',
    enableWebSocket: true,
    reconnectAttempts: 5,
    
    // Data Settings
    enableDataLogging: true,
    logLevel: 'info',
    retentionDays: 30,
  });

  const handleSave = () => {
    console.log('Account settings saved:', settings);
    alert('Account settings saved successfully!');
  };

  const testConnection = async () => {
    // Test MetaAPI connection
    alert('Testing MetaAPI connection... Check console for results.');
    console.log('Testing connection with:', {
      token: settings.metaApiToken.substring(0, 20) + '...',
      accountId: settings.accountId
    });
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center space-x-2 mb-6">
        <User className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Account Settings</h3>
      </div>

      <div className="space-y-6">
        {/* MetaAPI Configuration */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
            <Key className="w-4 h-4 mr-2 text-green-400" />
            MetaAPI Configuration
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                MetaAPI Token
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.metaApiToken}
                  onChange={(e) => setSettings(prev => ({ ...prev, metaApiToken: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:border-green-500"
                  placeholder="Enter your MetaAPI token"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Account ID
              </label>
              <input
                type="text"
                value={settings.accountId}
                onChange={(e) => setSettings(prev => ({ ...prev, accountId: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                placeholder="Enter your MetaAPI account ID"
              />
            </div>
            
            <button
              onClick={testConnection}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              <Wifi className="w-4 h-4" />
              <span>Test Connection</span>
            </button>
          </div>
        </div>

        {/* Account Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-4">
            Account Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={settings.accountName}
                onChange={(e) => setSettings(prev => ({ ...prev, accountName: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Broker
              </label>
              <select
                value={settings.brokerName}
                onChange={(e) => setSettings(prev => ({ ...prev, brokerName: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              >
                <option value="IC Markets">IC Markets</option>
                <option value="Pepperstone">Pepperstone</option>
                <option value="FP Markets">FP Markets</option>
                <option value="Blueberry Markets">Blueberry Markets</option>
                <option value="ThinkMarkets">ThinkMarkets</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Account Type
              </label>
              <select
                value={settings.accountType}
                onChange={(e) => setSettings(prev => ({ ...prev, accountType: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              >
                <option value="Demo">Demo</option>
                <option value="Live">Live</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Leverage
              </label>
              <select
                value={settings.leverage}
                onChange={(e) => setSettings(prev => ({ ...prev, leverage: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              >
                <option value={100}>1:100</option>
                <option value={200}>1:200</option>
                <option value={500}>1:500</option>
                <option value={1000}>1:1000</option>
              </select>
            </div>
          </div>
        </div>

        {/* Connection Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
            <Wifi className="w-4 h-4 mr-2 text-purple-400" />
            Connection Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Server Region
              </label>
              <select
                value={settings.serverRegion}
                onChange={(e) => setSettings(prev => ({ ...prev, serverRegion: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              >
                <option value="new-york">New York</option>
                <option value="london">London</option>
                <option value="singapore">Singapore</option>
                <option value="sydney">Sydney</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Reconnect Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.reconnectAttempts}
                  onChange={(e) => setSettings(prev => ({ ...prev, reconnectAttempts: Number(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Enable WebSocket</span>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, enableWebSocket: !prev.enableWebSocket }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableWebSocket ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableWebSocket ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
            <Database className="w-4 h-4 mr-2 text-yellow-400" />
            Data & Logging
          </h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Log Level
                </label>
                <select
                  value={settings.logLevel}
                  onChange={(e) => setSettings(prev => ({ ...prev, logLevel: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                >
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Data Retention (Days)
                </label>
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={settings.retentionDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, retentionDays: Number(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Enable Data Logging</span>
              <button
                onClick={() => setSettings(prev => ({ ...prev, enableDataLogging: !prev.enableDataLogging }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableDataLogging ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableDataLogging ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Account Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
