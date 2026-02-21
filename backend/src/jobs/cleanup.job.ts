import { db } from '../db/index.js';
import { priceSnapshots, agentLogs, aiUsageMetrics } from '../db/schema/index.js';
import { lt, sql } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { redis, redisConnection } from '../lib/redis.js';
import { Worker, Queue } from 'bullmq';

export const cleanupQueue = new Queue('cleanup', { connection: redisConnection, });

export async function runCleanupJob() {
  logger.info('Starting daily cleanup job...');
  const now = new Date();
  const summary = {
    deletedPrices: 0,
    deletedLogs: 0,
    deletedAiUsage: 0,
    vacuum: false
  };

  // 1. Delete price_snapshots > 90 days
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const deletedPricesRes = await db.delete(priceSnapshots).where(lt(priceSnapshots.capturedAt, ninetyDaysAgo)).returning();
  summary.deletedPrices = deletedPricesRes.length;
  logger.info({ count: summary.deletedPrices }, 'Cleaned up old price snapshots');

  // 2. Archive/Delete agent_logs > 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const deletedLogsRes = await db.delete(agentLogs).where(lt(agentLogs.createdAt, thirtyDaysAgo)).returning();
  summary.deletedLogs = deletedLogsRes.length;
  logger.info({ count: summary.deletedLogs }, 'Cleaned up old agent logs');

  // 3. Archive/Delete ai_usage_metrics > 60 days
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const deletedAiUsageRes = await db.delete(aiUsageMetrics).where(lt(aiUsageMetrics.createdAt, sixtyDaysAgo)).returning();
  summary.deletedAiUsage = deletedAiUsageRes.length;
  logger.info({ count: summary.deletedAiUsage }, 'Cleaned up old AI usage metrics');

  // 5. PostgreSQL VACUUM ANALYZE
  try {
    await db.execute(sql`VACUUM ANALYZE`);
    summary.vacuum = true;
    logger.info('PostgreSQL VACUUM ANALYZE completed');
  } catch (err) {
    logger.error({ err }, 'VACUUM ANALYZE failed');
  }

  // Log cleanup summary to agent_logs
  await db.insert(agentLogs).values({
    agentName: 'System',
    level: 'info',
    message: 'Daily cleanup job completed',
    metadata: summary,
    provider: 'system',
    model: 'cleanup-service'
  });

  logger.info('Daily cleanup job completed successfully');
}

export const cleanupWorker = new Worker(
  'cleanup',
  async () => {
    await runCleanupJob();
  },
  { connection: redisConnection, concurrency: 5 },
);

export async function initCleanupJob() {
  const existing = await cleanupQueue.getRepeatableJobs();
  for (const job of existing) {
    await cleanupQueue.removeRepeatableByKey(job.key);
  }

  // 3 AM UTC: cron '0 3 * * *'
  await cleanupQueue.add('dailyCleanup', {}, {
    repeat: { pattern: '0 3 * * *' }
  });

  logger.info('Cleanup job initialized (3 AM UTC daily)');
}
