import { pgTable, uuid, varchar, timestamp, numeric, boolean, index } from 'drizzle-orm/pg-core';
import { marketPairs } from './market_pairs.js';
import { whaleDirectionEnum, tradeVenueEnum, aiProviderEnum } from './enums.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const whaleMovements = pgTable('whale_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: varchar('wallet_address', { length: 255 }).notNull(),
  marketPairId: uuid('market_pair_id').references(() => marketPairs.id),
  amountUsd: numeric('amount_usd', { precision: 20, scale: 2 }).notNull(),
  direction: whaleDirectionEnum('direction').notNull(),
  venue: tradeVenueEnum('venue').notNull(),
  txHash: varchar('tx_hash', { length: 255 }),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
  flaggedByProvider: aiProviderEnum('flagged_by_provider').notNull(),
  label: varchar('label', { length: 255 }),
  isKnownWhale: boolean('is_known_whale').default(false).notNull(),
}, (table) => {
  return {
    marketPairIdIdx: index('whale_movements_market_pair_id_idx').on(table.marketPairId),
    walletAddressIdx: index('whale_movements_wallet_address_idx').on(table.walletAddress),
  };
});

export type WhaleMovement = InferSelectModel<typeof whaleMovements>;
export type NewWhaleMovement = InferInsertModel<typeof whaleMovements>;
