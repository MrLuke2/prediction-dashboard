import { db } from '../../db/index.js';
import { trades, orders, alphaMetrics } from '../../db/schema/index.js';
import { OrderParams, OrderResult } from '../../types/execution.js';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import { desc, eq, and, sql } from 'drizzle-orm';

export class OrderManager {
  async placeOrder(params: OrderParams): Promise<OrderResult> {
    logger.info({ userId: params.userId, marketPairId: params.marketPairId, venue: params.venue }, 'Placing order');

    // 1. Validate User Plan
    // (In a real app, check user.plan from DB. Assuming users are tracked.)
    // For now, allow all.

    // 2. Pre-trade risk check: call risk agent latest output
    const latestMetric = await db.query.alphaMetrics.findFirst({
      orderBy: [desc(alphaMetrics.createdAt)]
    });

    if (latestMetric?.regime === 'critical') {
      logger.warn({ regime: latestMetric.regime }, 'Order blocked due to critical risk regime');
      return { orderId: '', status: 'failed', error: 'Risk regime is critical' };
    }

    // 3. Position size limits
    if (params.size > config.MAX_POSITION_USD) {
      logger.warn({ size: params.size, max: config.MAX_POSITION_USD }, 'Order blocked: size exceeds MAX_POSITION_USD');
      return { orderId: '', status: 'failed', error: 'Exceeds maximum position size' };
    }

    // 4. Check aggregate exposure for user
    const userTrades = await db.query.trades.findMany({
      where: and(
        eq(trades.userId, params.userId),
        eq(trades.status, 'open')
      )
    });

    const currentExposure = userTrades.reduce((acc, t) => acc + Number(t.size), 0);
    if (currentExposure + params.size > config.MAX_POSITION_USD * 5) { // Arbitrary limit for demo
      return { orderId: '', status: 'failed', error: 'User exposure limit reached' };
    }

    // 5. Create Order entry
    const [newOrder] = await db.insert(orders).values({
        userId: params.userId,
        marketPairId: params.marketPairId,
        venue: params.venue,
        side: params.side,
        size: params.size.toString(),
        price: params.price?.toString(),
        status: 'pending'
    }).returning();

    return {
        orderId: newOrder.id,
        status: 'pending'
    };
  }

  async updateOrderStatus(orderId: string, updates: Partial<any>) {
    await db.update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  }
}

export const orderManager = new OrderManager();
