import axios from 'axios';

export interface YahooFinanceCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
}

export interface YahooFinanceData {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        exchangeTimezoneName: string;
        instrumentType: string;
        firstTradeDate: number;
        regularMarketTime: number;
        gmtoffset: number;
        timezone: string;
        exchangeName: string;
        regularMarketPrice: number;
        chartPreviousClose: number;
        scale: number;
        priceHint: number;
        currentTradingPeriod: any;
        tradingPeriods: any;
        dataGranularity: string;
        range: string;
        validRanges: string[];
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }>;
      };
    }>;
    error: any;
  };
}

export class YahooFinanceClient {
  private baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
  private requestDelay = 1000; // 1 second between requests to be respectful

  constructor() {}

  private mapTimeframeToInterval(timeframe: string): string {
    const intervalMap: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '4h': '1h', // Yahoo doesn't have 4h, use 1h
      '1d': '1d'
    };
    return intervalMap[timeframe] || '1d';
  }

  private mapTimeframeToPeriod(timeframe: string, startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Yahoo Finance periods
    if (daysDiff <= 1) return '1d';
    if (daysDiff <= 5) return '5d';
    if (daysDiff <= 30) return '1mo';
    if (daysDiff <= 90) return '3mo';
    if (daysDiff <= 180) return '6mo';
    if (daysDiff <= 365) return '1y';
    if (daysDiff <= 730) return '2y';
    return '5y';
  }

  async fetchHistoricalData(
    symbol: string,
    timeframe: string,
    startDate: string,
    endDate: string
  ): Promise<YahooFinanceCandle[]> {
    // For gold, use GLD (SPDR Gold Trust ETF) which tracks gold prices closely
    const yahooSymbol = symbol === 'XAUUSD' ? 'GLD' : symbol;
    const interval = this.mapTimeframeToInterval(timeframe);
    
    // Limit date range for intraday data to avoid 422 errors
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // For intraday data, limit to reasonable ranges to avoid Yahoo Finance limits
    let adjustedStart = start;
    let adjustedEnd = end;
    
    if (['1m', '5m', '15m', '30m', '1h'].includes(timeframe)) {
      // For intraday data, use the requested range but limit to last 60 days max
      const maxDays = 60;
      if (daysDiff > maxDays) {
        // Use the most recent part of the requested range
        adjustedEnd = end;
        adjustedStart = new Date(adjustedEnd.getTime() - (maxDays * 24 * 60 * 60 * 1000));
        console.log(`⚠️ Large date range detected for ${timeframe}. Limiting to last ${maxDays} days: ${adjustedStart.toISOString().split('T')[0]} to ${adjustedEnd.toISOString().split('T')[0]}`);
      }
      
      // Ensure we don't request future dates
      const now = new Date();
      if (adjustedEnd > now) {
        adjustedEnd = now;
      }
      if (adjustedStart > now) {
        adjustedStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // Last 7 days
      }
    }
    
    console.log(`🔍 Fetching ${yahooSymbol} data for ${timeframe} (${interval}) from ${adjustedStart.toISOString().split('T')[0]} to ${adjustedEnd.toISOString().split('T')[0]}`);

    const url = `${this.baseUrl}/${yahooSymbol}`;
    const params = {
      period1: Math.floor(adjustedStart.getTime() / 1000).toString(),
      period2: Math.floor(adjustedEnd.getTime() / 1000).toString(),
      interval: interval,
      includePrePost: 'true',
      events: 'div%2Csplit'
    };

    try {
      const response = await axios.get(url, {
        params,
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const data: YahooFinanceData = response.data;
      
      if (data.chart.error) {
        throw new Error(`Yahoo Finance Error: ${JSON.stringify(data.chart.error)}`);
      }

      if (!data.chart.result || data.chart.result.length === 0) {
        throw new Error(`No data returned for ${yahooSymbol}`);
      }

      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];

      if (!timestamps || !quotes) {
        throw new Error(`Invalid data structure for ${yahooSymbol}`);
      }

      // Convert to our format and filter by date range
      const candles: YahooFinanceCandle[] = [];
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime();

      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i] * 1000; // Convert to milliseconds
        
        if (timestamp >= startTime && timestamp <= endTime) {
          // Skip if any OHLC data is null
          if (quotes.open[i] == null || quotes.high[i] == null || 
              quotes.low[i] == null || quotes.close[i] == null) {
            continue;
          }

          candles.push({
            timestamp: new Date(timestamp).toISOString(),
            open: quotes.open[i],
            high: quotes.high[i],
            low: quotes.low[i],
            close: quotes.close[i],
            volume: quotes.volume[i] || 0,
            timeframe
          });
        }
      }

      console.log(`✅ Retrieved ${candles.length} candles for ${yahooSymbol} ${timeframe}`);
      
      // If we got no intraday data, try daily data as fallback
      if (candles.length === 0 && ['1m', '5m', '15m', '30m', '1h'].includes(timeframe)) {
        console.log(`⚠️ No ${timeframe} data available, falling back to daily data...`);
        return this.fetchHistoricalData(symbol, '1d', startDate, endDate);
      }
      
      return candles;

    } catch (error) {
      console.error('Yahoo Finance request failed:', error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        const responseData = error.response?.data;
        
        console.error(`❌ Yahoo Finance Error: ${status} ${statusText}`);
        console.error(`📄 Response data:`, responseData);
        
        if (status === 422) {
          // Parse the actual error message from Yahoo Finance
          const errorMsg = responseData?.chart?.error?.description || 'Invalid date range or parameters';
          throw new Error(`Yahoo Finance Limitation: ${errorMsg}. Please try a different date range or timeframe.`);
        } else if (status === 404) {
          throw new Error(`Yahoo Finance Error: Symbol ${yahooSymbol} not found. Please verify the symbol is correct.`);
        } else {
          throw new Error(`Yahoo Finance Error: ${status} ${statusText}. Please try again later.`);
        }
      }
      
      throw new Error(`Failed to fetch data from Yahoo Finance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Test connection and data availability
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const testData = await this.fetchHistoricalData(
        'XAUUSD',
        '1d',
        '2024-09-01',
        '2024-09-03'
      );

      if (testData.length > 0) {
        return {
          success: true,
          message: 'Yahoo Finance connection successful',
          data: {
            sampleCandles: testData.length,
            latestTimestamp: testData[testData.length - 1]?.timestamp,
            latestPrice: testData[testData.length - 1]?.close
          }
        };
      } else {
        return {
          success: false,
          message: 'No data returned from Yahoo Finance',
          data: null
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }
}
