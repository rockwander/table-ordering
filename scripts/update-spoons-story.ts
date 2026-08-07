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

async function updateSpoonsStory() {
  console.log('🔄 Updating spoons story with new overlay image...\n');

  const imagePath = '/Users/raghav/Downloads/spoons-glasses-overlay.png';

  if (!fs.existsSync(imagePath)) {
    console.error('❌ Image not found at:', imagePath);
    return;
  }

  // Find the existing spoons story
  const { data: existingStory, error: fetchError } = await supabase
    .from('highlight_stories')
    .select('*')
    .eq('category_id', categoryId)
    .eq('display_order', 2)
    .single();

  if (fetchError || !existingStory) {
    console.error('❌ Error finding spoons story:', fetchError);
    return;
  }

  console.log('✓ Found existing spoons story');

  // Upload new image
  const imageFile = fs.readFileSync(imagePath);
  const fileName = `${Date.now()}_spoons_glasses_clean.png`;

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

  console.log('✓ New image uploaded');

  // Update the story with new image URL and remove caption
  const { error: updateError } = await supabase
    .from('highlight_stories')
    .update({
      image_url: publicUrl,
      caption: null,
      gujarati_caption: null
    })
    .eq('id', existingStory.id);

  if (updateError) {
    console.error('❌ Update error:', updateError);
    return;
  }

  console.log('✓ Story updated with new image (no caption)');

  console.log('\n✅ Update complete!');
  console.log('\n"Our Values" stories:');
  console.log('  1. Ocean/nature scene (no caption)');
  console.log('  2. Fresh spoons & glasses (no caption, clean overlay)');
  console.log('  3. Consciousness infographic (no caption)');
}

updateSpoonsStory().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
