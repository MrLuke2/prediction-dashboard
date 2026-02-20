import { pgTable, uuid, varchar, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { marketPairs } from './market_pairs.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tradeSideEnum, tradeVenueEnum, tradeStatusEnum } from './enums.js';

export const trades = pgTable('trades', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  marketPairId: uuid('market_pair_id').references(() => marketPairs.id).notNull(),
  side: tradeSideEnum('side').notNull(),
  venue: tradeVenueEnum('venue').notNull(),
  size: numeric('size', { precision: 20, scale: 6 }).notNull(),
  entryPrice: numeric('entry_price', { precision: 10, scale: 4 }).notNull(),
  exitPrice: numeric('exit_price', { precision: 10, scale: 4 }),
  pnl: numeric('pnl', { precision: 20, scale: 6 }),
  status: tradeStatusEnum('status').default('open').notNull(),
  txHash: varchar('tx_hash', { length: 255 }),
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
}, (table) => {
  return {
    userIdIdx: index('trades_user_id_idx').on(table.userId),
    marketPairIdIdx: index('trades_market_pair_id_idx').on(table.marketPairId),
    statusIdx: index('trades_status_idx').on(table.status),
    openedAtIdx: index('trades_opened_at_idx').on(table.openedAt),
  };
});

export type Trade = InferSelectModel<typeof trades>;
export type NewTrade = InferInsertModel<typeof trades>;

import { relations } from 'drizzle-orm';
import { orders } from './orders.js';

export const tradesRelations = relations(trades, ({ one, many }) => ({
  user: one(users, { fields: [trades.userId], references: [users.id] }),
  marketPair: one(marketPairs, { fields: [trades.marketPairId], references: [marketPairs.id] }),
  orders: many(orders),
}));

