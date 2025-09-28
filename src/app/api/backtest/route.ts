import { NextRequest, NextResponse } from 'next/server';
import { BacktestEngine } from '@/lib/backtesting-engine';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const strategy = searchParams.get('strategy') as 
    | 'aggressive_scalper'
    | 'quantum_scalper' 
    | 'smart_money' 
    | 'ict_smc'
    | 'vab_breakout'
    | 'mean_reversion'
    | 'dual_timeframe_trend';
  
  const datasetId = searchParams.get('datasetId');
  const initialBalance = Number(searchParams.get('initialBalance')) || 10000;
  const propFirm = searchParams.get('propFirm') as 'equity-edge' | 'fundednext';
  const riskPerTrade = Number(searchParams.get('riskPerTrade')) || 1;

  if (!strategy || !datasetId) {
    return NextResponse.json({
      error: 'Missing required parameters',
      message: 'strategy and datasetId are required'
    }, { status: 400 });
  }

  try {
    console.log(`🚀 Starting REAL backtest with ACTUAL strategy: ${strategy}`);
    console.log(`📁 Using dataset: ${datasetId}`);
    console.log(`💰 Initial balance: $${initialBalance}`);
    console.log(`⚠️ Risk per trade: ${riskPerTrade}%`);
    
    // Use the REAL backtesting engine with REAL strategies
    const engine = new BacktestEngine();
    const results = await engine.runBacktest({
      strategy,
      datasetId,
      initialBalance,
      propFirm,
      riskPerTrade
    });

    console.log(`✅ Backtest complete: ${results.totalTrades} trades, ${results.winRate.toFixed(1)}% win rate`);
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Backtest error:', error);
    return NextResponse.json({
      error: 'Failed to run backtest',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
