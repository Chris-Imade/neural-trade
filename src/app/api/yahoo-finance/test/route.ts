import { NextRequest, NextResponse } from 'next/server';
import { YahooFinanceClient } from '@/lib/yahoo-finance-client';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Yahoo Finance connection...');
    
    const client = new YahooFinanceClient();
    
    // Test connection
    const testResult = await client.testConnection();
    
    if (!testResult.success) {
      return NextResponse.json({
        success: false,
        error: testResult.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Fetch sample data
    const sampleData = await client.fetchHistoricalData(
      'XAUUSD', // Will use GLD
      '1d',
      '2024-09-01',
      '2024-09-15'
    );
    
    console.log(`✅ Yahoo Finance test successful: ${sampleData.length} candles`);
    
    return NextResponse.json({
      success: true,
      message: 'Yahoo Finance connection successful',
      dataSource: 'Yahoo Finance (FREE)',
      symbol: 'GLD (Gold ETF)',
      sampleData: {
        totalCandles: sampleData.length,
        dateRange: {
          start: sampleData[0]?.timestamp,
          end: sampleData[sampleData.length - 1]?.timestamp
        },
        priceRange: {
          lowest: Math.min(...sampleData.map(c => c.low)),
          highest: Math.max(...sampleData.map(c => c.high)),
          latest: sampleData[sampleData.length - 1]?.close
        },
        sampleCandles: sampleData.slice(0, 3).map(candle => ({
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        }))
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Yahoo Finance test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
