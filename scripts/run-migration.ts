import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('🚀 Running migration...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const migrationPath = path.join(process.cwd(), 'migrations', 'add_bills_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('\n📝 Executing migration SQL...\n');

    // Execute the entire SQL file
    await client.query(sql);

    console.log('✅ Migration executed successfully!');
    console.log('\n✨ Bills table created and configured!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await client.end();
    console.log('👋 Database connection closed');
  }
}

runMigration();
