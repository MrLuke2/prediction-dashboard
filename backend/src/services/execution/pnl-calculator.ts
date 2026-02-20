import { Trade } from '../../db/schema/trades.js';
import { redis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';

export class PnLCalculator {
  computeRealizedPnL(trade: Trade): number {
    if (!trade.exitPrice) return 0;
    
    const size = parseFloat(trade.size);
    const entry = parseFloat(trade.entryPrice);
    const exit = parseFloat(trade.exitPrice);

    // Simple calculation: (exit - entry) * size for buys, vice versa for sells
    // Note: Fees should be subtracted here if available
    const rawPnl = trade.side === 'buy' 
      ? (exit - entry) * size 
      : (entry - exit) * size;

    return rawPnl;
  }

  computeUnrealizedPnL(trade: Trade, currentPrice: number): number {
    const size = parseFloat(trade.size);
    const entry = parseFloat(trade.entryPrice);

    return trade.side === 'buy'
      ? (currentPrice - entry) * size
      : (entry - currentPrice) * size;
  }

  async publishPnLUpdate(userId: string, tradeId: string, unrealizedPnL: number) {
    await redis.publish('TRADE_UPDATE', JSON.stringify({
      type: 'PNL_UPDATE',
      userId,
      tradeId,
      unrealizedPnL,
      timestamp: new Date().toISOString()
    }));
  }
}

export const pnLCalculator = new PnLCalculator();
