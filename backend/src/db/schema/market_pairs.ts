import { pgTable, uuid, varchar, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const marketPairs = pgTable('market_pairs', {
  id: uuid('id').primaryKey().defaultRandom(),
  symbol: varchar('symbol', { length: 50 }).notNull().unique(),
  polymarketSlug: varchar('polymarket_slug', { length: 255 }),
  kalshiTicker: varchar('kalshi_ticker', { length: 255 }),
  category: varchar('category', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastPriceAt: timestamp('last_price_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}).notNull(),
});

export type MarketPair = InferSelectModel<typeof marketPairs>;
export type NewMarketPair = InferInsertModel<typeof marketPairs>;
