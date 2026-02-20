import { db } from '../db/index.js';
import { priceSnapshots, whaleMovements } from '../db/schema/index.js';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { FundamentalistAgent } from '../agents/fundamentalist.agent.js';
import { SentimentAgent } from '../agents/sentiment.agent.js';
import { RiskAgent } from '../agents/risk.agent.js';
import { AlphaAggregator } from '../agents/alpha-aggregator.js';
import { desc, eq } from 'drizzle-orm';

class AgentOrchestrator {
  private fundamentalist = new FundamentalistAgent();
  private sentiment = new SentimentAgent();
  private risk = new RiskAgent();
  private aggregator = new AlphaAggregator();

  private runningIntervals: Map<string, NodeJS.Timeout> = new Map();

  async start() {
    logger.info('Starting Agent Orchestrator...');

    this.startAgent(this.fundamentalist);
    this.startAgent(this.sentiment);
    this.startAgent(this.risk);
    
    // Aggregator runs every 10s
    const aggInterval = setInterval(() => this.aggregator.run(), this.aggregator.intervalMs);
    this.runningIntervals.set('aggregator', aggInterval);

    // Health Check / Watchdog
    setInterval(() => this.healthCheck(), 60000);
  }

  private startAgent(agent: any) {
    if (this.runningIntervals.has(agent.name)) {
      clearInterval(this.runningIntervals.get(agent.name)!);
    }

    const interval = setInterval(async () => {
      const context = await this.getAgentContext();
      await agent.run(context);
    }, agent.intervalMs);

    this.runningIntervals.set(agent.name, interval);
    logger.info({ agent: agent.name }, 'Agent started');
  }

  private async getAgentContext() {
    // 1. Recent Prices
    const recentPricesList = await db.query.priceSnapshots.findMany({
      limit: 50,
      orderBy: [desc(priceSnapshots.capturedAt)],
      with: { marketPair: true }
    });

    // 2. Top Spreads
    const topSpreads = await db.query.priceSnapshots.findMany({
        limit: 10,
        orderBy: [desc(priceSnapshots.spread)]
    });

    // 3. Recent Whales
    const whales = await db.query.whaleMovements.findMany({
        limit: 10,
        orderBy: [desc(whaleMovements.timestamp)]
    });

    // 4. Current Alpha
    const alphaStr = await redis.get('agent:cache:alpha');
    const currentAlpha = alphaStr ? JSON.parse(alphaStr) : null;

    return {
      recentPrices: recentPricesList,
      topSpreads,
      recentWhaleMovements: whales,
      currentAlpha
    };
  }

  private healthCheck() {
    // Restart agent if no output in 2x its intervalMs
    const agents = [this.fundamentalist, this.sentiment, this.risk];
    const now = Date.now();
    for (const agent of agents) {
      if (agent.lastRun > 0 && (now - agent.lastRun) > (agent.intervalMs * 2.5)) {
        logger.warn({ agent: agent.name }, 'Agent heartbeat failed, restarting...');
        this.startAgent(agent);
      }
    }
  }

  getStatus() {
    return [
      { name: this.fundamentalist.name, lastRun: this.fundamentalist.lastRun, status: this.fundamentalist.status, latencyMs: this.fundamentalist.latencyMs },
      { name: this.sentiment.name, lastRun: this.sentiment.lastRun, status: this.sentiment.status, latencyMs: this.sentiment.latencyMs },
      { name: this.risk.name, lastRun: this.risk.lastRun, status: this.risk.status, latencyMs: this.risk.latencyMs },
      { name: 'Aggregator', status: 'active' }
    ];
  }
}

export const orchestrator = new AgentOrchestrator();

export async function initAgentOrchestrator() {
  await orchestrator.start();
}
