import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { LiveTrade } from '@/lib/trading-statistics';
import axios from 'axios';

const token = process.env.METAAPI_TOKEN;
const accountId = process.env.METAAPI_ACCOUNT_ID;

if (!token || !accountId) {
  throw new Error('MetaAPI token and account ID are required. Please configure METAAPI_TOKEN and METAAPI_ACCOUNT_ID in environment variables.');
}

// MetaAPI REST API base URL (london region - matches account region)
const METAAPI_BASE_URL = 'https://mt-client-api-v1.london.agiliumtrade.ai';

// Create axios instance with default headers and SSL handling
const metaApiClient = axios.create({
  baseURL: METAAPI_BASE_URL,
  headers: {
    'auth-token': token,
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 second timeout
  httpsAgent: new (require('https').Agent)({
    rejectUnauthorized: false // Handle SSL certificate issues temporarily
  })
});

interface MetaApiDeal {
  id: string;
  type: string;
  symbol: string;
  volume: number;
  openPrice: number;
  closePrice?: number;
  profit: number;
  swap: number;
  commission: number;
  openTime: string;
  closeTime?: string;
  comment?: string;
  magic?: number;
}

interface MetaApiPosition {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  swap: number;
  profit: number;
  openTime: string;
  comment?: string;
}

// Helper function to make MetaAPI requests using axios
async function makeMetaApiRequest(endpoint: string): Promise<any> {
  try {
    console.log(`🔄 Making MetaAPI request: ${endpoint}`);
    const response = await metaApiClient.get(`/users/current/accounts/${accountId}${endpoint}`);
    console.log(`✅ MetaAPI request successful: ${endpoint}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const message = error.response?.data?.message || error.message;
      console.error(`❌ MetaAPI Error Details:`, {
        status,
        statusText,
        message,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw new Error(`MetaAPI request failed: ${status} ${statusText} - ${message}`);
    }
    throw error;
  }
}

export async function GET() {
    try {
        console.log('🔄 Fetching REAL trades from MetaAPI...');
        
        // Calculate time range for historical data (last 30 days)
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const startTimeStr = startTime.toISOString();
        const endTimeStr = endTime.toISOString();
        
        console.log(`📅 Fetching trades from ${startTimeStr} to ${endTimeStr}`);
        
        // Fetch real historical deals (closed trades) using time-based endpoint
        const deals: MetaApiDeal[] = await makeMetaApiRequest(`/history-deals/time/${startTimeStr}/${endTimeStr}`);
        console.log('📈 Historical deals fetched:', deals.length);
        
        // Fetch real open positions
        const positions: MetaApiPosition[] = await makeMetaApiRequest('/positions');
        console.log('🔄 Open positions fetched:', positions.length);
        
        // Transform deals to unified format
        const closedTrades = deals.filter(deal => deal.closeTime).map(deal => ({
            id: deal.id,
            symbol: deal.symbol,
            type: deal.type,
            volume: deal.volume,
            openPrice: deal.openPrice,
            closePrice: deal.closePrice,
            profit: deal.profit,
            swap: deal.swap,
            commission: deal.commission,
            openTime: deal.openTime,
            closeTime: deal.closeTime,
            comment: deal.comment,
            magic: deal.magic,
            status: 'closed' as const,
            duration: deal.closeTime ? new Date(deal.closeTime).getTime() - new Date(deal.openTime).getTime() : 0
        }));
        
        // Transform positions to unified format
        const openTrades = positions.map(position => ({
            id: position.id,
            symbol: position.symbol,
            type: position.type,
            volume: position.volume,
            openPrice: position.openPrice,
            currentPrice: position.currentPrice,
            stopLoss: position.stopLoss,
            takeProfit: position.takeProfit,
            profit: position.profit,
            swap: position.swap,
            openTime: position.openTime,
            comment: position.comment,
            status: 'open' as const,
            duration: new Date().getTime() - new Date(position.openTime).getTime()
        }));
        
        // Combine and sort by open time (newest first)
        const allTrades = [...closedTrades, ...openTrades].sort((a, b) => 
            new Date(b.openTime).getTime() - new Date(a.openTime).getTime()
        );
        
        return NextResponse.json({
            trades: allTrades,
            totalTrades: allTrades.length,
            closedTrades: closedTrades.length,
            openTrades: openTrades.length,
            lastUpdate: new Date().toISOString()
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('❌ Error fetching real trades from MetaAPI:', errorMessage);
        
        // Return empty state - NO DUMMY DATA
        return NextResponse.json({ 
            error: `Failed to retrieve trades from MetaAPI: ${errorMessage}`,
            trades: [],
            totalTrades: 0,
            closedTrades: 0,
            openTrades: 0,
            lastUpdate: new Date().toISOString()
        }, { status: 200 });
    }
}
