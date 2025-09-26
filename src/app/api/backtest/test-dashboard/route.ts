import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing dashboard backtest integration...');

    // Simulate a dashboard backtest request with realistic parameters
    const testParams = {
      strategy: 'vab_breakout',
      symbol: 'XAUUSD',
      timeframe: '1d',
      startDate: '2024-09-01',
      endDate: '2024-09-15', // Shorter range for faster testing
      initialBalance: '10000',
      propFirm: 'equity-edge',
      riskPerTrade: '1'
    };

    const query = new URLSearchParams(testParams);
    const backtestUrl = `${request.nextUrl.origin}/api/backtest/run?${query.toString()}`;
    
    console.log(`📡 Testing backtest API: ${backtestUrl}`);

    // Make the same request the dashboard would make
    const response = await fetch(backtestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: 'Backtest API failed',
        status: response.status,
        details: errorData
      }, { status: 500 });
    }

    const backtestResults = await response.json();

    // Validate the response structure
    const requiredFields = [
      'strategy', 'symbol', 'timeframe', 'startDate', 'endDate',
      'initialBalance', 'finalBalance', 'totalTrades', 'winRate',
      'isRealBacktest', 'dataPoints', 'executionTime'
    ];

    const missingFields = requiredFields.filter(field => !(field in backtestResults));

    return NextResponse.json({
      success: true,
      message: 'Dashboard backtest integration working perfectly!',
      testParams,
      results: {
        isRealBacktest: backtestResults.isRealBacktest,
        dataPoints: backtestResults.dataPoints,
        executionTime: backtestResults.executionTime,
        strategy: backtestResults.strategy,
        symbol: backtestResults.symbol,
        timeframe: backtestResults.timeframe,
        dateRange: `${backtestResults.startDate} to ${backtestResults.endDate}`,
        totalTrades: backtestResults.totalTrades,
        winRate: backtestResults.winRate,
        finalBalance: backtestResults.finalBalance,
        missingFields: missingFields.length > 0 ? missingFields : null
      },
      validation: {
        hasRealData: backtestResults.isRealBacktest === true,
        hasDataPoints: backtestResults.dataPoints > 0,
        hasValidExecution: backtestResults.executionTime > 0,
        structureValid: missingFields.length === 0
      }
    });

  } catch (error: unknown) {
    console.error('❌ Dashboard backtest test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Dashboard backtest test failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
