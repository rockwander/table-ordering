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

async function uploadSpoonsStory() {
  console.log('📤 Uploading spoons & glasses story to "Our Values"...\n');

  const imagePath = '/Users/raghav/Downloads/spoons-glasses-overlay.png';

  if (!fs.existsSync(imagePath)) {
    console.error('❌ Image not found at:', imagePath);
    return;
  }

  const imageFile = fs.readFileSync(imagePath);
  const fileName = `${Date.now()}_spoons_glasses.png`;

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
      caption: 'Fresh spoons and glasses, stocked for your next meal',
      gujarati_caption: 'તમારા આગલા ભોજન માટે તાજા ચમચા અને ગ્લાસ ભરાયેલા',
      display_order: 3,
      duration: 5000
    });

  if (insertError) {
    console.error('❌ Insert error:', insertError);
    return;
  }

  console.log('✓ Story added to "Our Values"');

  console.log('\n✅ Upload complete!');
  console.log('\n"Our Values" now has 3 stories:');
  console.log('  1. Ocean/nature scene');
  console.log('  2. Consciousness infographic');
  console.log('  3. Fresh spoons & glasses (NEW)');
}

uploadSpoonsStory().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
