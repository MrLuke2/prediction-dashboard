import { db } from '../../db/index.js';
import { trades, orders } from '../../db/schema/index.js';
import { orderManager } from './order-manager.js';
import { ArbOpportunity } from '../../types/execution.js';
import { redis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { eq } from 'drizzle-orm';
import { config } from '../../config.js';
import { registry } from '../../ws/clientState.js';
import { MessageType, buildServerMessage } from '../../ws/protocol.js';

export class ArbCoordinator {
  async coordinateArb(userId: string, opp: ArbOpportunity, sizeUsd: number) {
    logger.info({ userId, marketPairId: opp.marketPairId, sizeUsd }, 'Coordinating arbitrage trade');

    // 1. Create trade record
    const [trade] = await db.insert(trades).values({
      userId,
      marketPairId: opp.marketPairId,
      side: 'buy',
      venue: 'polymarket',
      size: sizeUsd.toString(),
      entryPrice: opp.polymarketPrice.toString(),
      status: 'pending',
      aiProvider: opp.aiProvider.providerId,
      aiModel: opp.aiProvider.model,
      aiConfidence: opp.aiConfidence.toString(),
    }).returning();

    try {
      // Step 1: Place Polymarket leg
      logger.info({ tradeId: trade.id }, 'Placing Polymarket leg...');
      const pmResult = await orderManager.placeOrder({
        userId,
        marketPairId: opp.marketPairId,
        venue: 'polymarket',
        side: 'buy',
        size: sizeUsd,
        maxSlippage: 0.005,
        price: opp.polymarketPrice,
        aiProvider: opp.aiProvider,
        aiConfidence: opp.aiConfidence
      });

      if (pmResult.status === 'failed') {
        throw new Error(`Polymarket leg failed: ${pmResult.error}`);
      }

      // Step 2: On fill, place Kalshi leg
      logger.info({ tradeId: trade.id }, 'Polymarket leg filled, placing Kalshi leg...');
      const ksResult = await orderManager.placeOrder({
        userId,
        marketPairId: opp.marketPairId,
        venue: 'kalshi',
        side: 'sell',
        size: sizeUsd,
        maxSlippage: 0.005,
        price: opp.kalshiPrice,
        aiProvider: opp.aiProvider,
        aiConfidence: opp.aiConfidence
      });

      if (ksResult.status === 'failed') {
        // Step 3: Kalshi failed, unwind Polymarket
        logger.error({ tradeId: trade.id }, 'Kalshi leg failed, unwinding Polymarket...');
        await this.unwindPolymarket(userId, opp, sizeUsd);
        throw new Error(`Kalshi leg failed: ${ksResult.error}. Polymarket leg unwound.`);
      }

      // 4. Update trade to open
      const [updatedTrade] = await db.update(trades)
        .set({ status: 'open' })
        .where(eq(trades.id, trade.id))
        .returning();

      // 5. Publish TRADE_UPDATE to WS
      const wsMessage = buildServerMessage(MessageType.TRADE_UPDATE, {
        tradeId: trade.id,
        status: 'open',
        pnl: 0,
        aiProvider: opp.aiProvider.providerId,
        timestamp: Date.now(),
      });
      registry.broadcastToUser(userId, wsMessage);

      // Publish to Redis
      await redis.publish('TRADE_UPDATE', JSON.stringify({
        userId,
        tradeId: trade.id,
        status: 'open',
      }));

      return updatedTrade;
    } catch (err: any) {
      logger.error({ err: err.message, tradeId: trade.id }, 'Arb coordination failed');
      await db.update(trades).set({ status: 'failed' }).where(eq(trades.id, trade.id));
      throw err;
    }
  }

  private async unwindPolymarket(userId: string, opp: ArbOpportunity, sizeUsd: number) {
    // Simplified unwind: place a sell order on Polymarket
    await orderManager.placeOrder({
      userId,
      marketPairId: opp.marketPairId,
      venue: 'polymarket',
      side: 'sell',
      size: sizeUsd,
      maxSlippage: 0.01,
      aiProvider: opp.aiProvider,
      aiConfidence: 100 // High confidence for unwind
    });
  }
}

export const arbCoordinator = new ArbCoordinator();
