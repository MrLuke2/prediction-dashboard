import { pgTable, bigserial, uuid, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { marketPairs } from './market_pairs.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const priceSnapshots = pgTable('price_snapshots', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  marketPairId: uuid('market_pair_id').references(() => marketPairs.id).notNull(),
  polymarketPrice: numeric('polymarket_price', { precision: 10, scale: 4 }).notNull(),
  kalshiPrice: numeric('kalshi_price', { precision: 10, scale: 4 }).notNull(),
  spread: numeric('spread', { precision: 10, scale: 4 }).notNull(),
  volume24h: numeric('volume_24h', { precision: 20, scale: 2 }).notNull(),
  capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    marketPairIdIdx: index('price_snapshots_market_pair_id_idx').on(table.marketPairId),
    capturedAtIdx: index('price_snapshots_captured_at_idx').on(table.capturedAt),
  };
});

export type PriceSnapshot = InferSelectModel<typeof priceSnapshots>;
export type NewPriceSnapshot = InferInsertModel<typeof priceSnapshots>;

import { relations } from 'drizzle-orm';

export const priceSnapshotsRelations = relations(priceSnapshots, ({ one }) => ({
  marketPair: one(marketPairs, { fields: [priceSnapshots.marketPairId], references: [marketPairs.id] }),
}));

