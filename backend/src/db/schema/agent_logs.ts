import { pgTable, bigserial, uuid, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { marketPairs } from './market_pairs.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { agentLogLevelEnum } from './enums.js';

export const agentLogs = pgTable('agent_logs', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  agentName: varchar('agent_name', { length: 100 }).notNull(),
  level: agentLogLevelEnum('level').notNull(),
  message: varchar('message', { length: 1024 }).notNull(),
  metadata: jsonb('metadata'),
  marketPairId: uuid('market_pair_id').references(() => marketPairs.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    marketPairIdIdx: index('agent_logs_market_pair_id_idx').on(table.marketPairId),
    createdAtIdx: index('agent_logs_created_at_idx').on(table.createdAt),
  };
});

export type AgentLog = InferSelectModel<typeof agentLogs>;
export type NewAgentLog = InferInsertModel<typeof agentLogs>;
