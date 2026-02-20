import { pgTable, bigserial, numeric, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const alphaMetrics = pgTable('alpha_metrics', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  confidence: numeric('confidence', { precision: 5, scale: 2 }).notNull(),
  regime: varchar('regime', { length: 50 }).notNull(),
  contributingAgents: jsonb('contributing_agents').notNull(),
  topOpportunity: jsonb('top_opportunity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    createdAtIdx: index('alpha_metrics_created_at_idx').on(table.createdAt),
  };
});

export type AlphaMetric = InferSelectModel<typeof alphaMetrics>;
export type NewAlphaMetric = InferInsertModel<typeof alphaMetrics>;
