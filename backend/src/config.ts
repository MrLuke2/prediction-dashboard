import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NEXT_JWT_SECRET: z.string().min(32).optional(),
  POLYMARKET_API_KEY: z.string().optional(),
  KALSHI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),
  POLYGON_RPC_URL: z.string().url().optional(),
  WHALE_THRESHOLD_USD: z.string().transform(Number).default('10000'),
  OPERATOR_PRIVATE_KEY: z.string().optional(),
  MAX_POSITION_USD: z.string().transform(Number).default('1000'),
  PAPER_TRADING: z.string().transform((v) => v === 'true').default('true'),
});

export const config = envSchema.parse(process.env);

export type Config = z.infer<typeof envSchema>;
