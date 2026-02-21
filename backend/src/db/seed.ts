import { db } from './index.js';
import { 
  users, 
  marketPairs, 
  priceSnapshots, 
  trades, 
  whaleMovements, 
  agentLogs, 
  alphaMetrics,
  emergencyEvents,
  aiUsageMetrics
} from './schema/index.js';
import { randomUUID } from 'crypto';

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Users (3: free, pro, enterprise)
  const userData = [
    {
      email: 'free@alfapredict.ai',
      passwordHash: 'hashed_password_placeholder',
      plan: 'free' as const,
      preferredAiProvider: 'openai' as const,
      preferredModel: 'gpt-4o-mini',
      isActive: true,
    },
    {
      email: 'pro@alfapredict.ai',
      passwordHash: 'hashed_password_placeholder',
      plan: 'pro' as const,
      preferredAiProvider: 'anthropic' as const,
      preferredModel: 'claude-3-5-sonnet-20240620',
      isActive: true,
    },
    {
      email: 'enterprise@alfapredict.ai',
      passwordHash: 'hashed_password_placeholder',
      plan: 'enterprise' as const,
      preferredAiProvider: 'gemini' as const,
      preferredModel: 'gemini-1.5-pro',
      isActive: true,
    }
  ];

  const insertedUsers = await db.insert(users).values(userData).onConflictDoNothing().returning();
  const allUsers = insertedUsers.length > 0 ? insertedUsers : await db.query.users.findMany();

  // 2. Market Pairs (10)
  const marketPairData = [
    { symbol: 'BTC/USD', polymarketSlug: 'bitcoin-price-june', kalshiTicker: 'BTC', category: 'Crypto' },
    { symbol: 'ETH/USD', polymarketSlug: 'ethereum-price-june', kalshiTicker: 'ETH', category: 'Crypto' },
    { symbol: 'GOP-NOM/2024', polymarketSlug: 'republican-nominee-2024', kalshiTicker: 'GOP-NOM', category: 'Politics' },
    { symbol: 'DEM-NOM/2024', polymarketSlug: 'democratic-nominee-2024', kalshiTicker: 'DEM-NOM', category: 'Politics' },
    { symbol: 'NBA-FINALS/2024', polymarketSlug: 'nba-finals-winner', kalshiTicker: 'NBA-FINALS', category: 'Sports' },
    { symbol: 'SUPER-BOWL/2025', polymarketSlug: 'super-bowl-winner-2025', kalshiTicker: 'SB-LIX', category: 'Sports' },
    { symbol: 'SOL/USD', polymarketSlug: 'solana-price-june', kalshiTicker: 'SOL', category: 'Crypto' },
    { symbol: 'FED-HIKE/MAR', polymarketSlug: 'fed-hike-march', kalshiTicker: 'FED-2024', category: 'Macro' },
    { symbol: 'UK-ELEC/2024', polymarketSlug: 'uk-election-winner', kalshiTicker: 'UK-ELEC', category: 'Politics' },
    { symbol: 'UFC-300/MAIN', polymarketSlug: 'ufc-300-winner', kalshiTicker: 'UFC-300', category: 'Sports' },
  ];

  const insertedMarketPairs = await db.insert(marketPairs).values(marketPairData).onConflictDoNothing().returning();
  const allMarketPairs = insertedMarketPairs.length > 0 ? insertedMarketPairs : await db.query.marketPairs.findMany();

  // 3. Price Snapshots (200, last 24h)
  const priceSnapshotData = [];
  const now = new Date();
  for (let i = 0; i < 200; i++) {
    const pair = allMarketPairs[i % allMarketPairs.length];
    const basePrice = Math.random() * 0.9 + 0.05;
    const spread = Math.random() * 0.01;
    priceSnapshotData.push({
      marketPairId: pair.id,
      polymarketPrice: basePrice.toFixed(4),
      kalshiPrice: (basePrice - spread).toFixed(4),
      spread: spread.toFixed(4),
      volume24h: (Math.random() * 10000000).toFixed(2),
      capturedAt: new Date(now.getTime() - (i * 7 * 60 * 1000)), // Every 7 minutes
    });
  }
  await db.insert(priceSnapshots).values(priceSnapshotData);

  // 4. Whale Movements (30)
  const whaleMovementData = [];
  const providers = ['anthropic', 'openai', 'gemini'] as const;
  for (let i = 0; i < 30; i++) {
    whaleMovementData.push({
      walletAddress: `0x${randomUUID().replace(/-/g, '').slice(0, 40)}`,
      marketPairId: allMarketPairs[Math.floor(Math.random() * allMarketPairs.length)].id,
      amountUsd: (Math.random() * 500000 + 50000).toFixed(2),
      direction: Math.random() > 0.5 ? 'in' as const : 'out' as const,
      venue: Math.random() > 0.5 ? 'polymarket' as const : 'kalshi' as const,
      txHash: `0x${randomUUID().replace(/-/g, '')}`,
      detectedAt: new Date(now.getTime() - i * 3600000),
      flaggedByProvider: providers[Math.floor(Math.random() * providers.length)],
      label: `Smart Money #${i + 1}`,
      isKnownWhale: Math.random() > 0.8,
    });
  }
  await db.insert(whaleMovements).values(whaleMovementData);

  // 5. Agent Logs (50)
  const agentLogData = [];
  const agentNames = ['Fundamentalist', 'Sentiment', 'Risk', 'Orchestrator'];
  const levels = ['info', 'warn', 'alert'] as const;
  for (let i = 0; i < 50; i++) {
    agentLogData.push({
      agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
      message: `System analysis report ${i}`,
      metadata: { check_id: randomUUID() },
      marketPairId: Math.random() > 0.3 ? allMarketPairs[Math.floor(Math.random() * allMarketPairs.length)].id : null,
      provider: providers[Math.floor(Math.random() * providers.length)],
      model: 'claude-3-opus',
      latencyMs: Math.floor(Math.random() * 2000 + 500),
      tokensUsed: Math.floor(Math.random() * 1000 + 100),
      createdAt: new Date(now.getTime() - i * 1800000),
    });
  }
  await db.insert(agentLogs).values(agentLogData);

  // 6. Alpha Metrics (5)
  const alphaMetricData = [];
  const regimes = ['low', 'medium', 'high', 'critical'] as const;
  for (let i = 0; i < 5; i++) {
    alphaMetricData.push({
      confidence: (Math.random() * 40 + 50).toFixed(2),
      regime: regimes[Math.floor(Math.random() * regimes.length)],
      contributingAgents: {
        fundamentalist: { score: 0.85, provider: 'anthropic', model: 'claude-3-sonnet' },
        sentiment: { score: 0.72, provider: 'openai', model: 'gpt-4o' },
        risk: { score: 0.91, provider: 'openai', model: 'gpt-4o-mini' }
      },
      topOpportunity: { symbol: 'BTC/USD', expectedReturn: '12.5%' },
      generatedByProvider: providers[i % providers.length],
      createdAt: new Date(now.getTime() - i * 3600000 * 4),
    });
  }
  await db.insert(alphaMetrics).values(alphaMetricData);

  // 7. Emergency Events (2, resolved)
  const emergencyEventData = [];
  for (let i = 0; i < 2; i++) {
    emergencyEventData.push({
      userId: allUsers[i % allUsers.length].id,
      triggeredAt: new Date(now.getTime() - (i + 1) * 86400000),
      triggerReason: `High localized volatility in ${allMarketPairs[i].symbol}`,
      tradesClosed: Math.floor(Math.random() * 10 + 5),
      totalPnlImpact: (Math.random() * -1000).toFixed(6),
      resolvedAt: new Date(now.getTime() - (i + 1) * 80000000),
      metadata: { auto_fix: true }
    });
  }
  await db.insert(emergencyEvents).values(emergencyEventData);

  // 8. AI Usage Metrics (100)
  const aiUsageData = [];
  for (let i = 0; i < 100; i++) {
    aiUsageData.push({
      provider: providers[Math.floor(Math.random() * providers.length)],
      model: 'model-x',
      userId: Math.random() > 0.2 ? allUsers[Math.floor(Math.random() * allUsers.length)].id : null,
      agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
      tokensInput: Math.floor(Math.random() * 5000),
      tokensOutput: Math.floor(Math.random() * 2000),
      latencyMs: Math.floor(Math.random() * 3000),
      costUsd: (Math.random() * 0.05).toFixed(6),
      success: Math.random() > 0.05,
      errorCode: Math.random() > 0.95 ? 'RATE_LIMIT' : null,
      createdAt: new Date(now.getTime() - i * 900000),
    });
  }
  await db.insert(aiUsageMetrics).values(aiUsageData);

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
