import { FastifyInstance } from 'fastify';
import { db } from '../../db/index.js';
import { trades, orders, marketPairs } from '../../db/schema/index.js';
import { arbCoordinator } from '../../services/execution/arb-coordinator.js';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';

export default async function tradeRoutes(fastify: FastifyInstance) {
  
  // POST /trades/arb — initiate arb trade
  fastify.post('/arb', async (req, reply) => {
    // In a real app, middleware would check for "pro+" plan
    const bodySchema = z.object({
      marketPairId: z.string().uuid(),
      polymarketPrice: z.number(),
      kalshiPrice: z.number(),
      spread: z.number(),
      sizeUsd: z.number().max(1000)
    });

    const validated = bodySchema.parse(req.body);
    const userId = (req as any).user?.id || '00000000-0000-0000-0000-000000000000'; // Fallback for dev

    try {
      const trade = await arbCoordinator.coordinateArb(userId, {
        marketPairId: validated.marketPairId,
        polymarketPrice: validated.polymarketPrice,
        kalshiPrice: validated.kalshiPrice,
        spread: validated.spread,
        expectedProfit: validated.spread * validated.sizeUsd
      }, validated.sizeUsd);

      return trade;
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  // GET /trades — user's trade history
  fastify.get('/', async (req, reply) => {
    const userId = (req as any).user?.id || '00000000-0000-0000-0000-000000000000';
    const { limit = 20, offset = 0 } = req.query as { limit?: number; offset?: number };

    const history = await db.query.trades.findMany({
      where: eq(trades.userId, userId),
      orderBy: [desc(trades.openedAt)],
      limit: Number(limit),
      offset: Number(offset),
      with: {
        marketPair: true
      }
    });

    return history;
  });

  // GET /trades/:id — single trade with execution timeline
  fastify.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    
    const trade = await db.query.trades.findFirst({
      where: eq(trades.id, id),
      with: {
        marketPair: true
      }
    });

    if (!trade) return reply.code(404).send({ error: 'Trade not found' });

    const timeline = await db.query.orders.findMany({
      where: eq(orders.tradeId, id),
      orderBy: [desc(orders.createdAt)]
    });

    return { ...trade, timeline };
  });

  // POST /trades/:id/close — manual close
  fastify.post('/:id/close', async (req, reply) => {
    const { id } = req.params as { id: string };
    
    // Simplified close: just mark as closed in DB
    // In production, this would trigger counter-orders on venues
    const [updated] = await db.update(trades)
      .set({ 
        status: 'closed', 
        closedAt: new Date(),
        exitPrice: '0.5' // Mocked exit price
      })
      .where(eq(trades.id, id))
      .returning();

    return updated;
  });
}
