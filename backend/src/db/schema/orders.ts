import { pgTable, uuid, varchar, numeric, timestamp, index, text } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { marketPairs } from './market_pairs.js';
import { trades } from './trades.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { orderStatusEnum, tradeVenueEnum, tradeSideEnum } from './enums.js';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tradeId: uuid('trade_id').references(() => trades.id),
  userId: uuid('user_id').references(() => users.id).notNull(),
  marketPairId: uuid('market_pair_id').references(() => marketPairs.id).notNull(),
  venue: tradeVenueEnum('venue').notNull(),
  side: tradeSideEnum('side').notNull(),
  size: numeric('size', { precision: 20, scale: 6 }).notNull(),
  price: numeric('price', { precision: 10, scale: 4 }),
  filledSize: numeric('filled_size', { precision: 20, scale: 6 }).default('0'),
  filledPrice: numeric('filled_price', { precision: 10, scale: 4 }),
  status: orderStatusEnum('status').default('pending').notNull(),
  externalOrderId: varchar('external_order_id', { length: 255 }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    tradeIdIdx: index('orders_trade_id_idx').on(table.tradeId),
    userIdIdx: index('orders_user_id_idx').on(table.userId),
    statusIdx: index('orders_status_idx').on(table.status),
  };
});

export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;

import { relations } from 'drizzle-orm';

export const ordersRelations = relations(orders, ({ one }) => ({
  trade: one(trades, { fields: [orders.tradeId], references: [trades.id] }),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  marketPair: one(marketPairs, { fields: [orders.marketPairId], references: [marketPairs.id] }),
}));

