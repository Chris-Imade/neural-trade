import { NextResponse } from 'next/server';

const token = process.env.METAAPI_TOKEN;
const accountId = process.env.METAAPI_ACCOUNT_ID;

if (!token || !accountId) {
  throw new Error('MetaAPI token and account ID are required. Please configure METAAPI_TOKEN and METAAPI_ACCOUNT_ID in environment variables.');
}

// MetaAPI REST API base URL
const METAAPI_BASE_URL = 'https://mt-client-api-v1.london.agiliumtrade.ai';

async function makeMetaApiRequest(endpoint: string): Promise<any> {
  const response = await fetch(`${METAAPI_BASE_URL}/users/current/accounts/${accountId}${endpoint}`, {
    headers: {
      'auth-token': token!,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`MetaAPI request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    console.log(`🔄 Fetching REAL price for ${symbol}...`);

    // Get current price from MetaAPI
    const priceData = await makeMetaApiRequest(`/symbols/${symbol}/current-price`);
    
    console.log(`✅ Price fetched for ${symbol}:`, priceData);

    return NextResponse.json({
      symbol,
      bid: priceData.bid,
      ask: priceData.ask,
      spread: priceData.ask - priceData.bid,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`❌ Failed to fetch price for ${params.symbol}:`, errorMessage);
    
    return NextResponse.json({ 
      error: `Failed to fetch price: ${errorMessage}`,
      symbol: params.symbol,
      bid: 0,
      ask: 0,
      spread: 0,
      timestamp: new Date().toISOString()
    }, { status: 200 }); // Return 200 with empty data instead of 500
  }
}
