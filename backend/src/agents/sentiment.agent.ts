import { BaseAgent, AgentContext, AgentOutput } from './base-agent.js';
import { aiService } from '../services/ai.service.js';
import { logger } from '../lib/logger.js';

export class SentimentAgent extends BaseAgent {
  constructor() {
    super('Sentiment', 'gpt-4o-mini', 45000);
  }

  async analyze(context: AgentContext): Promise<AgentOutput> {
    const prompt = `Analyze the sentiment of recent large "whale" movements in prediction markets. 
    Whale Movements: ${JSON.stringify(context.recentWhaleMovements)}
    
    Determine the overall market sentiment score from -1 (extremely bearish) to 1 (extremely bullish).
    Return your analysis in strict JSON format:
    {
      "sentiment_score": number,
      "dominant_side": "string",
      "reasoning": "string"
    }`;

    try {
      const response = await aiService.chat({
        systemPrompt: 'You are a market sentiment analyst specialized in flow data. Respond ONLY with valid JSON.',
        prompt,
        responseFormat: 'json_object',
      });
      const data = JSON.parse(response);
      return {
        ...data,
        reasoning: data.reasoning || 'No reasoning provided'
      };
    } catch (err) {
      logger.error({ err, agent: this.name }, 'Sentiment agent analysis failed');
      throw err;
    }
  }
}
