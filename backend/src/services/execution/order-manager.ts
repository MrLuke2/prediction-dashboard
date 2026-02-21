import { db } from '../../db/index.js';
import { trades, orders, alphaMetrics, users } from '../../db/schema/index.js';
import { OrderParams, OrderResult } from '../../types/execution.js';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import { emergencyStopService } from './emergency-stop.js';
import { desc, eq, and, count } from 'drizzle-orm';
import * as metrics from '../../lib/metrics.js';

export class OrderManager {
  async placeOrder(params: OrderParams): Promise<OrderResult> {
    logger.info({ userId: params.userId, marketPairId: params.marketPairId, venue: params.venue }, 'Placing order');

    // 1. emergencyActive check
    if (await emergencyStopService.isEmergencyActive(params.userId)) {
      logger.warn({ userId: params.userId }, 'Order blocked: Emergency active');
      return { orderId: '', status: 'failed', error: 'Order blocked: Emergency active' };
    }

    // 2. Risk agent latest check
    const latestAlpha = await db.query.alphaMetrics.findFirst({
      orderBy: [desc(alphaMetrics.createdAt)]
    });
    if (latestAlpha?.regime === 'critical') {
      logger.warn({ regime: latestAlpha.regime }, 'Order blocked: Risk regime is critical');
      return { orderId: '', status: 'failed', error: 'Risk regime is critical' };
    }

    // 3. User plan check
    const user = await db.query.users.findFirst({
      where: eq(users.id, params.userId)
    });
    if (!user || user.plan === 'free') {
      logger.warn({ userId: params.userId, plan: user?.plan }, 'Order blocked: Free tier limit');
      return { orderId: '', status: 'failed', error: 'Upgrade required for automated trading' };
    }

    // 4. Position size check
    if (params.size > config.MAX_POSITION_USD) {
      logger.warn({ size: params.size, max: config.MAX_POSITION_USD }, 'Order blocked: Exceeds max position');
      return { orderId: '', status: 'failed', error: 'Exceeds maximum position size' };
    }

    // 5. AI confidence check
    if (params.aiConfidence < config.MIN_CONFIDENCE_THRESHOLD) {
      logger.warn({ confidence: params.aiConfidence, min: config.MIN_CONFIDENCE_THRESHOLD }, 'Order blocked: Low confidence');
      return { orderId: '', status: 'failed', error: 'Signal confidence below threshold' };
    }

    // Create Order entry
    const [newOrder] = await db.insert(orders).values({
      userId: params.userId,
      marketPairId: params.marketPairId,
      venue: params.venue,
      side: params.side,
      size: params.size.toString(),
      price: params.price?.toString(),
      status: 'pending'
    }).returning();

    // If PAPER_TRADING=true, we simulate a successful fill
    if (config.PAPER_TRADING) {
      logger.info({ orderId: newOrder.id }, 'Paper trading enabled, simulating fill');
      await this.simulateFill(newOrder.id);
      
      metrics.trades_executed_total.labels(params.venue, params.aiProvider.providerId).inc();
      await this.updateActivePositionsMetric();

      return { orderId: newOrder.id, status: 'filled' };
    }

    return {
      orderId: newOrder.id,
      status: 'pending'
    };
  }

  private async simulateFill(orderId: string) {
    await db.update(orders)
      .set({ status: 'filled', updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  }

  async updateOrderStatus(orderId: string, updates: Partial<any>) {
    await db.update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  }

  private async updateActivePositionsMetric() {
    try {
      const result = await db.select({ value: count() }).from(trades).where(eq(trades.status, 'open'));
      metrics.active_positions_gauge.set(Number(result[0].value));
    } catch (err) {
      logger.error({ err }, 'Failed to update active positions metric');
    }
  }
}

export const orderManager = new OrderManager();
