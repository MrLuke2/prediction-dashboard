import { pgTable, uuid, varchar, text, timestamp, index, integer, doublePrecision } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const whaleMovements = pgTable('whale_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: varchar('wallet_address', { length: 255 }).notNull(),
  txHash: varchar('tx_hash', { length: 255 }).unique().notNull(),
  blockNumber: integer('block_number').notNull(),
  amount: text('amount').notNull(), // Wei as string
  amountUsd: doublePrecision('amount_usd').notNull(),
  direction: text('direction').notNull(), // 'buy' | 'sell'
  marketAddress: text('market_address').notNull(),
  marketName: text('market_name'),
  level: text('level').default('info').notNull(), // 'info' | 'alert'
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    walletAddressIdx: index('whale_movements_wallet_address_idx').on(table.walletAddress),
    timestampIdx: index('whale_movements_timestamp_idx').on(table.timestamp),
  };
});

export type WhaleMovement = InferSelectModel<typeof whaleMovements>;
export type NewWhaleMovement = InferInsertModel<typeof whaleMovements>;
