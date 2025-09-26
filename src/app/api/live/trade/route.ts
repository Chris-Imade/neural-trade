import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

const token = process.env.METAAPI_TOKEN;
const accountId = process.env.METAAPI_ACCOUNT_ID;

if (!token || !accountId) {
  throw new Error('MetaAPI token and account ID are required. Please configure METAAPI_TOKEN and METAAPI_ACCOUNT_ID in environment variables.');
}

// MetaAPI REST API base URL
const METAAPI_BASE_URL = 'https://mt-client-api-v1.london.agiliumtrade.ai';

interface TradePayload {
    symbol: string;
    action: 'buy' | 'sell';
    volume: number;
}

async function makeMetaApiRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
  const response = await fetch(`${METAAPI_BASE_URL}/users/current/accounts/${accountId}${endpoint}`, {
    method,
    headers: {
      'auth-token': token!,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new Error(`MetaAPI request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function POST(request: Request) {
    let tradePayload: TradePayload | null = null;

    try {
        console.log('🔄 Processing REAL trade execution request...');
        tradePayload = await request.json();
        const { symbol, action, volume } = tradePayload!;

        if (!symbol || !action || !volume) {
            return NextResponse.json({ error: 'Missing required trade parameters' }, { status: 400 });
        }

        console.log(`📊 Executing ${action.toUpperCase()} ${volume} lots of ${symbol}`);

        // Execute trade via MetaAPI REST API
        const tradeRequest = {
            symbol,
            type: action.toLowerCase() === 'buy' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
            volume,
            actionType: 'ORDER_FILLING_FOK' // Fill or Kill
        };

        const result = await makeMetaApiRequest('/trade', 'POST', tradeRequest);

        console.log('✅ Trade executed successfully:', result);

        // Log trade to database
        try {
            const db = await connectToDatabase();
            const tradeLog = {
                accountId,
                symbol,
                action,
                volume,
                orderId: result.orderId || result.positionId,
                executionTime: new Date(),
                status: 'executed',
                openPrice: result.openPrice,
                message: 'Trade executed successfully'
            };
            await db.collection('trades').insertOne(tradeLog);
        } catch (dbError) {
            console.warn('⚠️ Failed to log trade to database:', dbError);
        }

        return NextResponse.json({ 
            success: true, 
            orderId: result.orderId || result.positionId,
            openPrice: result.openPrice,
            message: 'Trade executed successfully'
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('❌ Trade execution failed:', errorMessage);

        // Log failed trade to database
        if (tradePayload) {
            try {
                const db = await connectToDatabase();
                await db.collection('trades').insertOne({
                    accountId,
                    ...tradePayload,
                    status: 'failed',
                    error: errorMessage,
                    executionTime: new Date(),
                });
            } catch (dbError) {
                console.error('Failed to log trade error to database:', dbError);
            }
        }

        return NextResponse.json({ error: `Trade execution failed: ${errorMessage}` }, { status: 500 });
    }
}
