import fs from 'fs';
import path from 'path';

export interface Dataset {
  id: string;
  name: string;
  filePath: string;
}

export class DatasetManager {
  async getDatasets(): Promise<Dataset[]> {
    const datasets: Dataset[] = [];
    const base = path.join(process.cwd(), 'dataset');
    
    // July-Sep 2025
    const julySep = path.join(base, 'july-sep-2025');
    if (fs.existsSync(julySep)) {
      fs.readdirSync(julySep).filter(f => f.endsWith('.csv')).forEach(file => {
        datasets.push({
          id: file,
          name: `July-Sep 2025: ${file.replace('XAUUSD', '').replace('.csv', '')}`,
          filePath: path.join(julySep, file)
        });
      });
    }

    // Few Months 2025 (Extended Historical Data)
    const fewMonths = path.join(base, 'few-months-data-2025');
    if (fs.existsSync(fewMonths)) {
      fs.readdirSync(fewMonths).filter(f => f.endsWith('.csv')).forEach(file => {
        const timeframeName = file.replace('XAUUSD_', '').replace('.csv', '');
        datasets.push({
          id: file,
          name: `Extended 2025: ${timeframeName}`,
          filePath: path.join(fewMonths, file)
        });
      });
    }

    return datasets;
  }

  loadDataset(filePath: string) {
    const csv = fs.readFileSync(filePath, 'utf-8');
    const lines = csv.trim().split('\n');
    
    // Detect format by checking first few lines
    const isExtendedFormat = lines[0]?.includes('Historical Data') || lines[1]?.includes('Date,Open,High,Low,Close');
    
    if (isExtendedFormat) {
      // Extended format: Skip header rows, comma-separated
      return lines.slice(2) // Skip "XAUUSD Historical Data" and column headers
        .filter(line => line.trim() && !line.includes('Date,Open')) // Filter out any remaining headers
        .map(line => {
          const parts = line.split(',');
          if (parts.length < 5) return null; // Skip invalid lines
          
          const [dateStr, open, high, low, close] = parts;
          
          // Convert date format "08/26/2025 00:00" to ISO string
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return null; // Skip invalid dates
          
          return {
            timestamp: date.toISOString(),
            open: parseFloat(open) || 0,
            high: parseFloat(high) || 0,
            low: parseFloat(low) || 0,
            close: parseFloat(close) || 0,
            volume: 1
          };
        })
        .filter(Boolean) // Remove null entries
        .reverse(); // Reverse to get chronological order (oldest first)
    } else {
      // Original format: Tab-separated
      return lines.map(line => {
        const [timestamp, open, high, low, close] = line.split('\t');
        return {
          timestamp,
          open: +open,
          high: +high,
          low: +low,
          close: +close,
          volume: 1
        };
      });
    }
  }
}
