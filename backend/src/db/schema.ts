import { pgTable, serial, text, timestamp, integer, doublePrecision } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const trades = pgTable('trades', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  symbol: text('symbol').notNull(),
  amount: doublePrecision('amount').notNull(),
  roi: doublePrecision('roi').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

