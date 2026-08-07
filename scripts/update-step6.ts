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

async function updateStep6() {
  console.log('═'.repeat(70));
  console.log('  Updating Step 6 with New Image');
  console.log('═'.repeat(70));

  // Delete old step 6
  console.log('\n🗑️  Removing old step 6...');
  const { error: deleteError } = await supabase
    .from('highlight_stories')
    .delete()
    .eq('category_id', categoryId)
    .eq('display_order', 6);

  if (deleteError) {
    console.error('Error deleting old step 6:', deleteError);
    return;
  }
  console.log('✓ Old step 6 removed');

  // Upload new step 6
  const imagePath = '/Users/raghav/table-ordering/public/WhatsApp Image 2026-08-07 at 14.10.29 (2).jpeg';
  const caption = '6. Confirm new order along with outstanding orders';
  const gujaratiCaption = '6. બાકી ઓર્ડર્સ સાથે નવા ઓર્ડરની પુષ્ટિ કરો';

  console.log(`\n📤 Uploading new step 6...`);
  console.log(`   Caption: ${caption}`);

  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Image not found: ${imagePath}`);
    return;
  }

  const imageFile = fs.readFileSync(imagePath);
  const fileName = `${Date.now()}_step_6.jpeg`;

  const { error: uploadError } = await supabase.storage
    .from('story-highlights')
    .upload(fileName, imageFile, {
      contentType: 'image/jpeg',
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
      caption: caption,
      gujarati_caption: gujaratiCaption,
      display_order: 6,
      duration: 7000
    });

  if (insertError) {
    console.error('❌ Insert error:', insertError);
    return;
  }

  console.log('✓ New step 6 added successfully');

  console.log('\n' + '═'.repeat(70));
  console.log('  ✅ Step 6 Updated!');
  console.log('═'.repeat(70));
  console.log('\nUpdated Flow:');
  console.log('  0. Intro: Steps to Order @ Ramani\'s Cafe');
  console.log('  1. Browse menu and select items');
  console.log('  2. Review and place your order');
  console.log('  3. Staff confirms (illustration)');
  console.log('  4. Add more items anytime');
  console.log('  5. View bill anytime');
  console.log('  6. Confirm new order with outstanding orders (NEW)');
}

updateStep6().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
