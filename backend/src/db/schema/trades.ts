import { pgTable, uuid, varchar, timestamp, numeric, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { marketPairs } from './market_pairs';
import { tradeSideEnum, tradeVenueEnum, tradeStatusEnum, aiProviderEnum } from './enums';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const trades = pgTable('trades', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  marketPairId: uuid('market_pair_id').references(() => marketPairs.id).notNull(),
  side: tradeSideEnum('side').notNull(),
  venue: tradeVenueEnum('venue').notNull(),
  size: numeric('size', { precision: 20, scale: 6 }).notNull(),
  entryPrice: numeric('entry_price', { precision: 20, scale: 6 }).notNull(),
  exitPrice: numeric('exit_price', { precision: 20, scale: 6 }),
  pnl: numeric('pnl', { precision: 20, scale: 6 }),
  status: tradeStatusEnum('status').default('pending').notNull(),
  aiProvider: aiProviderEnum('ai_provider').notNull(),
  aiModel: varchar('ai_model', { length: 255 }).notNull(),
  aiConfidence: numeric('ai_confidence', { precision: 5, scale: 2 }),
  txHash: varchar('tx_hash', { length: 255 }),
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  emergencyClosedAt: timestamp('emergency_closed_at', { withTimezone: true }),
  emergencyReason: varchar('emergency_reason', { length: 255 }),
}, (table) => {
  return {
    userIdIdx: index('trades_user_id_idx').on(table.userId),
    marketPairIdIdx: index('trades_market_pair_id_idx').on(table.marketPairId),
  };
});

export type Trade = InferSelectModel<typeof trades>;
export type NewTrade = InferInsertModel<typeof trades>;
