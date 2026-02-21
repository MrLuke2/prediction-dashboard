import { db } from '../../db/index.js';
import { trades, emergencyEvents } from '../../db/schema/index.js';
import { redis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { eq, and, isNull } from 'drizzle-orm';
import { registry } from '../../ws/clientState.js';
import { MessageType, buildServerMessage } from '../../ws/protocol.js';
import * as metrics from '../../lib/metrics.js';

export class EmergencyStopService {
  /**
   * Triggers an emergency stop.
   * If userId is provided, it's user-specific. Otherwise, it's system-wide.
   */
  async trigger(reason: string, userId?: string) {
    logger.warn({ userId: userId || 'SYSTEM', reason }, 'EMERGENCY STOP TRIGGERED');
    metrics.emergency_stops_total.inc();

    // 1. Close all open trades
    const conditions = [eq(trades.status, 'open')];
    if (userId) {
      conditions.push(eq(trades.userId, userId));
    }

    const openTrades = await db.query.trades.findMany({
      where: and(...conditions),
    });

    for (const trade of openTrades) {
      await db.update(trades)
        .set({
          status: 'emergency_closed',
          emergencyClosedAt: new Date(),
          emergencyReason: reason,
        })
        .where(eq(trades.id, trade.id));
    }

    // 2. Write emergency event
    await db.insert(emergencyEvents).values({
      userId: userId || '00000000-0000-0000-0000-000000000000', // System user ID
      triggerReason: reason,
      tradesClosed: openTrades.length,
      metadata: { source: 'EmergencyStopService' },
    });

    // 3. Publish to Redis
    const target = userId || 'system';
    await redis.set(`emergency:active:${target}`, 'true');
    await redis.publish(`emergency:stop:${target}`, JSON.stringify({
      reason,
      tradesAffected: openTrades.length,
      timestamp: new Date().toISOString(),
    }));

    // 4. WebSocket Broadcast
    const wsMessage = buildServerMessage(MessageType.EMERGENCY_STOP, {
      reason,
      tradesAffected: openTrades.length,
      timestamp: new Date().toISOString(),
    });

    if (userId) {
      registry.broadcastToUser(userId, wsMessage);
    } else {
      registry.broadcast(wsMessage);
    }

    logger.info({ target, tradesClosed: openTrades.length }, 'Emergency stop completed');
  }

  async isEmergencyActive(userId?: string): Promise<boolean> {
    // Check Redis first for speed
    const systemFlag = await redis.get('emergency:active:system');
    if (systemFlag === 'true') return true;

    if (userId) {
      const userFlag = await redis.get(`emergency:active:${userId}`);
      if (userFlag === 'true') return true;
    }

    // Fallback to DB check for unresolved events
    const unresolved = await db.query.emergencyEvents.findFirst({
      where: isNull(emergencyEvents.resolvedAt),
    });

    return !!unresolved;
  }

  async resolveEmergency(eventId: string) {
    const [event] = await db.update(emergencyEvents)
      .set({ resolvedAt: new Date() })
      .where(eq(emergencyEvents.id, eventId))
      .returning();

    if (event) {
      const target = event.userId === '00000000-0000-0000-0000-000000000000' ? 'system' : event.userId;
      await redis.del(`emergency:active:${target}`);
      logger.info({ eventId, target }, 'Emergency resolved');
    }
  }
}

export const emergencyStopService = new EmergencyStopService();
