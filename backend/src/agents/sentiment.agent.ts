import { z } from 'zod';
import { BaseAgent, AgentContext, AgentOutput } from './base-agent.js';
import { logger } from '../lib/logger.js';

const SentimentSchema = z.object({
  sentimentScore: z.number().min(-1).max(1),
  dominantSide: z.enum(['bulls', 'bears', 'neutral']),
  whaleAlignment: z.enum(['buying', 'selling', 'mixed']),
  reasoning: z.string().max(150),
  confidence: z.number().min(0).max(100),
});

const SYSTEM_PROMPT = `You are a market sentiment analyst specialized in prediction market flow data and whale behavior. Analyze whale movements and market positioning to determine overall sentiment. Respond ONLY with valid JSON matching the schema.`;

export class SentimentAgent extends BaseAgent {
  constructor() {
    super('Sentiment', 45_000);
  }

  async analyze(ctx: AgentContext): Promise<AgentOutput> {
    const userPrompt = `Analyze the sentiment of recent whale movements in prediction markets.

Whale Movements (last 10): ${JSON.stringify(ctx.recentWhaleMovements.slice(0, 10))}
Market Conditions: ${ctx.marketConditions}

Return JSON: { "sentimentScore": -1 to 1, "dominantSide": "bulls"|"bears"|"neutral", "whaleAlignment": "buying"|"selling"|"mixed", "reasoning": "max 150 chars", "confidence": 0-100 }`;

    const { response, parsed } = await this.callAI(SYSTEM_PROMPT, userPrompt, SentimentSchema);

    const result = SentimentSchema.safeParse(parsed);
    const data = result.success ? result.data : {
      sentimentScore: 0,
      dominantSide: 'neutral' as const,
      whaleAlignment: 'mixed' as const,
      reasoning: typeof parsed === 'string' ? parsed.slice(0, 150) : 'Unable to parse response',
      confidence: 30,
    };

    logger.debug({ agent: this.name, sentiment: data.sentimentScore, side: data.dominantSide }, 'Sentiment analysis complete');

    return {
      signal: data.dominantSide,
      confidence: data.confidence,
      reasoning: data.reasoning,
      provider: response.provider,
      model: response.model,
    };
  }
}
