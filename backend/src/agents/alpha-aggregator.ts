import { redis } from '../lib/redis.js';
import { db } from '../db/index.js';
import { alphaMetrics } from '../db/schema/index.js';
import { logger } from '../lib/logger.js';
import { config } from '../config.js';
import type { AIProviderId } from '../services/ai/types.js';

export class AlphaAggregator {
  public name = 'Aggregator';
  public intervalMs = 10_000;
  public lastRun = 0;
  public status: 'idle' | 'running' | 'error' = 'idle';

  private timer: ReturnType<typeof setInterval> | null = null;

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.run(), this.intervalMs);
    logger.info({ intervalMs: this.intervalMs }, 'Alpha Aggregator started');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async run(): Promise<void> {
    this.status = 'running';
    try {
      const [fundamentalist, sentiment, risk] = await Promise.all([
        this.getCached('fundamentalist'),
        this.getCached('sentiment'),
        this.getCached('risk'),
      ]);

      if (!fundamentalist || !sentiment || !risk) {
        logger.debug('Aggregator skipping: not all agents have data yet');
        this.status = 'idle';
        return;
      }

      // Confidence formula from spec
      const fundConf = fundamentalist.confidence ?? 50;
      const sentConf = sentiment.confidence ?? 50;
      const riskScore = typeof risk.confidence === 'number'
        ? (100 - risk.confidence) // risk.confidence = 100 - riskScore
        : 50;

      const confidence = Math.max(0, Math.min(100, Math.round(
        fundConf * 0.40 +
        sentConf * 0.30 +
        (100 - riskScore) * 0.30
      )));

      // Determine trend
      const prevAlphaStr = await redis.get('agent:cache:alpha');
      const prevAlpha = prevAlphaStr ? JSON.parse(prevAlphaStr) : null;
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (prevAlpha?.confidence) {
        const diff = confidence - prevAlpha.confidence;
        if (diff > 2) trend = 'increasing';
        else if (diff < -2) trend = 'decreasing';
      }

      // Build contributing_agents with provider info
      const contributingAgents = {
        fundamentalist: {
          score: fundConf,
          provider: fundamentalist.provider ?? config.DEFAULT_AI_PROVIDER,
          model: fundamentalist.model ?? config.DEFAULT_AI_MODEL,
          reasoning: fundamentalist.reasoning ?? '',
        },
        sentiment: {
          score: sentConf,
          provider: sentiment.provider ?? config.DEFAULT_AI_PROVIDER,
          model: sentiment.model ?? config.DEFAULT_AI_MODEL,
          reasoning: sentiment.reasoning ?? '',
        },
        risk: {
          score: riskScore,
          provider: risk.provider ?? config.DEFAULT_AI_PROVIDER,
          model: risk.model ?? config.DEFAULT_AI_MODEL,
          regime: risk.signal ?? 'medium',
        },
      };

      // Determine which provider generated this aggregation
      const generatedByProvider = (fundamentalist.provider ?? config.DEFAULT_AI_PROVIDER) as AIProviderId;

      const topOpportunity = {
        symbol: fundamentalist.targetMarket ?? 'N/A',
        reasoning: fundamentalist.reasoning ?? 'Aggregated signal',
      };

      // Write to DB
      await db.insert(alphaMetrics).values({
        confidence: confidence.toFixed(2),
        regime: risk.signal === 'critical' ? 'critical'
              : risk.signal === 'high' ? 'high'
              : risk.signal === 'medium' ? 'medium'
              : 'low',
        contributingAgents,
        topOpportunity,
        generatedByProvider,
      });

      // Build message matching frontend AlphaMetric shape
      const alphaPayload = {
        probability: confidence,
        trend,
        history: prevAlpha?.history
          ? [...prevAlpha.history.slice(-19), { probability: confidence, timestamp: Date.now() }]
          : [{ probability: confidence, timestamp: Date.now() }],
        breakdown: {
          fundamentals: { score: fundConf, providerId: contributingAgents.fundamentalist.provider },
          sentiment: { score: sentConf, providerId: contributingAgents.sentiment.provider },
          risk: { score: riskScore, providerId: contributingAgents.risk.provider },
        },
        generatedBy: generatedByProvider,
        contributing_agents: [
          { agent: 'Fundamentalist', provider: contributingAgents.fundamentalist.provider as AIProviderId, model: contributingAgents.fundamentalist.model, score: fundConf },
          { agent: 'Sentiment', provider: contributingAgents.sentiment.provider as AIProviderId, model: contributingAgents.sentiment.model, score: sentConf },
          { agent: 'Risk', provider: contributingAgents.risk.provider as AIProviderId, model: contributingAgents.risk.model, score: riskScore },
        ],
        confidence,
      };

      // Publish to Redis channel
      await redis.publish('agents:alpha', JSON.stringify(alphaPayload));

      // Cache consolidated alpha (30s TTL)
      await redis.set('agent:cache:alpha', JSON.stringify(alphaPayload), 'EX', 30);

      this.lastRun = Date.now();
      this.status = 'idle';

      logger.info({ confidence, trend, regime: contributingAgents.risk.regime }, 'Alpha aggregation complete');
    } catch (err) {
      this.status = 'error';
      logger.error({ err }, 'Alpha Aggregator failed');
    }
  }

  private async getCached(agentName: string): Promise<any | null> {
    const data = await redis.get(`agent:cache:${agentName}`);
    return data ? JSON.parse(data) : null;
  }
}
