#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPolicies() {
  console.log('Setting up storage policies...\n');
  console.log('Please run the following SQL in your Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/xjozstiklaqtgdmamfue/sql/new\n');
  console.log('='.repeat(80));

  const sql = `-- Allow public read access to all files in the bucket
CREATE POLICY "Public read access for story highlights"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'story-highlights');

-- Allow anyone to upload files
CREATE POLICY "Allow uploads to story highlights"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'story-highlights');

-- Allow anyone to delete files
CREATE POLICY "Allow delete from story highlights"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'story-highlights');

-- Allow anyone to update files
CREATE POLICY "Allow updates to story highlights"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'story-highlights');`;

  console.log(sql);
  console.log('='.repeat(80));
  console.log('\nAfter running the SQL, re-run the image upload script:');
  console.log('npx tsx scripts/add-story-no-caption.ts');
}

setupPolicies();
