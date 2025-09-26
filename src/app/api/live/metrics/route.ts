import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TradingStatistics } from '@/lib/trading-statistics';
import axios from 'axios';

// Weekly cache for profit factor and win rate
interface WeeklyStats {
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  totalLoss: number;
  weekStart: string;
  lastUpdated: string;
}

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

interface MetaApiAccountInfo {
  name: string;
  broker: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
}

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

// Helper function to make MetaAPI requests using correct endpoints from documentation
async function makeMetaApiRequest(endpoint: string, useShortPath: boolean = false): Promise<any> {
  try {
    console.log(`🔄 Making MetaAPI request: ${endpoint}`);
    const fullPath = useShortPath 
      ? `/accounts/${accountId}${endpoint}`
      : `/users/current/accounts/${accountId}${endpoint}`;
    
    const response = await metaApiClient.get(fullPath);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const message = error.response?.data?.message || error.message;
      if (status === 404 && !useShortPath) {
        console.log(`🔄 Retrying with short path format...`);
        return makeMetaApiRequest(endpoint, true);
      }
      throw new Error(`MetaAPI request failed: ${status} ${statusText} - ${message}`);
    }
    throw error;
  }
}

// Get start of current week (Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Check if we need to recalculate weekly stats
async function getWeeklyStats(): Promise<WeeklyStats | null> {
  try {
    const db = await connectToDatabase();
    const currentWeekStart = getWeekStart(new Date()).toISOString();
    
    const cached = await db.collection('weekly_stats').findOne({
      accountId,
      weekStart: currentWeekStart
    });
    
    return cached as WeeklyStats | null;
  } catch (error) {
    console.error('Failed to get cached weekly stats:', error);
    return null;
  }
}

// Save weekly stats to cache
async function saveWeeklyStats(stats: WeeklyStats): Promise<void> {
  try {
    const db = await connectToDatabase();
    await db.collection('weekly_stats').replaceOne(
      { accountId, weekStart: stats.weekStart },
      { accountId, ...stats },
      { upsert: true }
    );
    console.log('✅ Weekly stats cached successfully');
  } catch (error) {
    console.error('Failed to cache weekly stats:', error);
  }
}

async function fetchAndCalculateLiveMetrics(): Promise<TradingStatistics> {
    try {
        console.log('🔌 Fetching REAL data from MetaAPI...');
        
        let accountInfo: MetaApiAccountInfo = await makeMetaApiRequest('/account-information');
        const positions: MetaApiPosition[] = await makeMetaApiRequest('/positions');

        let weeklyStats = await getWeeklyStats();
        
        if (!weeklyStats) {
            console.log('📅 No valid weekly cache found. Recalculating from MetaAPI...');
            
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
            const deals: MetaApiDeal[] = await makeMetaApiRequest(`/history-deals/time/${startTime.toISOString()}/${endTime.toISOString()}`);
            
            const closedTrades = deals.filter(deal => deal.closeTime);
            const winningTrades = closedTrades.filter(deal => deal.profit > 0);
            const losingTrades = closedTrades.filter(deal => deal.profit < 0);
            
            const totalProfit = winningTrades.reduce((sum, deal) => sum + deal.profit, 0);
            const totalLoss = Math.abs(losingTrades.reduce((sum, deal) => sum + deal.profit, 0));
            
            weeklyStats = {
                winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
                profitFactor: totalLoss > 0 ? totalProfit / totalLoss : (totalProfit > 0 ? 999 : 0),
                totalTrades: closedTrades.length,
                winningTrades: winningTrades.length,
                losingTrades: losingTrades.length,
                totalProfit,
                totalLoss,
                weekStart: getWeekStart(new Date()).toISOString(),
                lastUpdated: new Date().toISOString()
            };
            
            await saveWeeklyStats(weeklyStats);
        } else {
            console.log('📊 Using cached weekly stats from:', weeklyStats.lastUpdated);
        }

        const netProfit = weeklyStats.totalProfit - weeklyStats.totalLoss;

        return {
            accountId: accountId!,
            accountName: accountInfo.name,
            broker: accountInfo.broker,
            balance: accountInfo.balance,
            equity: accountInfo.equity,
            initialBalance: accountInfo.balance - netProfit,
            margin: accountInfo.margin,
            freeMargin: accountInfo.freeMargin,
            marginLevel: accountInfo.marginLevel,
            totalTrades: weeklyStats.totalTrades,
            winningTrades: weeklyStats.winningTrades,
            losingTrades: weeklyStats.losingTrades,
            winRate: weeklyStats.winRate,
            profitFactor: weeklyStats.profitFactor,
            totalProfit: weeklyStats.totalProfit,
            totalLoss: weeklyStats.totalLoss,
            netProfit: netProfit,
            openTrades: positions.length,
            closedTrades: weeklyStats.totalTrades,
            averageWin: weeklyStats.winningTrades > 0 ? weeklyStats.totalProfit / weeklyStats.winningTrades : 0,
            averageLoss: weeklyStats.losingTrades > 0 ? weeklyStats.totalLoss / weeklyStats.losingTrades : 0,
            largestWin: 0,
            largestLoss: 0,
            maxDrawdown: 0,
            currentDrawdown: 0,
            dailyPnL: 0,
            weeklyPnL: netProfit,
            monthlyPnL: 0,
            averageTradeDuration: 0,
            bestHour: '',
            bestDay: '',
            volatility: 0,
            sharpeRatio: 0,
            lastUpdate: new Date().toISOString(),
            isConnected: true,
            connectionStatus: 'connected'
        };
        
    } catch (error) {
        console.error('❌ Failed to fetch real MetaAPI data:', error);
        throw error;
    }
}

export async function GET() {
    try {
        console.log('🔄 Fetching fresh data from MetaAPI (no cache)...');
        const metrics = await fetchAndCalculateLiveMetrics();
        
        try {
            const db = await connectToDatabase();
            await db.collection('metrics').deleteMany({});
            await db.collection('metrics').insertOne(metrics);
            console.log('✅ Real MetaAPI data cached successfully');
        } catch (dbError) {
            console.warn('⚠️ Failed to cache data, but returning real MetaAPI data anyway:', dbError);
        }

        return NextResponse.json(metrics);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('❌ Error fetching real MetaAPI data:', errorMessage);
        
        return NextResponse.json({ 
            error: `Failed to retrieve live metrics from MetaAPI: ${errorMessage}`,
            isConnected: false,
            connectionStatus: 'error',
            accountId: accountId || '',
            accountName: '',
            broker: '',
            balance: 0,
            equity: 0,
            initialBalance: 0,
            margin: 0,
            freeMargin: 0,
            marginLevel: 0,
            totalTrades: 0,
            openTrades: 0,
            closedTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            totalProfit: 0,
            totalLoss: 0,
            netProfit: 0,
            averageWin: 0,
            averageLoss: 0,
            largestWin: 0,
            largestLoss: 0,
            profitFactor: 0,
            bestHour: '',
            bestDay: '',
            averageTradeDuration: 0,
            maxDrawdown: 0,
            currentDrawdown: 0,
            dailyPnL: 0,
            weeklyPnL: 0,
            monthlyPnL: 0,
            volatility: 0,
            sharpeRatio: 0,
            lastUpdate: new Date().toISOString()
        }, { status: 200 });
    }
}
