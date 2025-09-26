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
    return csv.trim().split('\n').map(line => {
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
