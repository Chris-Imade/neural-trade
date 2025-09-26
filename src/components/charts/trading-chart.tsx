'use client';

import { TradingViewWidget } from './tradingview-widget';

export function TradingChart() {
  return <TradingViewWidget symbol="OANDA:XAUUSD" interval="5" height={600} />;
}
