import { pgTable, bigserial, varchar, timestamp, integer, numeric, boolean, uuid, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { aiProviderEnum } from './enums';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const aiUsageMetrics = pgTable('ai_usage_metrics', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  provider: aiProviderEnum('provider').notNull(),
  model: varchar('model', { length: 255 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  agentName: varchar('agent_name', { length: 255 }).notNull(),
  tokensInput: integer('tokens_input').default(0).notNull(),
  tokensOutput: integer('tokens_output').default(0).notNull(),
  latencyMs: integer('latency_ms'),
  costUsd: numeric('cost_usd', { precision: 10, scale: 6 }).default('0').notNull(),
  success: boolean('success').default(true).notNull(),
  errorCode: varchar('error_code', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    providerCreatedAtIdx: index('ai_usage_provider_created_idx').on(table.provider, table.createdAt),
    userIdCreatedAtIdx: index('ai_usage_user_created_idx').on(table.userId, table.createdAt),
  };
});

export type AiUsageMetric = InferSelectModel<typeof aiUsageMetrics>;
export type NewAiUsageMetric = InferInsertModel<typeof aiUsageMetrics>;
