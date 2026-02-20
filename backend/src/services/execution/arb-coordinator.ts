import { db } from '../../db/index.js';
import { trades, orders } from '../../db/schema/index.js';
import { orderManager } from './order-manager.js';
import { polymarketExecutor } from './polymarket-executor.js';
import { kalshiExecutor } from './kalshi-executor.js';
import { ArbOpportunity } from '../../types/execution.js';
import { redis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { eq } from 'drizzle-orm';

export class ArbCoordinator {
  async coordinateArb(userId: string, opp: ArbOpportunity, sizeUsd: number) {
    logger.info({ userId, opp, sizeUsd }, 'Coordinating arbitrage trade');

    // 1. Create a parent trade record
    const [trade] = await db.insert(trades).values({
      userId,
      marketPairId: opp.marketPairId,
      side: 'buy', // Composite arb is considered a 'buy' of the spread
      venue: 'polymarket', // Primary venue
      size: sizeUsd.toString(),
      entryPrice: opp.spread.toString(),
      status: 'open',
    }).returning();

    try {
      // 2. Place Polymarket Leg
      const pmOrderResult = await orderManager.placeOrder({
        userId,
        marketPairId: opp.marketPairId,
        venue: 'polymarket',
        side: 'buy',
        size: sizeUsd,
        maxSlippage: 0.005,
        price: opp.polymarketPrice
      });

      if (pmOrderResult.status === 'failed') {
        throw new Error(`PM Leg failed: ${pmOrderResult.error}`);
      }

      await orderManager.updateOrderStatus(pmOrderResult.orderId, { tradeId: trade.id });
      
      const pmExternalId = await polymarketExecutor.submitOrder({
        market: opp.marketPairId,
        side: 'buy',
        size: sizeUsd,
        price: opp.polymarketPrice
      });

      await orderManager.updateOrderStatus(pmOrderResult.orderId, { 
        externalOrderId: pmExternalId,
        status: 'submitted' 
      });

      // 3. Wait for PM fill
      const pmStatus = await polymarketExecutor.pollOrderStatus(pmExternalId);
      if (pmStatus !== 'filled') {
        throw new Error(`Polymarket order ${pmStatus}`);
      }
      
      await orderManager.updateOrderStatus(pmOrderResult.orderId, { status: 'filled' });

      // 4. Place Kalshi Leg
      const ksOrderResult = await orderManager.placeOrder({
        userId,
        marketPairId: opp.marketPairId,
        venue: 'kalshi',
        side: 'sell',
        size: sizeUsd,
        maxSlippage: 0.005,
        price: opp.kalshiPrice
      });

      if (ksOrderResult.status === 'failed') {
        // Attempt unwind of PM leg (simplified)
        logger.error('Kalshi leg failed to place, UNWIND NEEDED');
        throw new Error('Kalshi leg failed initiation');
      }

      await orderManager.updateOrderStatus(ksOrderResult.orderId, { tradeId: trade.id });

      const ksExternalId = await kalshiExecutor.placeOrder({
        ticker: opp.marketPairId, // Example
        side: 'sell',
        count: sizeUsd,
        price: opp.kalshiPrice
      });

      await orderManager.updateOrderStatus(ksOrderResult.orderId, { 
        externalOrderId: ksExternalId,
        status: 'submitted' 
      });

      // 5. Publish update
      await redis.publish('TRADE_UPDATE', JSON.stringify({
        tradeId: trade.id,
        status: 'active',
        message: 'Arb legs placed successfully'
      }));

      return trade;
    } catch (err: any) {
      logger.error({ err: err.message, tradeId: trade.id }, 'Arb execution failed');
      await db.update(trades).set({ status: 'failed' }).where(eq(trades.id, trade.id));
      throw err;
    }
  }
}

export const arbCoordinator = new ArbCoordinator();
