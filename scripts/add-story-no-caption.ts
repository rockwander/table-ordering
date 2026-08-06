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

async function addStory() {
  const categoryId = 'e1f85e45-fa67-4c31-877b-9564561fe262'; // Our Values category
  const imagePath = '/Users/raghav/Downloads/ChatGPT Image Aug 7, 2026, 01_27_31 AM.png';

  console.log('Adding story to "Our Values" category...\n');
  console.log('Uploading image...');

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    console.error('Error: Image file not found at:', imagePath);
    process.exit(1);
  }

  // Read the image file
  const imageFile = fs.readFileSync(imagePath);
  const fileName = `${Date.now()}_our_values_story_1.png`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('story-highlights')
    .upload(fileName, imageFile, {
      contentType: 'image/png',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    process.exit(1);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('story-highlights')
    .getPublicUrl(fileName);

  console.log('✓ Image uploaded:', publicUrl);

  // Insert story record
  const { data, error } = await supabase
    .from('highlight_stories')
    .insert({
      category_id: categoryId,
      image_url: publicUrl,
      caption: null,
      gujarati_caption: null,
      display_order: 1,
      duration: 5000
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating story:', error);
    process.exit(1);
  }

  console.log('\n✓ Story added successfully!');
  console.log('ID:', data.id);

  // Update category cover image if it doesn't have one
  const { data: catData } = await supabase
    .from('highlight_categories')
    .select('cover_image_url')
    .eq('id', categoryId)
    .single();

  if (catData && !catData.cover_image_url) {
    await supabase
      .from('highlight_categories')
      .update({ cover_image_url: publicUrl })
      .eq('id', categoryId);
    console.log('✓ Set as category cover image');
  }

  console.log('\n✓ All done! The story is now live.');
}

addStory().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
