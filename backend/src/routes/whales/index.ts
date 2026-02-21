import { FastifyInstance } from 'fastify';
import { db } from '../../db/index.js';
import { whaleMovements } from '../../db/schema/index.js';
import { desc, eq, sql } from 'drizzle-orm';
import { redis } from '../../lib/redis.js';

export default async function whaleRoutes(fastify: FastifyInstance) {
  
  // GET /whales/recent — last 50 movements (cache 10s)
  fastify.get('/recent', async () => {
    const cacheKey = 'whales:recent';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const movements = await db.query.whaleMovements.findMany({
      orderBy: [desc(whaleMovements.detectedAt)],
      limit: 50
    });

    await redis.set(cacheKey, JSON.stringify(movements), 'EX', 10);
    return movements;
  });

  // GET /whales/:address — wallet history + win rate
  fastify.get('/:address', async (req, reply) => {
    const { address } = req.params as { address: string };
    
    const history = await db.query.whaleMovements.findMany({
      where: eq(whaleMovements.walletAddress, address),
      orderBy: [desc(whaleMovements.detectedAt)],
      limit: 100
    });

    if (!history.length) {
      return reply.code(404).send({ error: 'Whale address not found in history' });
    }

    // Mock win rate calculation for demo
    const winRate = 0.6 + (Math.random() * 0.2);

    return { 
      address, 
      history,
      winRate: Math.round(winRate * 100) / 100
    };
  });

  // GET /whales/leaderboard — top 10 by win rate
  fastify.get('/leaderboard', async () => {
    const topWallets = await db.select({
      walletAddress: whaleMovements.walletAddress,
      label: whaleMovements.label,
      totalMovements: sql<number>`count(*)`,
    })
    .from(whaleMovements)
    .groupBy(whaleMovements.walletAddress, whaleMovements.label)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

    return topWallets.map((w, i) => ({
      ...w,
      winRate: 0.85 - (i * 0.02), // Mock win rate
      rank: i + 1
    }));
  });
}
