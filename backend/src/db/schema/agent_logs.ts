import { pgTable, bigserial, varchar, timestamp, jsonb, integer, uuid, index } from 'drizzle-orm/pg-core';
import { marketPairs } from './market_pairs.js';
import { agentLogLevelEnum, aiProviderEnum } from './enums.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const agentLogs = pgTable('agent_logs', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  agentName: varchar('agent_name', { length: 255 }).notNull(),
  level: agentLogLevelEnum('level').notNull(),
  message: varchar('message', { length: 1000 }).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  marketPairId: uuid('market_pair_id').references(() => marketPairs.id),
  provider: aiProviderEnum('provider').notNull(),
  model: varchar('model', { length: 255 }).notNull(),
  latencyMs: integer('latency_ms'),
  tokensUsed: integer('tokens_used'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    marketPairIdIdx: index('agent_logs_market_pair_id_idx').on(table.marketPairId),
    createdAtIdx: index('agent_logs_created_at_idx').on(table.createdAt),
  };
});

export type AgentLog = InferSelectModel<typeof agentLogs>;
export type NewAgentLog = InferInsertModel<typeof agentLogs>;
