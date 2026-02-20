import { db } from '../db/index.js';
import { agentLogs } from '../db/schema/index.js';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

export interface AgentContext {
  recentPrices: any[];
  topSpreads: any[];
  recentWhaleMovements: any[];
  currentAlpha: any | null;
}

export interface AgentOutput {
  signal?: 'bullish' | 'bearish' | 'neutral';
  confidence?: number;
  reasoning: string;
  target_market?: string;
  sentiment_score?: number;
  dominant_side?: string;
  regime?: 'low' | 'medium' | 'high' | 'critical';
  risk_score?: number;
  warnings?: string[];
  metadata?: any;
}

export abstract class BaseAgent {
  public lastRun: number = 0;
  public status: 'idle' | 'running' | 'error' = 'idle';
  public latencyMs: number = 0;

  constructor(
    public name: string,
    public model: string = 'gpt-4o-mini',
    public intervalMs: number = 30000
  ) {}

  abstract analyze(context: AgentContext): Promise<AgentOutput>;

  public async run(context: AgentContext) {
    const startTime = Date.now();
    this.status = 'running';
    try {
      const output = await this.analyze(context);
      this.latencyMs = Date.now() - startTime;
      this.lastRun = Date.now();
      this.status = 'idle';

      await this.publishLog(output);
      
      // Cache latest output in Redis
      await redis.set(`agent:cache:${this.name.toLowerCase()}`, JSON.stringify({
        ...output,
        ts: this.lastRun
      }), 'EX', Math.ceil(this.intervalMs / 500)); // TTL intervalMs * 2 (approx in s, oh wait, task says intervalMs * 2)
      // Task Constraint: "All agent outputs cached in Redis with TTL = agent intervalMs * 2"
      // intervalMs is in ms. Redis PX is for ms.
      await redis.pexpire(`agent:cache:${this.name.toLowerCase()}`, this.intervalMs * 2);

    } catch (err) {
      this.status = 'error';
      logger.error({ err, agent: this.name }, 'Agent execution failed');
      
      await this.publishLog({
        reasoning: `Error: ${err instanceof Error ? err.message : String(err)}`,
        metadata: { error: true }
      }, 'alert');
    }
  }

  protected async publishLog(output: AgentOutput, levelOverride?: 'info' | 'warn' | 'alert') {
    const level = levelOverride || (output.confidence && output.confidence > 0.8 ? 'alert' : (output.signal === 'neutral' ? 'info' : 'warn'));
    
    const logData = {
      agentName: this.name,
      level: level as any,
      message: output.reasoning.substring(0, 1024),
      metadata: output,
      createdAt: new Date(),
    };

    try {
      // 1. Write to DB
      await db.insert(agentLogs).values(logData);

      // 2. Publish to Redis channel
      await redis.publish('agents:logs', JSON.stringify(logData));
      
    } catch (err) {
      logger.error({ err, agent: this.name }, 'Failed to publish agent log');
    }
  }
}
