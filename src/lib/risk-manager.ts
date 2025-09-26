export interface PropFirmRules {
  name: string;
  maxDailyLoss: number;
  maxTotalLoss: number;
  maxPositions: number;
}

export class RiskManager {
  private static propFirmRules: Record<string, PropFirmRules> = {
    'equity-edge': {
      name: 'Equity Edge',
      maxDailyLoss: 4,
      maxTotalLoss: 6,
      maxPositions: 3
    },
    'fundednext': {
      name: 'FundedNext', 
      maxDailyLoss: 5,
      maxTotalLoss: 10,
      maxPositions: 5
    }
  };

  static getPropFirmRules(propFirm: string): PropFirmRules {
    return this.propFirmRules[propFirm] || this.propFirmRules['equity-edge'];
  }

  static calculatePositionSize(
    accountBalance: number,
    riskPerTrade: number,
    entryPrice: number,
    stopLoss: number
  ): number {
    const riskAmount = (accountBalance * riskPerTrade) / 100;
    const priceRisk = Math.abs(entryPrice - stopLoss);
    const positionSize = riskAmount / (priceRisk * 100);
    return Math.max(0.01, Math.round(positionSize * 100) / 100);
  }

  static calculateStopLoss(entryPrice: number, isLong: boolean, atrValue: number): number {
    const stopDistance = atrValue * 1.5;
    return isLong ? entryPrice - stopDistance : entryPrice + stopDistance;
  }

  static calculateTakeProfit(entryPrice: number, stopLoss: number, isLong: boolean): number {
    const riskDistance = Math.abs(entryPrice - stopLoss);
    const rewardDistance = riskDistance * 2; // 1:2 RR
    return isLong ? entryPrice + rewardDistance : entryPrice - rewardDistance;
  }
}
