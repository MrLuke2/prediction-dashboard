import { db } from '../db/index.js';
import { priceSnapshots, whaleMovements } from '../db/schema/index.js';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { FundamentalistAgent } from '../agents/fundamentalist.agent.js';
import { SentimentAgent } from '../agents/sentiment.agent.js';
import { RiskAgent } from '../agents/risk.agent.js';
import { AlphaAggregator } from '../agents/alpha-aggregator.js';
import { getDailyCost } from '../services/ai/costTracker.js';
import { desc } from 'drizzle-orm';
import type { AgentContext } from '../agents/base-agent.js';

// ─── Agent Health Entry ─────────────────────────────────────────────────────

interface AgentHealth {
  name: string;
  status: 'active' | 'degraded' | 'offline';
  lastRun: number;
  avgLatencyMs: number;
  errorCount: number;
  currentProvider: string;
  currentModel: string;
}

// ─── Orchestrator ───────────────────────────────────────────────────────────

class AgentOrchestrator {
  private fundamentalist = new FundamentalistAgent();
  private sentiment = new SentimentAgent();
  private risk = new RiskAgent();
  private aggregator = new AlphaAggregator();

  private agentTimers = new Map<string, ReturnType<typeof setInterval>>();
  private healthTimer: ReturnType<typeof setInterval> | null = null;

  async start(): Promise<void> {
    logger.info('Starting Agent Orchestrator...');

    this.startAgent(this.fundamentalist);
    this.startAgent(this.sentiment);
    this.startAgent(this.risk);
    this.aggregator.start();

    // Health monitor every 60s
    this.healthTimer = setInterval(() => this.healthCheck(), 60_000);

    logger.info('All agents started');
  }

  stop(): void {
    for (const [name, timer] of this.agentTimers) {
      clearInterval(timer);
    }
    this.agentTimers.clear();
    this.aggregator.stop();
    if (this.healthTimer) clearInterval(this.healthTimer);
  }

  private startAgent(agent: { name: string; intervalMs: number; tick: (ctx?: AgentContext) => Promise<any> }): void {
    // Clear existing timer
    const existing = this.agentTimers.get(agent.name);
    if (existing) clearInterval(existing);

    const timer = setInterval(async () => {
      try {
        const ctx = await this.getAgentContext();
        await agent.tick(ctx);
      } catch (err) {
        logger.error({ err, agent: agent.name }, 'Agent tick failed');
      }
    }, agent.intervalMs);

    this.agentTimers.set(agent.name, timer);
    logger.info({ agent: agent.name, intervalMs: agent.intervalMs }, 'Agent scheduled');
  }

  private async getAgentContext(): Promise<AgentContext> {
    const [recentPricesList, topSpreadsList, whales, alphaStr] = await Promise.all([
      db.query.priceSnapshots.findMany({
        limit: 20,
        orderBy: [desc(priceSnapshots.capturedAt)],
      }).catch(() => []),
      db.query.priceSnapshots.findMany({
        limit: 5,
        orderBy: [desc(priceSnapshots.spread)],
      }).catch(() => []),
      db.query.whaleMovements.findMany({
        limit: 10,
        orderBy: [desc(whaleMovements.detectedAt)],
      }).catch(() => []),
      redis.get('agent:cache:alpha').catch(() => null),
    ]);

    const currentAlpha = alphaStr ? JSON.parse(alphaStr) : null;

    // Build a brief market conditions summary
    const avgSpread = topSpreadsList.length > 0
      ? (topSpreadsList.reduce((sum, s) => sum + parseFloat(s.spread ?? '0'), 0) / topSpreadsList.length).toFixed(4)
      : '0';
    const whaleCount = whales.length;
    const marketConditions = `${recentPricesList.length} recent snapshots, avg top spread ${avgSpread}, ${whaleCount} recent whale movements`;

    return {
      recentPrices: recentPricesList,
      topSpreads: topSpreadsList,
      recentWhaleMovements: whales,
      currentAlpha,
      marketConditions,
    };
  }

  // ─── Health Monitor ─────────────────────────────────────────────────────

  private healthCheck(): void {
    const agents = [this.fundamentalist, this.sentiment, this.risk];
    const now = Date.now();

    for (const agent of agents) {
      if (agent.lastRun > 0 && (now - agent.lastRun) > agent.intervalMs * 2) {
        logger.warn({ agent: agent.name, lastRun: agent.lastRun, intervalMs: agent.intervalMs }, 'Agent heartbeat failed, restarting');
        this.startAgent(agent);
      }
    }
  }

  // ─── Status ─────────────────────────────────────────────────────────────

  async getStatus(): Promise<{
    agents: AgentHealth[];
    alphaMetric: any;
    dailyAiCost: number;
  }> {
    const agents = [this.fundamentalist, this.sentiment, this.risk];
    const now = Date.now();

    const agentStatuses: AgentHealth[] = agents.map(a => {
      let status: AgentHealth['status'] = 'active';
      if (a.status === 'error' || a.errorCount > 5) status = 'degraded';
      if (a.lastRun === 0) status = 'offline';
      if (a.lastRun > 0 && (now - a.lastRun) > a.intervalMs * 2.5) status = 'offline';

      return {
        name: a.name,
        status,
        lastRun: a.lastRun,
        avgLatencyMs: a.avgLatencyMs,
        errorCount: a.errorCount,
        currentProvider: a.currentProvider,
        currentModel: a.currentModel,
      };
    });

    // Add aggregator
    agentStatuses.push({
      name: this.aggregator.name,
      status: this.aggregator.status === 'error' ? 'degraded'
            : this.aggregator.lastRun === 0 ? 'offline' : 'active',
      lastRun: this.aggregator.lastRun,
      avgLatencyMs: 0,
      errorCount: 0,
      currentProvider: 'system',
      currentModel: 'aggregation',
    });

    const [alphaStr, dailyAiCost] = await Promise.all([
      redis.get('agent:cache:alpha').catch(() => null),
      getDailyCost().catch(() => 0),
    ]);

    return {
      agents: agentStatuses,
      alphaMetric: alphaStr ? JSON.parse(alphaStr) : null,
      dailyAiCost,
    };
  }
}

export const orchestrator = new AgentOrchestrator();

export async function initAgentOrchestrator(): Promise<void> {
  await orchestrator.start();
}
