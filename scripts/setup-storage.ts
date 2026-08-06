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

async function setupStorage() {
  console.log('Setting up story-highlights storage bucket...\n');

  // Try to create the bucket using SQL
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create storage bucket for story highlight images
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('story-highlights', 'story-highlights', true)
      ON CONFLICT (id) DO NOTHING;
    `
  });

  if (error) {
    console.log('Note: Could not create bucket via RPC (this is normal)');
    console.log('Error:', error.message);
    console.log('\nCreating bucket using Storage API instead...\n');

    // Try using the storage API directly
    const { data, error: bucketError } = await supabase.storage.createBucket('story-highlights', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✓ Storage bucket "story-highlights" already exists!');
      } else {
        console.error('Error creating bucket:', bucketError);
        process.exit(1);
      }
    } else {
      console.log('✓ Storage bucket "story-highlights" created successfully!');
    }
  } else {
    console.log('✓ Storage bucket created via SQL!');
  }

  console.log('\n✓ Storage setup complete!');
  console.log('You can now upload images to the story-highlights bucket.');
}

setupStorage().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
