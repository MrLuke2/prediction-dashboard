import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  POLYMARKET_API_KEY: z.string().optional(),
  KALSHI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  POLYGON_RPC_URL: z.string().url().optional(),
});

export const config = envSchema.parse(process.env);

export type Config = z.infer<typeof envSchema>;
