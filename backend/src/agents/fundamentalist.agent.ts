import { BaseAgent, AgentContext, AgentOutput } from './base-agent.js';
import { aiService } from '../services/ai.service.js';
import { logger } from '../lib/logger.js';

export class FundamentalistAgent extends BaseAgent {
  constructor() {
    super('Fundamentalist', 'gpt-4o-mini', 30000);
  }

  async analyze(context: AgentContext): Promise<AgentOutput> {
    const prompt = `Analyze the provided market data and identify fundamental mispricing opportunities.
    
    Data:
    Top Spreads: ${JSON.stringify(context.topSpreads)}
    Recent Prices: ${JSON.stringify(context.recentPrices)}
    
    Identify if there is a clear fundamental edge for any market based on spread and volume.
    Return your analysis in strict JSON format:
    {
      "signal": "bullish" | "bearish" | "neutral",
      "confidence": 0..1,
      "reasoning": "string",
      "target_market": "symbol"
    }`;

    try {
      const response = await aiService.chat({
        systemPrompt: 'You are a professional prediction market analyst specializing in fundamentals. Respond ONLY with valid JSON.',
        prompt,
        responseFormat: 'json_object',
      });
      return JSON.parse(response);
    } catch (err) {
      logger.error({ err, agent: this.name }, 'Fundamentalist agent analysis failed');
      throw err;
    }
  }
}
