import { z } from 'zod';
import { db } from '../db/index.js';
import { agentLogs, alphaMetrics } from '../db/schema/index.js';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { config } from '../config.js';
import { aiRouter } from '../services/ai/router.js';
import { registry } from '../ws/clientState.js';
import type { AIProviderId, AIProviderSelection, AIResponse } from '../services/ai/types.js';
import type { PriceSnapshot } from '../db/schema/price_snapshots.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AgentContext {
  recentPrices: PriceSnapshot[];
  topSpreads: any[];
  recentWhaleMovements: any[];
  currentAlpha: any | null;
  marketConditions: string;
}

export interface AgentOutput {
  signal: string;
  confidence: number;
  reasoning: string;
  targetMarket?: string;
  provider: AIProviderId;
  model: string;
}

// ─── BaseAgent ──────────────────────────────────────────────────────────────

export abstract class BaseAgent {
  public lastRun = 0;
  public status: 'idle' | 'running' | 'error' = 'idle';
  public latencyMs = 0;
  public errorCount = 0;
  public totalLatency = 0;
  public runCount = 0;
  public currentProvider: AIProviderId;
  public currentModel: string;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    public name: string,
    public intervalMs: number,
  ) {
    this.currentProvider = config.DEFAULT_AI_PROVIDER as AIProviderId;
    this.currentModel = config.DEFAULT_AI_MODEL;
  }

  abstract analyze(ctx: AgentContext): Promise<AgentOutput>;

  // Resolve provider: connection preference → platform default
  getAISelection(connectionId?: string): AIProviderSelection {
    if (connectionId) {
      const state = registry.getByConnectionId(connectionId);
      if (state && state.aiProvider) {
        return state.aiProvider;
      }
    }
    return {
      providerId: config.DEFAULT_AI_PROVIDER as AIProviderId,
      model: config.DEFAULT_AI_MODEL,
    };
  }

  // Call AIProviderRouter with structured output
  protected async callAI(
    systemPrompt: string,
    userPrompt: string,
    responseSchema?: z.ZodSchema,
    connectionId?: string,
  ): Promise<{ response: AIResponse; parsed: any }> {
    const selection = this.getAISelection(connectionId);
    this.currentProvider = selection.providerId;
    this.currentModel = selection.model;

    const response = await aiRouter.complete(selection, {
      systemPrompt,
      userPrompt,
      responseSchema,
      maxTokens: 500,
      temperature: 0.3,
      agentName: this.name,
    });

    let parsed: any = response.content;
    if (response.parsedContent) {
      parsed = response.parsedContent;
    } else {
      try { parsed = JSON.parse(response.content); } catch { /* keep raw */ }
    }

    return { response, parsed };
  }

  // Start the agent loop
  run(): void {
    if (this.timer) return;
    this.timer = setInterval(async () => {
      await this.tick();
    }, this.intervalMs);
    logger.info({ agent: this.name, intervalMs: this.intervalMs }, 'Agent started');
  }

  // Execute a single tick (called by orchestrator or interval)
  async tick(context?: AgentContext): Promise<AgentOutput | null> {
    const start = Date.now();
    this.status = 'running';
    try {
      const ctx = context ?? await this.buildDefaultContext();
      const output = await this.analyze(ctx);

      this.latencyMs = Date.now() - start;
      this.lastRun = Date.now();
      this.totalLatency += this.latencyMs;
      this.runCount++;
      this.status = 'idle';

      await this.publishLog(output, output.provider, output.model, this.latencyMs);

      // Cache in Redis (TTL = 2× interval)
      await redis.set(
        `agent:cache:${this.name.toLowerCase()}`,
        JSON.stringify({ ...output, ts: this.lastRun }),
        'PX', this.intervalMs * 2,
      );

      return output;
    } catch (err) {
      this.status = 'error';
      this.errorCount++;
      this.latencyMs = Date.now() - start;
      logger.error({ err, agent: this.name }, 'Agent execution failed');

      await this.publishLog(
        {
          signal: 'error',
          confidence: 0,
          reasoning: `Error: ${err instanceof Error ? err.message : String(err)}`,
          provider: this.currentProvider,
          model: this.currentModel,
        },
        this.currentProvider,
        this.currentModel,
        this.latencyMs,
        'alert',
      );
      return null;
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    logger.info({ agent: this.name }, 'Agent stopped');
  }

  get avgLatencyMs(): number {
    return this.runCount > 0 ? Math.round(this.totalLatency / this.runCount) : 0;
  }

  // ─── Publishing ─────────────────────────────────────────────────────────

  async publishLog(
    output: AgentOutput,
    provider: AIProviderId,
    model: string,
    latencyMs: number,
    levelOverride?: string,
  ): Promise<void> {
    const level = levelOverride
      ?? (output.confidence > 80 ? 'alert' : output.signal === 'neutral' ? 'info' : 'warn');

    const logData = {
      agentName: this.name,
      level: level as 'info' | 'warn' | 'alert',
      message: output.reasoning.substring(0, 1000),
      metadata: output,
      provider,
      model,
      latencyMs,
    };

    try {
      await db.insert(agentLogs).values(logData);
      await redis.publish('agents:logs', JSON.stringify({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agent: this.name,
        message: output.reasoning.substring(0, 150),
        level: level.toUpperCase(),
        agentProvider: provider,
        providerId: provider,
        model,
        latency_ms: latencyMs,
      }));
    } catch (err) {
      logger.error({ err, agent: this.name }, 'Failed to publish agent log');
    }
  }

  async publishAlpha(metric: any): Promise<void> {
    try {
      await db.insert(alphaMetrics).values(metric);
      await redis.publish('agents:alpha', JSON.stringify(metric));
    } catch (err) {
      logger.error({ err, agent: this.name }, 'Failed to publish alpha metric');
    }
  }

  // ─── Default Context Builder ────────────────────────────────────────────

  private async buildDefaultContext(): Promise<AgentContext> {
    return {
      recentPrices: [],
      topSpreads: [],
      recentWhaleMovements: [],
      currentAlpha: null,
      marketConditions: 'No context available',
    };
  }
}
