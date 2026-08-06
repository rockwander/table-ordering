import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('Running story highlights migrations...\n');

  // Read migration files
  const migration1 = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/20250807000001_create_story_highlights.sql'),
    'utf-8'
  );

  const migration2 = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/20250807000002_create_story_highlights_storage.sql'),
    'utf-8'
  );

  // Note: We'll need to run these through SQL editor or use service role key
  // For now, just output the SQL
  console.log('Migration 1 (Tables):');
  console.log('Copy and run this in Supabase SQL Editor:');
  console.log('='.repeat(80));
  console.log(migration1);
  console.log('='.repeat(80));
  console.log('\n');

  console.log('Migration 2 (Storage):');
  console.log('Copy and run this in Supabase SQL Editor:');
  console.log('='.repeat(80));
  console.log(migration2);
  console.log('='.repeat(80));
}

runMigrations();
