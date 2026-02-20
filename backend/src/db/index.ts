import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root if not already loaded
dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// For pool connection: max: 20
export const client = postgres(connectionString, { max: 20 });
export const db = drizzle(client, { schema });

export type DbClient = typeof db;
