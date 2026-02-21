import { pgTable, uuid, varchar, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { userPlanEnum, aiProviderEnum } from './enums.js';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  plan: userPlanEnum('plan').default('free').notNull(),
  preferredAiProvider: aiProviderEnum('preferred_ai_provider').default('anthropic').notNull(),
  preferredModel: varchar('preferred_model', { length: 255 }).default('claude-sonnet-4-5').notNull(),
  apiKeys: jsonb('api_keys').$type<{
    anthropic?: string;
    openai?: string;
    gemini?: string;
  }>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
