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

async function uploadHealthyStories() {
  console.log('📤 Uploading Healthy @ Ramani\'s stories...\n');

  // Get the Healthy @ Ramani's category ID
  const { data: category, error: categoryError } = await supabase
    .from('highlight_categories')
    .select('id')
    .eq('name', 'Healthy @ Ramani\'s')
    .single();

  if (categoryError || !category) {
    console.error('Error finding Healthy @ Ramani\'s category:', categoryError);
    process.exit(1);
  }

  const categoryId = category.id;
  console.log('✓ Found category ID:', categoryId);
  console.log();

  // Upload first image
  console.log('Step 1: Uploading first healthy food image...');
  const imagePath1 = '/Users/raghav/table-ordering/public/healthy-1.png';

  if (!fs.existsSync(imagePath1)) {
    console.error(`Error: Image not found at ${imagePath1}`);
    process.exit(1);
  }

  const imageFile1 = fs.readFileSync(imagePath1);
  const fileName1 = `${Date.now()}_healthy_1.png`;

  const { data: uploadData1, error: uploadError1 } = await supabase.storage
    .from('story-highlights')
    .upload(fileName1, imageFile1, {
      contentType: 'image/png',
      upsert: false
    });

  if (uploadError1) {
    console.error('Error uploading image 1:', uploadError1);
    process.exit(1);
  }

  // Get public URL
  const { data: { publicUrl: publicUrl1 } } = supabase.storage
    .from('story-highlights')
    .getPublicUrl(fileName1);

  console.log('✓ Image 1 uploaded:', publicUrl1);
  console.log();

  // Upload second image
  console.log('Step 2: Uploading second healthy food image...');
  const imagePath2 = '/Users/raghav/table-ordering/public/healthy-2.png';

  if (!fs.existsSync(imagePath2)) {
    console.error(`Error: Image not found at ${imagePath2}`);
    process.exit(1);
  }

  const imageFile2 = fs.readFileSync(imagePath2);
  const fileName2 = `${Date.now() + 1}_healthy_2.png`;

  const { data: uploadData2, error: uploadError2 } = await supabase.storage
    .from('story-highlights')
    .upload(fileName2, imageFile2, {
      contentType: 'image/png',
      upsert: false
    });

  if (uploadError2) {
    console.error('Error uploading image 2:', uploadError2);
    process.exit(1);
  }

  // Get public URL
  const { data: { publicUrl: publicUrl2 } } = supabase.storage
    .from('story-highlights')
    .getPublicUrl(fileName2);

  console.log('✓ Image 2 uploaded:', publicUrl2);
  console.log();

  // Create story records
  console.log('Step 3: Creating story records...');

  const { data: story1, error: error1 } = await supabase
    .from('highlight_stories')
    .insert({
      category_id: categoryId,
      image_url: publicUrl1,
      caption: 'Nutritious and delicious options for your healthy lifestyle',
      gujarati_caption: 'તમારી સ્વસ્થ જીવનશૈલી માટે પોષક અને સ્વાદિષ્ટ વિકલ્પો',
      display_order: 1,
      duration: 5000
    })
    .select()
    .single();

  if (error1) {
    console.error('Error creating story 1:', error1);
    process.exit(1);
  }

  console.log('✓ Story 1 created (ID:', story1.id, ')');

  const { data: story2, error: error2 } = await supabase
    .from('highlight_stories')
    .insert({
      category_id: categoryId,
      image_url: publicUrl2,
      caption: 'Fresh, healthy choices made with care',
      gujarati_caption: 'તાજા, સ્વસ્થ પસંદગીઓ કાળજીપૂર્વક બનાવેલ',
      display_order: 2,
      duration: 5000
    })
    .select()
    .single();

  if (error2) {
    console.error('Error creating story 2:', error2);
    process.exit(1);
  }

  console.log('✓ Story 2 created (ID:', story2.id, ')');
  console.log('\n✅ Successfully added 2 stories to Healthy @ Ramani\'s category!');
}

uploadHealthyStories().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
