import { db } from '../../db/index.js';
import { aiUsageMetrics } from '../../db/schema/index.js';
import { config } from '../../config.js';
import { sql, eq, and, gte } from 'drizzle-orm';
import { AIBudgetExceededError } from './types.js';
import type { AIProviderId } from './types.js';
import { logger } from '../../lib/logger.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayStart(): Date {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

// ─── Cost Tracker ───────────────────────────────────────────────────────────

/**
 * Get total AI cost for today (optionally for a specific user).
 */
export async function getDailyCost(userId?: string): Promise<number> {
  const todayStart = getTodayStart();

  const conditions = [gte(aiUsageMetrics.createdAt, todayStart)];
  if (userId) {
    conditions.push(eq(aiUsageMetrics.userId, userId));
  }

  const result = await db
    .select({
      total: sql<string>`COALESCE(SUM(${aiUsageMetrics.costUsd}), 0)`,
    })
    .from(aiUsageMetrics)
    .where(and(...conditions));

  return parseFloat(result[0]?.total ?? '0');
}

/**
 * Get today's cost broken down by provider.
 */
export async function getDailyCostByProvider(): Promise<Record<AIProviderId, number>> {
  const todayStart = getTodayStart();

  const result = await db
    .select({
      provider: aiUsageMetrics.provider,
      total: sql<string>`COALESCE(SUM(${aiUsageMetrics.costUsd}), 0)`,
    })
    .from(aiUsageMetrics)
    .where(gte(aiUsageMetrics.createdAt, todayStart))
    .groupBy(aiUsageMetrics.provider);

  const breakdown: Record<AIProviderId, number> = {
    anthropic: 0,
    openai: 0,
    gemini: 0,
  };

  for (const row of result) {
    const provider = row.provider as AIProviderId;
    breakdown[provider] = parseFloat(row.total ?? '0');
  }

  return breakdown;
}

/**
 * Check if the daily budget has been exceeded.
 * Throws AIBudgetExceededError if limit reached.
 */
export async function enforceBudgetLimit(userId?: string): Promise<void> {
  const limit = config.DAILY_COST_LIMIT_USD;
  const dailyCost = await getDailyCost(userId);

  if (dailyCost >= limit) {
    logger.warn(
      { dailyCost, limit, userId },
      'Daily AI budget exceeded'
    );
    throw new AIBudgetExceededError(dailyCost, limit);
  }
}

/**
 * Get usage summary for the /ai/usage endpoint.
 */
export async function getUsageSummary(userId?: string) {
  const limit = config.DAILY_COST_LIMIT_USD;
  const [total, byProvider] = await Promise.all([
    getDailyCost(userId),
    getDailyCostByProvider(),
  ]);

  return {
    today: {
      total: Math.round(total * 10000) / 10000, // 4 decimal places
      byProvider,
    },
    limit,
    percentUsed: Math.min(100, Math.round((total / limit) * 10000) / 100),
  };
}
