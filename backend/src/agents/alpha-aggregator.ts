import { redis } from '../lib/redis.js';
import { db } from '../db/index.js';
import { alphaMetrics } from '../db/schema/index.js';
import { logger } from '../lib/logger.js';

export class AlphaAggregator {
  public name = 'Aggregator';
  public intervalMs = 10000;

  async run() {
    try {
      // 1. Fetch latest agent outputs from Redis
      const [fundamentalist, sentiment, risk] = await Promise.all([
        this.getCachedAgentData('fundamentalist'),
        this.getCachedAgentData('sentiment'),
        this.getCachedAgentData('risk')
      ]);

      if (!fundamentalist || !sentiment || !risk) {
        logger.warn('Aggregator skipping: Not all agents have data yet.');
        return;
      }

      // 2. Compute Weighted Alpha
      // confidence = (fundamentalist.confidence * 0.4) + (sentiment.sentiment_score * 0.3) + (1 - risk.risk_score/100) * 0.3) * 100
      // Normalizing sentiment_score (-1 to 1) to (0 to 1) might be better, 
      // but user asked for literal formula.
      
      const fundConf = fundamentalist.confidence || 0.5;
      const sentScore = sentiment.sentiment_score || 0;
      const riskScore = risk.risk_score || 0;

      const alphaValue = (
        (fundConf * 0.4) + 
        (sentScore * 0.3) + 
        ((1 - riskScore / 100) * 0.3)
      ) * 100;

      const finalConfidence = Math.max(0, Math.min(100, alphaValue));

      const metricData = {
        confidence: finalConfidence.toFixed(2),
        regime: risk.regime || 'unknown',
        contributingAgents: {
          fundamentalist: { signal: fundamentalist.signal, confidence: fundConf },
          sentiment: { score: sentScore, side: sentiment.dominant_side },
          risk: { score: riskScore, regime: risk.regime }
        },
        topOpportunity: {
          symbol: fundamentalist.target_market || 'N/A',
          reasoning: fundamentalist.reasoning || 'Aggregated signal'
        },
      };

      // 3. Persist to DB
      await db.insert(alphaMetrics).values({
        ...metricData,
        createdAt: new Date(),
      });

      // 4. Publish to Redis
      await redis.publish('agents:alpha', JSON.stringify(metricData));
      
      // Cache the consolidated alpha
      await redis.set('agent:cache:alpha', JSON.stringify(metricData), 'EX', 30);

      logger.info({ confidence: finalConfidence }, 'Alpha Aggregation Complete');

    } catch (err) {
      logger.error(err, 'Alpha Aggregator failed');
    }
  }

  private async getCachedAgentData(agentName: string) {
    const data = await redis.get(`agent:cache:${agentName}`);
    return data ? JSON.parse(data) : null;
  }
}
