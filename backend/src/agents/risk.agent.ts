import { BaseAgent, AgentContext, AgentOutput } from './base-agent.js';
import { aiService } from '../services/ai.service.js';
import { db } from '../db/index.js';
import { trades } from '../db/schema/index.js';
import { logger } from '../lib/logger.js';
import { desc } from 'drizzle-orm';

export class RiskAgent extends BaseAgent {
  constructor() {
    super('Risk', 'gpt-4o-mini', 20000);
  }

  async analyze(context: AgentContext): Promise<AgentOutput> {
    // Compute metrics
    const spreadVolatility = this.calculateVolatility(context.topSpreads);
    const riskMetrics = await this.getTradeMetrics();

    const prompt = `Assess the current risk regime for our prediction market trading operation.
    
    Data:
    Spread Volatility (last 20): ${spreadVolatility.toFixed(4)}
    Current Exposure: $${riskMetrics.exposure.toFixed(2)}
    Max Drawdown (recent): $${riskMetrics.maxDrawdown.toFixed(2)}
    
    Determine the risk regime and score (0-100).
    Return your analysis in strict JSON format:
    {
      "regime": "low" | "medium" | "high" | "critical",
      "risk_score": number,
      "warnings": ["string"]
    }`;

    try {
      const response = await aiService.chat({
        systemPrompt: 'You are a risk management AI for a high-frequency trading firm. Respond ONLY with valid JSON.',
        prompt,
        responseFormat: 'json_object',
      });
      const data = JSON.parse(response);
      return {
        ...data,
        reasoning: `Risk assessed at ${data.risk_score} with ${data.regime} regime. ${data.warnings?.join(' ') || ''}`
      };
    } catch (err) {
      logger.error({ err, agent: this.name }, 'Risk agent analysis failed');
      throw err;
    }
  }

  private calculateVolatility(spreads: any[]): number {
    if (spreads.length < 2) return 0;
    const values = spreads.map(s => parseFloat(s.spread));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sqDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = sqDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  private async getTradeMetrics() {
    // Highly simplified for this agent
    const recentTrades = await db.query.trades.findMany({
      orderBy: [desc(trades.openedAt)],
      limit: 50
    });

    let exposure = 0;
    let maxDrawdown = 0;
    let peak = 0;
    let balance = 0;

    for (const t of recentTrades) {
      const size = parseFloat(t.size);
      const pnl = t.pnl ? parseFloat(t.pnl) : 0;
      if (t.status === 'open') {
        exposure += size;
      }
      balance += pnl;
      if (balance > peak) peak = balance;
      const dd = peak - balance;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    return { exposure, maxDrawdown };
  }
}
