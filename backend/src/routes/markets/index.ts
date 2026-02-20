import { FastifyInstance } from 'fastify';
import { redis } from '../../lib/redis.js';
import { marketSyncQueue } from '../../jobs/market-sync.job.js';
import { db } from '../../db/index.js';
import { marketPairs } from '../../db/schema/market_pairs.js';
import { eq, desc } from 'drizzle-orm';
import { priceSnapshots } from '../../db/schema/price_snapshots.js';

export default async function marketRoutes(fastify: FastifyInstance) {
  
  // GET /markets - List all active pairs
  fastify.get('/', async (req, reply) => {
    // Cache for 5s
    const cacheKey = 'markets:list';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const activeMarkets = await db.query.marketPairs.findMany({
      where: eq(marketPairs.isActive, true)
    });

    await redis.set(cacheKey, JSON.stringify(activeMarkets), 'EX', 5);
    return activeMarkets;
  });

  // GET /markets/:symbol
  fastify.get('/:symbol', async (req, reply) => {
    const { symbol } = req.params as { symbol: string };
    
    const market = await db.query.marketPairs.findFirst({
        where: eq(marketPairs.symbol, symbol)
    });

    if (!market) return reply.code(404).send({ error: 'Market not found' });

    // Assuming we want last 24h of prices? Or just latest?
    // User task: "single market with 24h price history"
    // Fetch from price_snapshots
    const history = await db.query.priceSnapshots.findMany({
        where: eq(priceSnapshots.marketPairId, market.id),
        orderBy: [desc(priceSnapshots.capturedAt)],
        limit: 1440 // 1 per min approx? Or 1 per sec is way too much.
        // If we store every 1s, 24h = 86400 points. Too big.
        // We should downsample or limit. Let's limit to last 1000 for now or aggregate.
        // For simplicity, just last 100 points.
    });

    return { market, history };
  });

  // GET /markets/:symbol/spread
  fastify.get('/:symbol/spread', async (req, reply) => {
    const { symbol } = req.params as { symbol: string };
    // Get latest from Redis cache (real-time)
    const cached = await redis.get(`market:price:${symbol}`);
    if (cached) return JSON.parse(cached);
    
    // Fallback to DB latest
    const market = await db.query.marketPairs.findFirst({
        where: eq(marketPairs.symbol, symbol)
    });
    if (!market) return reply.code(404).send({ error: 'Market not found' });

    const latest = await db.query.priceSnapshots.findFirst({
        where: eq(priceSnapshots.marketPairId, market.id),
        orderBy: [desc(priceSnapshots.capturedAt)]
    });

    if (!latest) return { spread: 0, spreadPct: 0, direction: 'neutral' };

    return latest;
  });

  // GET /markets/top-arb
  fastify.get('/top-arb', async (req, reply) => {
    // Scan redis keys or maintain a sorted set in worker.
    // Worker optimization: maintain `market:top-arb` sorted set by spreadPct.
    // For now, simple approach: check cached market list and their spreads.
    // Or just query DB for latest snapshots with high spread? DB query is safer for "right now".
    // "top 5 arb opportunities right now"
    
    // Let's use a specialized Redis Sorted Set `markets:arb_ranking` updated by worker?
    // For MVP, just query DB recent snapshots.
    
    // Actually, worker is better place to update this. I'll add logic to worker if I can edit it again.
    // Since I can't edit previous file in same turn easily without tool overhead, 
    // I'll implementing a DB query here:
    
    /*
    SELECT * from price_snapshots 
    WHERE captured_at > NOW() - INTERVAL '10 seconds'
    ORDER BY spread DESC
    LIMIT 5
    */
    // Drizzle doesn't have easy "NOW - interval", so JS date.
    
    const tenSecondsAgo = new Date(Date.now() - 10000);
    
    const topArbs = await db.query.priceSnapshots.findMany({
        where: (ps, { gt }) => gt(ps.capturedAt, tenSecondsAgo),
        orderBy: [desc(priceSnapshots.spread)],
        limit: 5,
        with: {
            marketPair: true // Join to get symbol
        }
    });

    return topArbs;
  });
}
