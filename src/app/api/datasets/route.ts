import { NextResponse } from 'next/server';
import { DatasetManager } from '@/lib/dataset-manager';

export async function GET() {
  try {
    const manager = new DatasetManager();
    const datasets = await manager.getDatasets();
    
    return NextResponse.json({
      success: true,
      datasets
    });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch datasets'
    }, { status: 500 });
  }
}
