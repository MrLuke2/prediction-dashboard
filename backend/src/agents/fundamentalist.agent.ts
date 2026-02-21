import { z } from 'zod';
import { BaseAgent, AgentContext, AgentOutput } from './base-agent.js';
import { logger } from '../lib/logger.js';

const FundamentalistSchema = z.object({
  signal: z.enum(['bullish', 'bearish', 'neutral']),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().max(150),
  targetMarket: z.string(),
  estimatedEdge: z.number(),
});

const SYSTEM_PROMPT = `You are a prediction market fundamentals analyst specializing in arbitrage between Polymarket and Kalshi. Analyze market data with precision. Identify genuine mispricing vs noise. Respond ONLY with valid JSON matching the schema.`;

export class FundamentalistAgent extends BaseAgent {
  constructor() {
    super('Fundamentalist', 30_000);
  }

  async analyze(ctx: AgentContext): Promise<AgentOutput> {
    const userPrompt = `Analyze the provided market data and identify fundamental mispricing opportunities.

Top Spreads: ${JSON.stringify(ctx.topSpreads.slice(0, 5))}
Recent Prices: ${JSON.stringify(ctx.recentPrices.slice(0, 20))}
Market Conditions: ${ctx.marketConditions}

Return JSON: { "signal": "bullish"|"bearish"|"neutral", "confidence": 0-100, "reasoning": "max 150 chars", "targetMarket": "symbol", "estimatedEdge": number }`;

    const { response, parsed } = await this.callAI(SYSTEM_PROMPT, userPrompt, FundamentalistSchema);

    const result = FundamentalistSchema.safeParse(parsed);
    const data = result.success ? result.data : {
      signal: 'neutral' as const,
      confidence: 30,
      reasoning: typeof parsed === 'string' ? parsed.slice(0, 150) : 'Unable to parse response',
      targetMarket: 'N/A',
      estimatedEdge: 0,
    };

    logger.debug({ agent: this.name, signal: data.signal, confidence: data.confidence }, 'Fundamentalist analysis complete');

    return {
      signal: data.signal,
      confidence: data.confidence,
      reasoning: data.reasoning,
      targetMarket: data.targetMarket,
      provider: response.provider,
      model: response.model,
    };
  }
}
