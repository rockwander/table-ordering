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

const categoryId = 'e1f85e45-fa67-4c31-877b-9564561fe262'; // Our Values

async function fixOrder() {
  console.log('🔄 Updating story order in "Our Values"...\n');

  // Get the spoons story (currently order 3)
  const { data: stories, error: fetchError } = await supabase
    .from('highlight_stories')
    .select('*')
    .eq('category_id', categoryId)
    .order('display_order');

  if (fetchError) {
    console.error('Error fetching stories:', fetchError);
    return;
  }

  console.log('Current order:');
  stories?.forEach(s => {
    console.log(`  ${s.display_order}. ${s.caption || 'No caption'}`);
  });

  // Update: Move consciousness (currently 2) to 3
  const consciousnessStory = stories?.find(s => s.display_order === 2);
  if (consciousnessStory) {
    await supabase
      .from('highlight_stories')
      .update({ display_order: 3 })
      .eq('id', consciousnessStory.id);
    console.log('\n✓ Moved consciousness story to position 3');
  }

  // Update: Move spoons (currently 3) to 2
  const spoonsStory = stories?.find(s => s.caption?.includes('spoons'));
  if (spoonsStory) {
    await supabase
      .from('highlight_stories')
      .update({ display_order: 2 })
      .eq('id', spoonsStory.id);
    console.log('✓ Moved spoons story to position 2');
  }

  console.log('\n✅ Order updated!');
  console.log('\nNew order:');
  console.log('  1. Ocean/nature scene');
  console.log('  2. Fresh spoons & glasses');
  console.log('  3. Consciousness infographic');
}

fixOrder().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
