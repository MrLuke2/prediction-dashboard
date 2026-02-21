import { Worker, Queue } from 'bullmq';
import { redis, redisConnection } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { whaleDetector } from '../services/blockchain/whale-detector.js';

export const whaleSyncQueue = new Queue('whaleSync', { 
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  }
});

export const whaleSyncWorker = new Worker('whaleSync', async (job) => {
  const { blockNumber } = job.data as { blockNumber: number };
  
  try {
    await whaleDetector.processBlock(blockNumber);
    
    // Metrics
    await redis.incr('metrics:whale:blocks_processed');
  } catch (err) {
    logger.error({ err, blockNumber }, 'Failed to scan block for whales');
    await redis.incr('metrics:whale:errors');
    throw err; // Re-throw for BullMQ retry
  }
},
  { connection: redisConnection, concurrency: 5 },
);
export const initWhaleSync = async () => {
  logger.info('Initializing Whale Sync Orchestrator...');
  
  // Start orchestrator loop
  setInterval(async () => {
    try {
      const lastAddedKey = 'whale:last_added_block';
      const lastAddedStr = await redis.get(lastAddedKey);
      const currentBlock = await whaleDetector.getLatestBlockNumber();
      
      let start = lastAddedStr ? parseInt(lastAddedStr) : currentBlock - 1;

      // Avoid huge catchups if offline for long (limit to 20 blocks)
      if (currentBlock - start > 20) {
        start = currentBlock - 20;
      }

      for (let i = start + 1; i <= currentBlock; i++) {
        await whaleSyncQueue.add('scanBlock', { blockNumber: i }, { 
          jobId: `whale-block-${i}`,
          priority: 1 
        });
        await redis.set(lastAddedKey, i.toString());
        await redis.incr('metrics:whale:blocks_queued');
      }
    } catch (err) {
      logger.error(err, 'Whale Orchestrator Loop Error');
    }
  }, 2000);
};
