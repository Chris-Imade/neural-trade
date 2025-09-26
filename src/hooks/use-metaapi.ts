'use client';

import { useState, useEffect, useRef } from 'react';
import { AccountInfo, Position, PriceData } from '@/types/trading';

interface MetaAPIResponse {
  error?: string;
  accountId: string;
  accountName: string;
  broker: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  isConnected: boolean;
  connectionStatus: string;
}

interface TradesResponse {
  trades: any[];
  error?: string;
}

export function useMetaAPI() {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Disabled MetaAPI calls
  const [isInitialLoad, setIsInitialLoad] = useState(false); // Disabled MetaAPI calls  
  const [error, setError] = useState<string | null>('MetaAPI calls temporarily disabled');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // TEMPORARILY DISABLED - MetaAPI calls causing unwanted history-deals requests
  // TODO: Re-enable when we want live trading dashboard
  // useEffect(() => {
  const fetchDataDisabled = async (isInitial = false) => {
      try {
        if (isInitial) {
          setIsLoading(true);
          console.log('🔄 Fetching REAL MetaAPI data...');
        }
        
        // Fetch real account info from our API
        const metricsResponse = await fetch('/api/live/metrics');
        if (!metricsResponse.ok) {
          throw new Error(`HTTP ${metricsResponse.status}: ${metricsResponse.statusText}`);
        }
        
        const metricsData: MetaAPIResponse = await metricsResponse.json();
        
        if (metricsData.error) {
          setError(metricsData.error);
          setAccountInfo(null);
          setPositions([]);
          setPriceData([]);
          console.error('❌ MetaAPI error:', metricsData.error);
          return;
        }

        // Set real account info
        setAccountInfo({
          balance: metricsData.balance,
          equity: metricsData.equity,
          currency: 'USD', // Default, could be fetched from MetaAPI
          leverage: 500, // Default, could be fetched from MetaAPI
          marginLevel: metricsData.marginLevel,
          freeMargin: metricsData.freeMargin,
          marginUsed: metricsData.margin,
        });

        // Fetch real positions/trades
        const tradesResponse = await fetch('/api/live/trades');
        if (tradesResponse.ok) {
          const tradesData: TradesResponse = await tradesResponse.json();
          
          if (!tradesData.error) {
            // Convert trades to positions format
            const openPositions: Position[] = tradesData.trades
              .filter(trade => trade.status === 'open')
              .map(trade => ({
                id: trade.id,
                symbol: trade.symbol,
                type: trade.type,
                volume: trade.volume,
                openPrice: trade.openPrice,
                currentPrice: trade.currentPrice || trade.openPrice,
                profit: trade.profit || 0,
                swap: trade.swap || 0,
                openTime: trade.openTime,
                stopLoss: trade.stopLoss,
                takeProfit: trade.takeProfit,
              }));
            
            setPositions(openPositions);
            console.log(`✅ Loaded ${openPositions.length} real open positions`);
          }
        }

        // For now, price data is not available from our current API
        // This would require a separate MetaAPI endpoint for real-time prices
        setPriceData([]);

        setError(null);
        console.log('✅ Real MetaAPI data loaded successfully');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trading data';
        setError(errorMessage);
        setAccountInfo(null);
        setPositions([]);
        setPriceData([]);
        console.error('❌ MetaAPI Error:', errorMessage);
      } finally {
        if (isInitial) {
          setIsLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    // DISABLED: Initial data fetch
    // fetchData(true);

    // DISABLED: Set up real-time updates every 10 seconds for equity monitoring
    // intervalRef.current = setInterval(() => fetchData(false), 10000);
    
    // return () => {
    //   if (intervalRef.current) {
    //     clearInterval(intervalRef.current);
    //   }
    // };
  // }, []);

  const refreshData = () => {
    setIsLoading(true);
    setIsInitialLoad(true);
  };

  return {
    accountInfo,
    positions,
    priceData,
    isLoading: isInitialLoad,
    error,
    refreshData,
  };
}
