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

const categoryId = 'd9ff9386-fc3d-4830-bc1c-60fcc2d120bd'; // Steps to Order

async function uploadIntro() {
  console.log('📤 Uploading intro illustration...\n');

  const imagePath = '/Users/raghav/Downloads/step0-intro.png';

  if (!fs.existsSync(imagePath)) {
    console.error('❌ Intro file not found at:', imagePath);
    return;
  }

  const imageFile = fs.readFileSync(imagePath);
  const fileName = `${Date.now()}_step_0_intro.png`;

  const { error: uploadError } = await supabase.storage
    .from('story-highlights')
    .upload(fileName, imageFile, {
      contentType: 'image/png',
      upsert: false
    });

  if (uploadError) {
    console.error('❌ Upload error:', uploadError);
    return;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('story-highlights')
    .getPublicUrl(fileName);

  console.log('✓ Image uploaded');

  const { error: insertError } = await supabase
    .from('highlight_stories')
    .insert({
      category_id: categoryId,
      image_url: publicUrl,
      caption: 'Steps to Order @ Ramani\'s Cafe',
      gujarati_caption: 'રમણીઝ કૅફે માં ઓર્ડર કરવાના પગલાં',
      display_order: 0,
      duration: 5000
    });

  if (insertError) {
    console.error('❌ Insert error:', insertError);
    return;
  }

  console.log('✓ Intro story added');

  // Set as category cover
  await supabase
    .from('highlight_categories')
    .update({ cover_image_url: publicUrl })
    .eq('id', categoryId);

  console.log('✓ Set as category cover');

  console.log('\n✅ Intro uploaded successfully!');
  console.log('\nComplete Flow (8 stories):');
  console.log('  0. Intro: Steps to Order @ Ramani\'s Cafe (Burgundy/Bree Serif)');
  console.log('  1. Browse menu and select items');
  console.log('  2. Review and place your order');
  console.log('  3. Staff confirms your order');
  console.log('  4. Add more items anytime');
  console.log('  5. Confirm new order with outstanding orders');
  console.log('  6. Click Settle Bill to view total');
  console.log('  7. Pay at counter');
}

uploadIntro().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
