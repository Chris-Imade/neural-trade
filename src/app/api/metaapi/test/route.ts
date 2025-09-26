import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const accountId = process.env.METAAPI_ACCOUNT_ID;
    const token = process.env.METAAPI_TOKEN;
    const region = process.env.METAAPI_REGION || 'new-york';

    if (!accountId || !token) {
      return NextResponse.json({
        error: 'Missing MetaAPI credentials',
        details: {
          hasAccountId: !!accountId,
          hasToken: !!token,
          region
        }
      }, { status: 400 });
    }

    console.log(`🧪 Testing MetaAPI connection to ${region} region...`);

    // Test 1: Account Information
    const accountUrl = `https://mt-client-api-v1.${region}.agiliumtrade.ai/users/current/accounts/${accountId}/account-information`;
    console.log(`📊 Testing account info: ${accountUrl}`);
    
    let accountResponse;
    try {
      accountResponse = await axios.get(accountUrl, {
        headers: {
          'auth-token': token,
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      console.log('✅ Account info retrieved successfully');
    } catch (accountError: unknown) {
      const error = accountError as any;
      console.log('❌ Account info failed:', error.response?.status, error.response?.data);
      throw accountError;
    }

    // Test 2: Historical Data (small sample) - try different date format
    const marketDataUrl = `https://mt-market-data-client-api-v1.${region}.agiliumtrade.ai/users/current/accounts/${accountId}/historical-market-data/symbols/XAUUSD/timeframes/15m/candles`;
    console.log(`📈 Testing historical data: ${marketDataUrl}`);
    
    // Use a more recent time range and proper ISO format
    const startTime = '2024-01-01T00:00:00.000Z';
    const endTime = '2024-01-02T00:00:00.000Z';
    
    let marketDataResponse;
    try {
      marketDataResponse = await axios.get(marketDataUrl, {
        headers: {
          'auth-token': token,
          'Accept': 'application/json'
        },
        params: {
          startTime,
          endTime,
          limit: 5
        },
        timeout: 10000
      });
      console.log('✅ Historical data retrieved successfully');
    } catch (marketError: unknown) {
      const error = marketError as any;
      console.log('❌ Historical data failed:', error.response?.status, error.response?.data);
      // Don't throw here, let's see account info at least
      marketDataResponse = { data: null, error: error.response?.data };
    }

    return NextResponse.json({
      success: true,
      region,
      accountId,
      tests: {
        accountInfo: {
          status: 'success',
          data: accountResponse.data
        },
        historicalData: {
          status: 'success',
          candleCount: Array.isArray(marketDataResponse.data) ? marketDataResponse.data.length : 0,
          sampleData: Array.isArray(marketDataResponse.data) ? marketDataResponse.data.slice(0, 2) : marketDataResponse.data
        }
      }
    });

  } catch (error: unknown) {
    console.error('❌ MetaAPI test failed:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const statusText = error.response?.statusText || 'Unknown Error';
      const message = error.response?.data?.message || error.message || 'MetaAPI request failed';
      const url = error.config?.url || 'Unknown URL';
      
      return NextResponse.json({
        error: 'MetaAPI test failed',
        details: {
          status,
          statusText,
          message,
          url,
          region: process.env.METAAPI_REGION || 'new-york',
          accountId: process.env.METAAPI_ACCOUNT_ID,
          hasToken: !!process.env.METAAPI_TOKEN
        }
      }, { status: status === 401 || status === 403 ? status : 500 });
    }

    return NextResponse.json({
      error: 'Unknown error occurred',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
