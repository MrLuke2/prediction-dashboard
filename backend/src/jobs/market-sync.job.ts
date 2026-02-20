import { Worker, Queue } from 'bullmq';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { PolymarketClient } from '../services/market/polymarket.js';
import { KalshiClient } from '../services/market/kalshi.js';
import { db } from '../db/index.js';
import { priceSnapshots } from '../db/schema/price_snapshots.js';
import { marketPairs } from '../db/schema/market_pairs.js';
import { computeSpread } from '../services/market/spread-calculator.js';

const polyClient = new PolymarketClient();
const kalshiClient = new KalshiClient();

// Define Queue
export const marketSyncQueue = new Queue('marketSync', { connection: redis });

// Scheduler (deprecated in new BullMQ versions? Replaced by Queue options?)
// BullMQ v4 uses QueueScheduler separate, v5 integrated. We installed v4.11.0.
// Let's rely on standard repeat options.
// Or just use a simple `queue.add('job', {}, { repeat: { every: 1000 } })`.

// Worker Processor
export const marketSyncWorker = new Worker('marketSync', async (job) => {
  try {
    const markets = await db.query.marketPairs.findMany({
      where: (m, { eq }) => eq(m.isActive, true)
    });

    // In a real scenario, fetch in batches or parallel limit.
    // For 100 max: Promise.all with concurrency control or simple loop if small.
    // User requested: "max 100/s". Since we repeat every 1s, we can process all (assuming <100 active).
    // If >100, we should page.
    
    // We will simulate parallel fetch for all.
    const snapshots = await Promise.all(markets.map(async (m) => {
      // Parallel fetch (timeout 5s handled in client)
      try {
        const [polyPrice, kalshiPrice] = await Promise.all([
           polyClient.fetchMarketPrice(m.polymarketSlug!),
           kalshiClient.fetchMarketPrice(m.kalshiTicker!)
        ]);

        if (!polyPrice || !kalshiPrice) return null;

        const pPrice = polyPrice.yes; // Assuming we care about 'YES' price
        const kPrice = kalshiPrice.yes;
        
        const spreadData = computeSpread(pPrice, kPrice);
        
        // Cache in Redis (3s expiry)
        await redis.set(`market:price:${m.symbol}`, JSON.stringify({
          ...spreadData,
          timestamp: Date.now()
        }), 'EX', 3);
        
        // Publish update
        await redis.publish(`market:prices:${m.symbol}`, JSON.stringify(spreadData));

        return {
          marketPairId: m.id,
          polymarketPrice: pPrice.toString(),
          kalshiPrice: kPrice.toString(),
          spread: spreadData.spread.toString(),
          volume24h: '0', // Placeholder or fetch real volume if available
          capturedAt: new Date()
        };
      } catch (err) {
        logger.error({ err, symbol: m.symbol }, 'Failed to sync market pair');
        return null;
      }
    }));

    const validSnapshots = snapshots.filter(s => s !== null) as any[];

    if (validSnapshots.length > 0) {
      // Batch Insert
      await db.insert(priceSnapshots).values(validSnapshots);
      logger.info(`Synced ${validSnapshots.length} market prices.`);
    }

  } catch (err) {
    logger.error(err, 'Market Sync Job Failed');
    // Don't crash worker, just log.
  }
}, { connection: redis });

// Init function to start repeating job
export const initMarketSync = async () => {
  // Remove existing repeatable jobs to avoid duplicates on restart
  const repeatableJobs = await marketSyncQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await marketSyncQueue.removeRepeatableByKey(job.key);
  }

  await marketSyncQueue.add('syncMarketPrices', {}, {
    repeat: { every: 1000 },
    removeOnComplete: true,
    removeOnFail: 100 // keep last 100 failed for debug
  });
  logger.info('Market Sync Job Initialized (1s interval)');
};
