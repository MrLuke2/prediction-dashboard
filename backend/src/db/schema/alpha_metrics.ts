import { pgTable, bigserial, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
import { alphaRegimeEnum, aiProviderEnum } from './enums.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const alphaMetrics = pgTable('alpha_metrics', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  confidence: numeric('confidence', { precision: 5, scale: 2 }).notNull(),
  regime: alphaRegimeEnum('regime').notNull(),
  contributingAgents: jsonb('contributing_agents').$type<{
    fundamentalist: { score: number; provider: string; model: string };
    sentiment: { score: number; provider: string; model: string };
    risk: { score: number; provider: string; model: string };
  }>().notNull(),
  topOpportunity: jsonb('top_opportunity').default({}).notNull(),
  generatedByProvider: aiProviderEnum('generated_by_provider').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AlphaMetric = InferSelectModel<typeof alphaMetrics>;
export type NewAlphaMetric = InferInsertModel<typeof alphaMetrics>;
