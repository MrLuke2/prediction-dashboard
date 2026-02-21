import { pgTable, index, bigserial, uuid, numeric, timestamp } from 'drizzle-orm/pg-core';
import { marketPairs } from './market_pairs';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const priceSnapshots = pgTable('price_snapshots', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  marketPairId: uuid('market_pair_id').references(() => marketPairs.id).notNull(),
  polymarketPrice: numeric('polymarket_price', { precision: 10, scale: 4 }),
  kalshiPrice: numeric('kalshi_price', { precision: 10, scale: 4 }),
  spread: numeric('spread', { precision: 10, scale: 4 }),
  volume24h: numeric('volume_24h', { precision: 20, scale: 2 }),
  capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    marketPairCapturedIdx: index('market_pair_captured_idx').on(table.marketPairId, table.capturedAt),
  };
});

export type PriceSnapshot = InferSelectModel<typeof priceSnapshots>;
export type NewPriceSnapshot = InferInsertModel<typeof priceSnapshots>;
