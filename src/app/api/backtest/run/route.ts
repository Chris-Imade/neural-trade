import { NextResponse } from "next/server";
import {
  BacktestEngine,
  BacktestParams,
  BacktestResults,
} from "@/lib/backtesting-engine";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Construct BacktestParams from URL search parameters
  const params: BacktestParams = {
    strategy: searchParams.get("strategy") as BacktestParams["strategy"],
    symbol: searchParams.get("symbol") || "XAUUSD",
    timeframe: (searchParams.get("timeframe") as BacktestParams["timeframe"]) || "15m",
    htfTimeframe: searchParams.get("htfTimeframe") as BacktestParams["htfTimeframe"] | null || undefined,
    startDate: searchParams.get("startDate") || searchParams.get("from") || "",
    endDate: searchParams.get("endDate") || searchParams.get("to") || "",
    initialBalance: parseFloat(searchParams.get("initialBalance") || "10000"),
    propFirm: (searchParams.get("propFirm") as BacktestParams["propFirm"]) || "equity-edge",
    riskPerTrade: parseFloat(searchParams.get("riskPerTrade") || "1"),
  };

  // Validate required parameters
  if (!params.strategy || !params.startDate || !params.endDate) {
    return NextResponse.json(
      { status: 400 }
    );
  }

  try {
    const engine = new BacktestEngine();
    const results = await engine.runBacktest(params);
    
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Backtest error:', error);
    
    // Enhanced error handling for MetaAPI issues
    if (error.isAxiosError || error.response) {
      const status = error.response?.status || 500;
      const statusText = error.response?.statusText || 'Unknown Error';
      const message = error.response?.data?.message || error.message || 'MetaAPI request failed';
      const url = error.config?.url || 'Unknown URL';
      
      console.error('MetaAPI Error Details:', {
        status,
        statusText,
        message,
        url,
        baseURL: error.config?.baseURL,
        accountId: process.env.METAAPI_ACCOUNT_ID,
        hasToken: !!process.env.METAAPI_TOKEN
      });
      
      // Provide specific guidance based on error type
      let userMessage = message;
      if (status === 404) {
        userMessage = `Historical data not available for ${params.symbol} on ${params.timeframe} timeframe. Check if your MetaAPI account has access to this symbol and timeframe.`;
      } else if (status === 401) {
        userMessage = 'Invalid MetaAPI token. Please check your METAAPI_TOKEN environment variable.';
      } else if (status === 403) {
        userMessage = 'MetaAPI access denied. Your account may not have permission to access historical data.';
      }
      
      return NextResponse.json({
        error: 'MetaAPI request failed',
        details: {
          status,
          statusText,
          message: userMessage,
          endpoint: url,
          symbol: params.symbol,
          timeframe: params.timeframe
        }
      }, { status: status === 401 || status === 403 ? status : 500 });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to run backtest',
        message: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
