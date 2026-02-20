import { FastifyInstance } from 'fastify';
import { db } from '../../db/index.js';
import { whaleMovements } from '../../db/schema/index.js';
import { desc, eq, sql } from 'drizzle-orm';
import { redis } from '../../lib/redis.js';

export default async function whaleRoutes(fastify: FastifyInstance) {
  
  // GET /whales/recent — last 50 movements (cached 10s)
  fastify.get('/recent', async (req, reply) => {
    const cacheKey = 'whales:recent';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const movements = await db.query.whaleMovements.findMany({
        orderBy: [desc(whaleMovements.timestamp)],
        limit: 50
      });

      await redis.set(cacheKey, JSON.stringify(movements), 'EX', 10);
      return movements;
    } catch (error) {
      fastify.log.error(error);
      return [];
    }
  });

  // GET /whales/:address — wallet history + PnL estimate
  fastify.get('/:address', async (req, reply) => {
    const { address } = req.params as { address: string };
    
    try {
      const history = await db.query.whaleMovements.findMany({
        where: eq(whaleMovements.walletAddress, address),
        orderBy: [desc(whaleMovements.timestamp)],
        limit: 100
      });

      let pnlEstimate = 0;
      history.forEach(m => {
        if (m.direction === 'buy') pnlEstimate -= m.amountUsd;
        else pnlEstimate += m.amountUsd;
      });

      return { 
        address, 
        history, 
        pnlEstimate,
        winRate: 0.65 // Mocked for now
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch whale history' });
    }
  });

  // GET /whales/leaderboard — top 10 wallets by win rate
  fastify.get('/leaderboard', async (req, reply) => {
    try {
      const topWallets = await db.select({
        walletAddress: whaleMovements.walletAddress,
        totalMovements: sql<number>`count(*)`,
      })
      .from(whaleMovements)
      .groupBy(whaleMovements.walletAddress)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

      return topWallets.map((w, i) => ({
        ...w,
        winRate: 0.85 - (i * 0.03), // Mock win rate
        label: i === 0 ? 'Whale Alpha' : `Smart Money #${i + 1}`,
        totalValue: Number(w.totalMovements) * 15000 // Mock total value
      }));
    } catch (error) {
      fastify.log.error(error);
      return [];
    }
  });
}
