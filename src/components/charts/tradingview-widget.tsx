'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  BarChart3, 
  Settings, 
  Maximize2,
  RefreshCw,
  TrendingUp,
  Minimize2,
  Plus,
  LineChart,
  Activity,
  Target
} from 'lucide-react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewWidgetProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: number;
}

export function TradingViewWidget({ 
  symbol: initialSymbol = 'OANDA:XAUUSD', 
  interval: initialInterval = '5',
  theme = 'dark',
  height = 600 
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [selectedInterval, setSelectedInterval] = useState(initialInterval);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);

  // GOLD ONLY - Neuratrade Pro focuses exclusively on XAUUSD
  const symbols = [
    { value: 'OANDA:XAUUSD', label: 'Gold (XAU/USD) - Primary' },
    { value: 'TVC:GOLD', label: 'Gold Spot - Alternative' },
    { value: 'COMEX:GC1!', label: 'Gold Futures - Reference' },
  ];

  const intervals = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
    { value: '1D', label: '1D' },
  ];

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (containerRef.current && window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: selectedSymbol,
          interval: selectedInterval,
          timezone: 'Etc/UTC',
          theme: theme,
          style: '1',
          locale: 'en',
          toolbar_bg: 'transparent',
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: containerRef.current.id,
          studies: showIndicators ? [
            'MASimple@tv-basicstudies',
            'RSI@tv-basicstudies',
            'MACD@tv-basicstudies',
            'BB@tv-basicstudies',
            'Stochastic@tv-basicstudies'
          ] : [],
          overrides: {
            'mainSeriesProperties.candleStyle.upColor': '#10b981',
            'mainSeriesProperties.candleStyle.downColor': '#ef4444',
            'mainSeriesProperties.candleStyle.wickUpColor': '#10b981',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
            'mainSeriesProperties.candleStyle.borderUpColor': '#10b981',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
            'paneProperties.background': '#0f172a',
            'paneProperties.backgroundType': 'solid',
            'paneProperties.vertGridProperties.color': '#1e293b',
            'paneProperties.horzGridProperties.color': '#1e293b',
            'symbolWatermarkProperties.transparency': 95,
            'scalesProperties.textColor': '#64748b',
            'mainSeriesProperties.priceLineColor': '#64748b',
            'paneProperties.legendProperties.showLegend': false,
          },
          disabled_features: [
            'use_localstorage_for_settings',
            'left_toolbar',
            'header_widget',
            'header_symbol_search',
            'header_interval_dialog_button',
            'header_chart_type',
            'header_settings',
            'header_indicators',
            'header_compare',
            'header_undo_redo',
            'header_screenshot',
            'header_fullscreen_button',
            'volume_force_overlay',
            'create_volume_indicator_by_default',
            'timeframes_toolbar',
            'edit_buttons_in_legend',
            'context_menus',
            'control_bar',
            'border_around_the_chart'
          ],
          enabled_features: [
            'study_templates',
            'side_toolbar_in_fullscreen_mode',
            'hide_left_toolbar_by_default'
          ]
        });
        setIsLoading(false);
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [selectedSymbol, selectedInterval, theme]);

  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol);
    setIsLoading(true);
  };

  const handleIntervalChange = (newInterval: string) => {
    setSelectedInterval(newInterval);
    setIsLoading(true);
  };

  const currentHeight = isExpanded ? 800 : height;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <LineChart className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Professional Chart</h3>
          </div>
          
          {/* Symbol Selector */}
          <select
            value={selectedSymbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
          >
            {symbols.map((sym) => (
              <option key={sym.value} value={sym.value}>
                {sym.label}
              </option>
            ))}
          </select>

          {/* Interval Selector */}
          <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
            {intervals.map((int) => (
              <button
                key={int.value}
                onClick={() => handleIntervalChange(int.value)}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  selectedInterval === int.value
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowIndicators(!showIndicators)}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
              showIndicators 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-xs">Indicators</span>
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="text-xs">{isExpanded ? 'Minimize' : 'Expand'}</span>
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative bg-slate-900">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/90">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">Loading professional chart...</p>
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          id={`tradingview-widget-${Date.now()}`}
          style={{ height: `${currentHeight}px` }}
          className="w-full"
        />
      </div>

      {/* Chart Footer */}
      <div className="px-6 py-3 bg-gray-800/30 border-t border-gray-800 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4 text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live Market Data</span>
          </div>
          {showIndicators && (
            <div className="flex items-center space-x-2">
              <Target className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400">Technical Analysis Active</span>
            </div>
          )}
        </div>
        <div className="text-gray-500 text-xs">
          Powered by TradingView • {isExpanded ? 'Expanded View' : 'Standard View'}
        </div>
      </div>
    </div>
  );
}
