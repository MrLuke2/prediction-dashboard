import { FastifyInstance, FastifyRequest } from 'fastify';
import { redis } from '../../lib/redis.js';
import { db } from '../../db/index.js';
import { marketPairs, priceSnapshots } from '../../db/schema/index.js';
import { eq, desc, gte, and, sql } from 'drizzle-orm';
import { computeSpread } from '../../services/market/spread-calculator.js';

export default async function marketRoutes(fastify: FastifyInstance) {

  // ─── GET /markets ───────────────────────────────────────────────────
  // List all active pairs with latest spread + arbSignal
  // Redis cache: 5s
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Markets'],
        summary: 'List all active market pairs with latest spread data',
      },
    },
    async (request, reply) => {
      const cacheKey = 'markets:list';
      const cached = await redis.get(cacheKey);
      if (cached) return reply.send(JSON.parse(cached));

      const activeMarkets = await db.query.marketPairs.findMany({
        where: eq(marketPairs.isActive, true),
      });

      // Enrich each market with latest cached price data
      const enriched = await Promise.all(
        activeMarkets.map(async (m) => {
          const priceData = await redis.get(`market:price:${m.symbol}`);
          return {
            ...m,
            latestPrice: priceData ? JSON.parse(priceData) : null,
          };
        }),
      );

      await redis.set(cacheKey, JSON.stringify(enriched), 'EX', 5);
      return reply.send(enriched);
    },
  );

  // ─── GET /markets/top-arb ───────────────────────────────────────────
  // Top 5 arb opportunities right now (sorted by spreadPct DESC)
  // Redis cache: 1s
  // NOTE: Registered before /:symbol to avoid route collision
  fastify.get(
    '/top-arb',
    {
      schema: {
        tags: ['Markets'],
        summary: 'Top 5 arbitrage opportunities sorted by spread percentage',
      },
    },
    async (request, reply) => {
      const cacheKey = 'markets:top-arb';
      const cached = await redis.get(cacheKey);
      if (cached) return reply.send(JSON.parse(cached));

      // Pull from sorted set maintained by sync job (top 5 by spreadPct)
      const topSymbols = await redis.zrevrange('markets:arb_ranking', 0, 4, 'WITHSCORES');

      const results: any[] = [];
      for (let i = 0; i < topSymbols.length; i += 2) {
        const symbol = topSymbols[i];
        const spreadPct = parseFloat(topSymbols[i + 1]);
        const priceData = await redis.get(`market:price:${symbol}`);

        results.push({
          symbol,
          spreadPct,
          ...(priceData ? JSON.parse(priceData) : {}),
        });
      }

      // Fallback: if sorted set is empty, query DB for recent high-spread snapshots
      if (results.length === 0) {
        const tenSecondsAgo = new Date(Date.now() - 10_000);
        const dbResults = await db
          .select({
            marketPairId: priceSnapshots.marketPairId,
            spread: priceSnapshots.spread,
            polymarketPrice: priceSnapshots.polymarketPrice,
            kalshiPrice: priceSnapshots.kalshiPrice,
            volume24h: priceSnapshots.volume24h,
            capturedAt: priceSnapshots.capturedAt,
            symbol: marketPairs.symbol,
          })
          .from(priceSnapshots)
          .innerJoin(marketPairs, eq(priceSnapshots.marketPairId, marketPairs.id))
          .where(gte(priceSnapshots.capturedAt, tenSecondsAgo))
          .orderBy(desc(priceSnapshots.spread))
          .limit(5);

        for (const row of dbResults) {
          results.push({
            symbol: row.symbol,
            spread: parseFloat(row.spread ?? '0'),
            polyPrice: parseFloat(row.polymarketPrice ?? '0'),
            kalshiPrice: parseFloat(row.kalshiPrice ?? '0'),
            volume24h: parseFloat(row.volume24h ?? '0'),
            timestamp: row.capturedAt.getTime(),
          });
        }
      }

      await redis.set(cacheKey, JSON.stringify(results), 'EX', 1);
      return reply.send(results);
    },
  );

  // ─── GET /markets/:symbol ───────────────────────────────────────────
  // Single market + 24h price history (100 snapshots)
  // Redis cache: 2s
  fastify.get(
    '/:symbol',
    {
      schema: {
        tags: ['Markets'],
        summary: 'Get a single market with 24h price history',
      },
    },
    async (request, reply) => {
      const { symbol } = request.params as { symbol: string };

      const cacheKey = `markets:detail:${symbol}`;
      const cached = await redis.get(cacheKey);
      if (cached) return reply.send(JSON.parse(cached));

      const market = await db.query.marketPairs.findFirst({
        where: eq(marketPairs.symbol, symbol),
      });

      if (!market) return reply.code(404).send({ error: 'Market not found' });

      // Last 100 snapshots (24h coverage depends on capture frequency)
      const history = await db
        .select()
        .from(priceSnapshots)
        .where(eq(priceSnapshots.marketPairId, market.id))
        .orderBy(desc(priceSnapshots.capturedAt))
        .limit(100);

      const result = { market, history };
      await redis.set(cacheKey, JSON.stringify(result, bigintReplacer), 'EX', 2);
      return reply.send(result);
    },
  );

  // ─── GET /markets/:symbol/spread ────────────────────────────────────
  // Latest spread computation (real-time, no cache)
  fastify.get(
    '/:symbol/spread',
    {
      schema: {
        tags: ['Markets'],
        summary: 'Get real-time spread for a market (no cache)',
      },
    },
    async (request, reply) => {
      const { symbol } = request.params as { symbol: string };

      // Try Redis first for freshest data
      const cached = await redis.get(`market:price:${symbol}`);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.spread) return reply.send(data.spread);

        // If no precomputed spread, compute from prices
        if (data.polyPrice != null && data.kalshiPrice != null) {
          const spread = computeSpread(data.polyPrice, data.kalshiPrice);
          return reply.send(spread);
        }
      }

      // Fallback to DB
      const market = await db.query.marketPairs.findFirst({
        where: eq(marketPairs.symbol, symbol),
      });
      if (!market) return reply.code(404).send({ error: 'Market not found' });

      const latest = await db
        .select()
        .from(priceSnapshots)
        .where(eq(priceSnapshots.marketPairId, market.id))
        .orderBy(desc(priceSnapshots.capturedAt))
        .limit(1);

      if (latest.length === 0) {
        return reply.send({ spread: 0, spreadPct: 0, direction: 'neutral', arbSignal: false, confidence: 0 });
      }

      const snap = latest[0];
      const pPrice = parseFloat(snap.polymarketPrice ?? '0');
      const kPrice = parseFloat(snap.kalshiPrice ?? '0');

      if (pPrice > 0 && kPrice > 0) {
        return reply.send(computeSpread(pPrice, kPrice));
      }

      return reply.send({ spread: parseFloat(snap.spread ?? '0'), spreadPct: 0, direction: 'neutral', arbSignal: false, confidence: 0 });
    },
  );

  // ─── GET /markets/:symbol/history ───────────────────────────────────
  // Price history with pagination
  // ?interval=1m|5m|1h&limit=100
  fastify.get(
    '/:symbol/history',
    {
      schema: {
        tags: ['Markets'],
        summary: 'Get price history for a market with optional interval aggregation',
        querystring: {
          type: 'object',
          properties: {
            interval: { type: 'string', enum: ['1m', '5m', '1h'], default: '1m' },
            limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      const { symbol } = request.params as { symbol: string };
      const { interval = '1m', limit = 100, offset = 0 } = request.query as {
        interval?: string;
        limit?: number;
        offset?: number;
      };

      const market = await db.query.marketPairs.findFirst({
        where: eq(marketPairs.symbol, symbol),
      });
      if (!market) return reply.code(404).send({ error: 'Market not found' });

      // Map interval to seconds for time_bucket (or manual grouping)
      const intervalSeconds = interval === '1h' ? 3600 : interval === '5m' ? 300 : 60;

      // For simplicity, fetch raw data and let client aggregate,
      // OR use PostgreSQL date_trunc for server-side downsampling
      const bucketSql = interval === '1h'
        ? sql`date_trunc('hour', ${priceSnapshots.capturedAt})`
        : interval === '5m'
          ? sql`date_trunc('hour', ${priceSnapshots.capturedAt}) + (EXTRACT(minute FROM ${priceSnapshots.capturedAt})::int / 5 * interval '5 minutes')`
          : sql`date_trunc('minute', ${priceSnapshots.capturedAt})`;

      const rows = await db
        .select({
          bucket: bucketSql.as('bucket'),
          avgPoly: sql<string>`AVG(CAST(${priceSnapshots.polymarketPrice} AS NUMERIC))`.as('avg_poly'),
          avgKalshi: sql<string>`AVG(CAST(${priceSnapshots.kalshiPrice} AS NUMERIC))`.as('avg_kalshi'),
          avgSpread: sql<string>`AVG(CAST(${priceSnapshots.spread} AS NUMERIC))`.as('avg_spread'),
          maxVolume: sql<string>`MAX(CAST(${priceSnapshots.volume24h} AS NUMERIC))`.as('max_volume'),
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(priceSnapshots)
        .where(eq(priceSnapshots.marketPairId, market.id))
        .groupBy(sql`bucket`)
        .orderBy(desc(sql`bucket`))
        .limit(limit)
        .offset(offset);

      return reply.send({
        symbol,
        interval,
        data: rows.map((r) => ({
          timestamp: r.bucket,
          polymarketPrice: r.avgPoly ? parseFloat(r.avgPoly) : null,
          kalshiPrice: r.avgKalshi ? parseFloat(r.avgKalshi) : null,
          spread: r.avgSpread ? parseFloat(r.avgSpread) : null,
          volume24h: r.maxVolume ? parseFloat(r.maxVolume) : null,
          sampleCount: r.count,
        })),
        pagination: { limit, offset },
      });
    },
  );
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}
