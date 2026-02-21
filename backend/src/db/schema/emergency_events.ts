import { pgTable, uuid, varchar, timestamp, integer, numeric, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const emergencyEvents = pgTable('emergency_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  triggeredAt: timestamp('triggered_at', { withTimezone: true }).defaultNow().notNull(),
  triggerReason: varchar('trigger_reason', { length: 255 }).notNull(),
  tradesClosed: integer('trades_closed').default(0).notNull(),
  totalPnlImpact: numeric('total_pnl_impact', { precision: 20, scale: 6 }).default('0').notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}).notNull(),
});

export type EmergencyEvent = InferSelectModel<typeof emergencyEvents>;
export type NewEmergencyEvent = InferInsertModel<typeof emergencyEvents>;
