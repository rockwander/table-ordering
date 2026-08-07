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

const stories = [
  {
    imagePath: '/Users/raghav/Downloads/step3-illustration.png',
    caption: '3. Staff confirms your order in person',
    gujaratiCaption: '3. સ્ટાફ તમારા ઓર્ડરની રૂબરૂ પુષ્ટિ કરે છે',
    order: 3
  },
  {
    imagePath: '/Users/raghav/Downloads/step6-illustration.png',
    caption: '6. Pay at the counter when ready',
    gujaratiCaption: '6. તૈયાર થાઓ ત્યારે કાઉન્ટર પર ચૂકવો',
    order: 6
  }
];

async function uploadStory(story: typeof stories[0]) {
  console.log(`\nUploading Story ${story.order}: ${story.caption}`);

  if (!fs.existsSync(story.imagePath)) {
    console.error(`❌ Error: Image file not found at: ${story.imagePath}`);
    return;
  }

  const imageFile = fs.readFileSync(story.imagePath);
  const fileName = `${Date.now()}_step_${story.order}.png`;

  console.log('   Uploading to Supabase Storage...');

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('story-highlights')
    .upload(fileName, imageFile, {
      contentType: 'image/png',
      upsert: false
    });

  if (uploadError) {
    console.error('   ❌ Error uploading image:', uploadError);
    return;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('story-highlights')
    .getPublicUrl(fileName);

  console.log('   ✓ Image uploaded');

  const { data, error } = await supabase
    .from('highlight_stories')
    .insert({
      category_id: categoryId,
      image_url: publicUrl,
      caption: story.caption,
      gujarati_caption: story.gujaratiCaption,
      display_order: story.order,
      duration: 7000
    })
    .select()
    .single();

  if (error) {
    console.error('   ❌ Error creating story:', error);
    return;
  }

  console.log(`   ✓ Story ${story.order} added successfully!`);
}

async function main() {
  console.log('═'.repeat(70));
  console.log('  Uploading Missing Steps (3 & 6)');
  console.log('═'.repeat(70));

  for (const story of stories) {
    await uploadStory(story);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('  ✅ All "Steps to Order" stories completed!');
  console.log('═'.repeat(70));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
