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

async function createOurValuesCategory() {
  console.log('Creating "Our Values" highlight category...\n');

  const { data, error } = await supabase
    .from('highlight_categories')
    .insert({
      name: 'Our Values',
      gujarati_name: 'અમારા મૂલ્યો',
      cover_image_url: null,
      display_order: 1,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    process.exit(1);
  }

  console.log('✓ Category created successfully!');
  console.log('ID:', data.id);
  console.log('Name:', data.name);
  console.log('Gujarati Name:', data.gujarati_name);
  console.log('Display Order:', data.display_order);
  console.log('\nYou can now add stories to this category using:');
  console.log('npx tsx scripts/highlights-cli.ts add-story');
}

createOurValuesCategory();
