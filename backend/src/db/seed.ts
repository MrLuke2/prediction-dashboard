import { db, client } from './index.js';
import { 
  users, 
  marketPairs, 
  priceSnapshots, 
  trades, 
  whaleMovements, 
  agentLogs, 
  alphaMetrics,
  userPlanEnum,
  tradeSideEnum,
  tradeVenueEnum,
  tradeStatusEnum,
  agentLogLevelEnum
} from './schema/index.js';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Create a demo user
  const [demoUser] = await db.insert(users).values({
    email: 'demo@alfapredict.ai',
    passwordHash: 'hashed_password_placeholder',
    plan: 'pro',
  }).onConflictDoNothing().returning();

  const userId = demoUser?.id || (await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, 'demo@alfapredict.ai') }))?.id;

  if (!userId) {
    throw new Error('Failed to create or find demo user');
  }

  // 2. Market Pairs (10)
  const marketPairData = [
    { symbol: 'BTC/USD', polymarketSlug: 'bitcoin-price-end-of-month', kalshiTicker: 'BTC', category: 'Crypto' },
    { symbol: 'ETH/USD', polymarketSlug: 'ethereum-price-end-of-month', kalshiTicker: 'ETH', category: 'Crypto' },
    { symbol: 'FED/RATE', polymarketSlug: 'fed-interest-rate-hike', kalshiTicker: 'FED', category: 'Macro' },
    { symbol: 'CPI/US', polymarketSlug: 'us-cpi-march', kalshiTicker: 'CPI', category: 'Macro' },
    { symbol: 'SOL/USD', polymarketSlug: 'solana-price-end-of-week', kalshiTicker: 'SOL', category: 'Crypto' },
    { symbol: 'NVDA/EARN', polymarketSlug: 'nvidia-earnings-beat', kalshiTicker: 'NVDA', category: 'Stocks' },
    { symbol: 'AAPL/EARN', polymarketSlug: 'apple-earnings-beat', kalshiTicker: 'AAPL', category: 'Stocks' },
    { symbol: 'OIL/WTI', polymarketSlug: 'oil-price-forecast', kalshiTicker: 'WTI', category: 'Commodities' },
    { symbol: 'GOLD/USD', polymarketSlug: 'gold-price-end-of-month', kalshiTicker: 'GOLD', category: 'Commodities' },
    { symbol: 'TSLA/EARN', polymarketSlug: 'tesla-earnings-beat', kalshiTicker: 'TSLA', category: 'Stocks' },
  ];

  const insertedMarketPairs = await db.insert(marketPairs).values(marketPairData).onConflictDoNothing().returning();
  
  // If returning is empty (due to conflict), fetch them
  const allMarketPairs = insertedMarketPairs.length > 0 ? insertedMarketPairs : await db.query.marketPairs.findMany();

  // 3. Price Snapshots (100)
  const priceSnapshotData = [];
  for (let i = 0; i < 100; i++) {
    const pair = allMarketPairs[i % allMarketPairs.length];
    const polyPrice = (Math.random() * 0.9 + 0.05).toString();
    const kalshiPrice = (parseFloat(polyPrice) + (Math.random() - 0.5) * 0.02).toString();
    priceSnapshotData.push({
      marketPairId: pair.id,
      polymarketPrice: polyPrice,
      kalshiPrice: kalshiPrice,
      spread: (parseFloat(polyPrice) - parseFloat(kalshiPrice)).toString(),
      volume24h: (Math.random() * 1000000 + 50000).toString(),
      capturedAt: new Date(Date.now() - i * 1000 * 60 * 60), // Hourly snapshots
    });
  }
  await db.insert(priceSnapshots).values(priceSnapshotData);

  // 4. Whale Movements (20)
  const whaleMovementData = [];
  for (let i = 0; i < 20; i++) {
    whaleMovementData.push({
      walletAddress: `0x${randomUUID().replace(/-/g, '').slice(0, 40)}`,
      txHash: `0x${randomUUID().replace(/-/g, '')}`,
      blockNumber: 12345678,
      amount: "1000000000",
      amountUsd: Math.random() * 500000 + 100000,
      direction: (Math.random() > 0.5 ? 'buy' : 'sell'),
      marketAddress: `0x${randomUUID().replace(/-/g, '').slice(0, 40)}`,
      marketName: 'Polymarket',
      level: 'info',
      timestamp: new Date(Date.now() - i * 1000 * 60 * 120),
    });
  }
  await db.insert(whaleMovements).values(whaleMovementData);

  // 5. Agent Logs (50)
  const agents = ['ORCHESTRATOR', 'MARKET_ANALYZER', 'WHALE_WATCHER', 'RISK_MANAGER', 'EXECUTION_ENGINE'];
  const agentLogData = [];
  for (let i = 0; i < 50; i++) {
    const pair = Math.random() > 0.3 ? allMarketPairs[Math.floor(Math.random() * allMarketPairs.length)] : null;
    agentLogData.push({
      agentName: agents[Math.floor(Math.random() * agents.length)],
      level: 'info' as 'info' | 'warn' | 'alert',
      message: `Simulated log message ${i} for active monitoring.`,
      metadata: { iteration: i, timestamp: new Date().toISOString() },
      marketPairId: pair?.id || null,
      createdAt: new Date(Date.now() - i * 1000 * 60 * 15),
    });
  }
  await db.insert(agentLogs).values(agentLogData);

  // 6. Trades (5)
  const tradeData = [];
  for (let i = 0; i < 5; i++) {
    const pair = allMarketPairs[Math.floor(Math.random() * allMarketPairs.length)];
    const entryPrice = (Math.random() * 0.8 + 0.1).toString();
    const isClosed = Math.random() > 0.3;
    const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
    
    tradeData.push({
      userId: userId!,
      marketPairId: pair.id,
      side: side,
      venue: (Math.random() > 0.5 ? 'polymarket' : 'kalshi') as 'polymarket' | 'kalshi',
      size: (Math.random() * 1000 + 100).toString(),
      entryPrice: entryPrice,
      exitPrice: isClosed ? (parseFloat(entryPrice) * (1 + (Math.random() - 0.4) * 0.1)).toString() : null,
      pnl: isClosed ? ((Math.random() - 0.4) * 500).toString() : null,
      status: (isClosed ? 'closed' : 'open') as 'closed' | 'open',
      txHash: `0x${randomUUID().replace(/-/g, '')}`,
      openedAt: new Date(Date.now() - i * 1000 * 60 * 60 * 24),
      closedAt: isClosed ? new Date(Date.now() - i * 1000 * 60 * 60 * 2) : null,
    });
  }
  await db.insert(trades).values(tradeData);

  // 7. Alpha Metrics (Historical)
  const alphaMetricData = [];
  for (let i = 0; i < 24; i++) {
    alphaMetricData.push({
      confidence: (Math.random() * 40 + 50).toFixed(2),
      regime: Math.random() > 0.7 ? 'High Volatility' : 'Mean Reversion',
      contributingAgents: { 
        MA: Math.random().toFixed(2), 
        WW: Math.random().toFixed(2), 
        ORCH: Math.random().toFixed(2) 
      },
      topOpportunity: { 
        symbol: allMarketPairs[Math.floor(Math.random() * allMarketPairs.length)].symbol,
        expectedReturn: (Math.random() * 15).toFixed(2) 
      },
      createdAt: new Date(Date.now() - i * 1000 * 60 * 60),
    });
  }
  await db.insert(alphaMetrics).values(alphaMetricData);

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
