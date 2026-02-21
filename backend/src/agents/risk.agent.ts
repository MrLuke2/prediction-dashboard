import { z } from 'zod';
import { BaseAgent, AgentContext, AgentOutput } from './base-agent.js';
import { db } from '../db/index.js';
import { trades, emergencyEvents } from '../db/schema/index.js';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { registry } from '../ws/clientState.js';
import { MessageType, buildServerMessage } from '../ws/protocol.js';
import { desc, eq } from 'drizzle-orm';

const RiskSchema = z.object({
  regime: z.enum(['low', 'medium', 'high', 'critical']),
  riskScore: z.number().min(0).max(100),
  warnings: z.array(z.string()),
  maxRecommendedSize: z.number(),
  shouldHalt: z.boolean(),
});

const SYSTEM_PROMPT = `You are a risk management AI for a high-frequency prediction market trading operation. Assess current risk regime based on exposure, drawdown, and spread volatility. Be conservative — when in doubt, flag higher risk. Respond ONLY with valid JSON matching the schema.`;

export class RiskAgent extends BaseAgent {
  constructor() {
    super('Risk', 20_000);
  }

  async analyze(ctx: AgentContext): Promise<AgentOutput> {
    const metrics = await this.getTradeMetrics();
    const spreadVol = this.calculateVolatility(ctx.topSpreads);

    const userPrompt = `Assess the current risk regime for our prediction market trading operation.

Spread Volatility (last 20): ${spreadVol.toFixed(4)}
Current Exposure: $${metrics.exposure.toFixed(2)}
Max Drawdown (recent): $${metrics.maxDrawdown.toFixed(2)}
Market Conditions: ${ctx.marketConditions}

Return JSON: { "regime": "low"|"medium"|"high"|"critical", "riskScore": 0-100, "warnings": ["string"], "maxRecommendedSize": number_usd, "shouldHalt": boolean }`;

    const { response, parsed } = await this.callAI(SYSTEM_PROMPT, userPrompt, RiskSchema);

    const result = RiskSchema.safeParse(parsed);
    const data = result.success ? result.data : {
      regime: 'medium' as const,
      riskScore: 50,
      warnings: ['Unable to parse risk assessment'],
      maxRecommendedSize: 500,
      shouldHalt: false,
    };

    // CRITICAL: emergency stop
    if (data.shouldHalt) {
      await this.triggerEmergencyStop(data, response.provider);
    }

    logger.debug({ agent: this.name, regime: data.regime, riskScore: data.riskScore, shouldHalt: data.shouldHalt }, 'Risk analysis complete');

    return {
      signal: data.regime,
      confidence: 100 - data.riskScore,
      reasoning: `Risk ${data.regime} (${data.riskScore}/100). ${data.warnings.join('. ')}`.slice(0, 150),
      provider: response.provider,
      model: response.model,
    };
  }

  private async triggerEmergencyStop(data: z.infer<typeof RiskSchema>, provider: string): Promise<void> {
    logger.warn({ regime: data.regime, riskScore: data.riskScore, warnings: data.warnings }, 'EMERGENCY STOP TRIGGERED by Risk Agent');

    const openTradesCount = await this.countOpenTrades();

    const payload = {
      reason: `Risk agent emergency: ${data.regime} regime, score ${data.riskScore}. ${data.warnings.join('. ')}`,
      tradesAffected: openTradesCount,
      timestamp: new Date().toISOString(),
    };

    // Write emergency_events table
    try {
      await db.insert(emergencyEvents).values({
        userId: '00000000-0000-0000-0000-000000000000', // system user
        triggerReason: payload.reason.slice(0, 255),
        tradesClosed: openTradesCount,
        metadata: { provider, riskScore: data.riskScore, warnings: data.warnings },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to write emergency event');
    }

    // Publish to Redis for emergency channel
    await redis.publish('emergency:stop:broadcast', JSON.stringify(payload));

    // Broadcast via WebSocket (direct, immediate)
    const msg = buildServerMessage(MessageType.EMERGENCY_STOP, payload);
    registry.broadcast(msg);
  }

  private calculateVolatility(spreads: any[]): number {
    if (spreads.length < 2) return 0;
    const values = spreads.map(s => typeof s.spread === 'number' ? s.spread : parseFloat(s.spread ?? '0'));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sqDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  private async getTradeMetrics(): Promise<{ exposure: number; maxDrawdown: number }> {
    try {
      const recentTrades = await db.query.trades.findMany({
        orderBy: [desc(trades.openedAt)],
        limit: 50,
      });

      let exposure = 0;
      let maxDrawdown = 0;
      let peak = 0;
      let balance = 0;

      for (const t of recentTrades) {
        const size = parseFloat(t.size);
        const pnl = t.pnl ? parseFloat(t.pnl) : 0;
        if (t.status === 'open') exposure += size;
        balance += pnl;
        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDrawdown) maxDrawdown = dd;
      }

      return { exposure, maxDrawdown };
    } catch {
      return { exposure: 0, maxDrawdown: 0 };
    }
  }

  private async countOpenTrades(): Promise<number> {
    try {
      const open = await db.query.trades.findMany({
        where: eq(trades.status, 'open'),
        columns: { id: true },
      });
      return open.length;
    } catch {
      return 0;
    }
  }
}
