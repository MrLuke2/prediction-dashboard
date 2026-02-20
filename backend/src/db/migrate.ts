import { client } from './index.js';
import fs from 'fs';
import path from 'path';

async function migrate() {
  console.log('🚀 Running manual migration...');
  
  const sqlFile = path.join(process.cwd(), 'drizzle', '0000_sad_marvel_boy.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  try {
    console.log(`Executing SQL file...`);
    await client.unsafe(sql);
    console.log('✅ Migration successful!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate().then(() => process.exit(0));
