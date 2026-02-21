import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Auth secrets (separate for access + refresh)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  REFRESH_SECRET: z.string().min(32, 'REFRESH_SECRET must be at least 32 characters'),
  NEXT_JWT_SECRET: z.string().min(32).optional(), // For JWT rotation

  // Encryption
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),

  // Platform AI API Keys (defaults when users don't BYOK)
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // Defaults
  DEFAULT_AI_PROVIDER: z.enum(['anthropic', 'openai', 'gemini']).default('anthropic'),
  DEFAULT_AI_MODEL: z.string().default('claude-sonnet-4-5'),

  // Legacy keys (kept for backward compat)
  POLYMARKET_API_KEY: z.string().optional(),
  KALSHI_API_KEY: z.string().optional(),
  POLYGON_RPC_URL: z.string().url().optional(),
  OPERATOR_PRIVATE_KEY: z.string().optional(),

  // Trading
  PAPER_TRADING: z.string().transform((v) => v === 'true').default('true'),
  MAX_POSITION_USD: z.string().transform(Number).default('1000'),
  MIN_CONFIDENCE_THRESHOLD: z.string().transform(Number).default('60'),
  ARB_THRESHOLD: z.string().transform(Number).default('0.03'),
  WHALE_THRESHOLD_USD: z.string().transform(Number).default('10000'),
});

export const config = envSchema.parse(process.env);

export type Config = z.infer<typeof envSchema>;
