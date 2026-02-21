import { Worker, Queue } from 'bullmq';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { db } from '../db/index.js';
import { priceSnapshots, marketPairs } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { PolymarketClient } from '../services/market/polymarket.js';
import { KalshiClient } from '../services/market/kalshi.js';
import { computeSpread } from '../services/market/spread-calculator.js';
import type { MarketPair } from '../db/schema/index.js';
import * as metrics from '../lib/metrics.js';

// ─── Clients (one instance per process) ─────────────────────────────────────

const polyClient = new PolymarketClient();
const kalshiClient = new KalshiClient();

// ─── Concurrency Limiter ────────────────────────────────────────────────────

async function pLimit(fns: (() => Promise<any>)[], concurrency: number) {
  const results: any[] = [];
  let idx = 0;

  async function next(): Promise<void> {
    const i = idx++;
    if (i >= fns.length) return;
    results[i] = await fns[i]();
    return next();
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, fns.length) }, () => next()));
  return results;
}

// ─── Metrics ────────────────────────────────────────────────────────────────

let syncCount = 0;
let errorCount = 0;
let totalSpread = 0;
let lastMetricsReset = Date.now();

function recordMetrics() {
  const elapsed = (Date.now() - lastMetricsReset) / 60_000; // minutes
  if (elapsed >= 1) {
    const perMin = Math.round(syncCount / elapsed);
    const avgSpread = syncCount > 0 ? (totalSpread / syncCount).toFixed(4) : '0';
    logger.info({ pricesSyncedPerMin: perMin, avgSpread, errors: errorCount }, 'Market sync metrics');
    syncCount = 0;
    errorCount = 0;
    totalSpread = 0;
    lastMetricsReset = Date.now();
  }
}

// ─── Core Sync Logic ────────────────────────────────────────────────────────

async function syncSingleMarket(market: MarketPair) {
  // Fetch from both providers independently — one failing doesn't block the other
  let polyPrice: number | null = null;
  let kalshiPrice: number | null = null;
  let polyVolume = 0;
  let kalshiVolume = 0;

  const syncStart = Date.now();

  const [polyResult, kalshiResult] = await Promise.allSettled([
    market.polymarketSlug ? polyClient.fetchMarketPrice(market.polymarketSlug) : Promise.resolve(null),
    market.kalshiTicker ? kalshiClient.fetchMarketPrice(market.kalshiTicker) : Promise.resolve(null),
  ]);

  metrics.price_sync_latency_ms.observe(Date.now() - syncStart);

  if (polyResult.status === 'fulfilled' && polyResult.value) {
    polyPrice = polyResult.value.yes;
    polyVolume = polyResult.value.volume24h;
  }

  if (kalshiResult.status === 'fulfilled' && kalshiResult.value) {
    kalshiPrice = kalshiResult.value.yes;
    kalshiVolume = kalshiResult.value.volume24h;
  }

  // Need at least one price to be useful
  if (polyPrice === null && kalshiPrice === null) return null;

  // Compute spread if both prices available
  const spreadData = (polyPrice !== null && kalshiPrice !== null)
    ? computeSpread(polyPrice, kalshiPrice, polyVolume, kalshiVolume)
    : null;

  if (spreadData) {
    metrics.avg_spread_pct.labels(market.symbol).set(spreadData.spreadPct);
  }

  // Cache in Redis (3s TTL — matches frontend StaleDataBadge threshold)
  const cachePayload = JSON.stringify({
    symbol: market.symbol,
    polyPrice,
    kalshiPrice,
    spread: spreadData,
    volume24h: polyVolume + kalshiVolume,
    timestamp: Date.now(),
  });

  await redis.set(`market:price:${market.symbol}`, cachePayload, 'EX', 3);

  // Publish real-time update
  await redis.publish(`market:prices:${market.symbol}`, cachePayload);

    // Arb signal detection
    if (spreadData?.arbSignal) {
      metrics.arb_opportunities_detected_total.labels(market.symbol).inc();
      await redis.publish(`market:arb:${market.symbol}`, JSON.stringify({
        symbol: market.symbol,
        ...spreadData,
        timestamp: Date.now(),
      }));

    // Maintain sorted set of arb opportunities (score = spreadPct)
    await redis.zadd('markets:arb_ranking', spreadData.spreadPct, market.symbol);
    await redis.expire('markets:arb_ranking', 10);
  }

  // Track metrics
  syncCount++;
  if (spreadData) totalSpread += spreadData.spread;

  return {
    marketPairId: market.id,
    polymarketPrice: polyPrice?.toFixed(4) ?? null,
    kalshiPrice: kalshiPrice?.toFixed(4) ?? null,
    spread: spreadData?.spread.toFixed(4) ?? null,
    volume24h: (polyVolume + kalshiVolume).toFixed(2),
    capturedAt: new Date(),
  };
}

// ─── BullMQ Queue + Worker ──────────────────────────────────────────────────

export const marketSyncQueue = new Queue('marketSync', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

export const marketSyncWorker = new Worker(
  'marketSync',
  async () => {
    try {
      // Fetch all active pairs
      const markets = await db.query.marketPairs.findMany({
        where: (m, { eq: e }) => e(m.isActive, true),
      });

      if (markets.length === 0) return;

      // Batch sync with concurrency limit of 50
      const fns = markets.map((m) => () => syncSingleMarket(m));
      const results = await pLimit(fns, 50);

      const validSnapshots = results.filter((s): s is NonNullable<typeof s> => s !== null);

      // Batch insert into price_snapshots
      if (validSnapshots.length > 0) {
        await db.insert(priceSnapshots).values(validSnapshots);

        // Update last_price_at on market_pairs
        const now = new Date();
        await Promise.all(
          validSnapshots.map((s) =>
            db.update(marketPairs)
              .set({ lastPriceAt: now })
              .where(eq(marketPairs.id, s.marketPairId))
          ),
        );
      }

      recordMetrics();
    } catch (err) {
      errorCount++;
      logger.error({ err }, 'Market sync job failed');
      // Never crash — swallow and let BullMQ retry
    }
  },
  { connection: redis, concurrency: 1 },
);

// ─── Init ───────────────────────────────────────────────────────────────────

export async function initMarketSync(): Promise<void> {
  // Clear stale repeatable jobs on restart
  const existing = await marketSyncQueue.getRepeatableJobs();
  for (const job of existing) {
    await marketSyncQueue.removeRepeatableByKey(job.key);
  }

  await marketSyncQueue.add('syncMarketPrices', {}, {
    repeat: { every: 1000 }, // 1s interval
  });

  logger.info('Market sync job initialized (1s interval)');
}
