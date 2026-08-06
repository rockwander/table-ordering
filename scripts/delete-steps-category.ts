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

async function deleteCategory() {
  const categoryId = '45f6a0e0-2f4f-49a4-a193-d3324b4290fa'; // Steps to Order

  console.log('Deleting "Steps to Order" category...\n');

  // Delete category (will cascade delete stories if any)
  const { error: deleteError } = await supabase
    .from('highlight_categories')
    .delete()
    .eq('id', categoryId);

  if (deleteError) {
    console.error('Error deleting category:', deleteError);
    process.exit(1);
  }

  console.log('✓ "Steps to Order" category deleted successfully');
}

deleteCategory().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
