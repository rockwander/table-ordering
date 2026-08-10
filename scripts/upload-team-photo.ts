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

async function uploadTeamPhoto() {
  console.log('📤 Uploading team photo to "Our Values"...\n');

  const imagePath = '/Users/raghav/table-ordering/public/WhatsApp Image 2026-08-07 at 22.37.17.jpeg';

  if (!fs.existsSync(imagePath)) {
    console.error('❌ Image not found at:', imagePath);
    return;
  }

  const imageFile = fs.readFileSync(imagePath);
  const fileName = `${Date.now()}_team_photo.jpeg`;

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

  // Get current max display_order
  const { data: stories, error: fetchError } = await supabase
    .from('highlight_stories')
    .select('display_order')
    .eq('category_id', categoryId)
    .order('display_order', { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error('❌ Error fetching stories:', fetchError);
    return;
  }

  const nextOrder = stories && stories.length > 0 ? stories[0].display_order + 1 : 4;

  const { error: insertError } = await supabase
    .from('highlight_stories')
    .insert({
      category_id: categoryId,
      image_url: publicUrl,
      caption: 'Proudly women-led, warmly welcoming everyone.',
      gujarati_caption: 'ગર્વપૂર્વક મહિલા-નેતૃત્વ, હૃદયપૂર્વક બધાનું સ્વાગત.',
      display_order: nextOrder,
      duration: 5000
    });

  if (insertError) {
    console.error('❌ Insert error:', insertError);
    return;
  }

  console.log(`✓ Story added at position ${nextOrder}`);

  console.log('\n✅ Upload complete!');
  console.log('\n"Our Values" now has 4 stories:');
  console.log('  1. Ocean/nature scene');
  console.log('  2. Fresh spoons & glasses');
  console.log('  3. Consciousness infographic');
  console.log(`  ${nextOrder}. Team photo - Women-led cafe (NEW)`);
}

uploadTeamPhoto().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
