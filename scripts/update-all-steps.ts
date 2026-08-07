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

async function updateSteps() {
  console.log('═'.repeat(70));
  console.log('  Updating "Steps to Order" - Complete Flow');
  console.log('═'.repeat(70));

  // Step 1: Delete all existing stories in this category
  console.log('\n🗑️  Removing old stories...');
  const { error: deleteError } = await supabase
    .from('highlight_stories')
    .delete()
    .eq('category_id', categoryId);

  if (deleteError) {
    console.error('Error deleting old stories:', deleteError);
    return;
  }
  console.log('✓ Old stories removed');

  // Step 2: Upload new complete flow
  const stories = [
    {
      imagePath: '/Users/raghav/Downloads/step0-intro.png',
      caption: 'Steps to Order @ Ramani\'s Cafe',
      gujaratiCaption: 'રમણીઝ કૅફે માં ઓર્ડર કરવાના પગલાં',
      order: 0
    },
    {
      imagePath: '/Users/raghav/Downloads/WhatsApp Image 2026-08-07 at 14.10.28.jpeg',
      caption: '1. Browse menu and select items',
      gujaratiCaption: '1. મેનુ બ્રાઉઝ કરો અને વસ્તુઓ પસંદ કરો',
      order: 1
    },
    {
      imagePath: '/Users/raghav/Downloads/WhatsApp Image 2026-08-07 at 14.10.29.jpeg',
      caption: '2. Review and place your order',
      gujaratiCaption: '2. તમારા ઓર્ડરની સમીક્ષા કરો અને પ્લેસ કરો',
      order: 2
    },
    {
      imagePath: '/Users/raghav/Downloads/step3-illustration.png',
      caption: '3. Staff confirms your order in person',
      gujaratiCaption: '3. સ્ટાફ તમારા ઓર્ડરની રૂબરૂ પુષ્ટિ કરે છે',
      order: 3
    },
    {
      imagePath: '/Users/raghav/Downloads/WhatsApp Image 2026-08-07 at 14.30.10.jpeg',
      caption: '4. Add more items anytime with outstanding orders',
      gujaratiCaption: '4. બાકી ઓર્ડર્સ સાથે કોઈપણ સમયે વધુ વસ્તુઓ ઉમેરો',
      order: 4
    },
    {
      imagePath: '/Users/raghav/Downloads/WhatsApp Image 2026-08-07 at 14.10.30.jpeg',
      caption: '5. View bill anytime by clicking Settle Bill',
      gujaratiCaption: '5. બિલ સેટલ પર ક્લિક કરીને કોઈપણ સમયે બિલ જુઓ',
      order: 5
    },
    {
      imagePath: '/Users/raghav/Downloads/step6-illustration.png',
      caption: '6. Pay at the counter when ready',
      gujaratiCaption: '6. તૈયાર થાઓ ત્યારે કાઉન્ટર પર ચૂકવો',
      order: 6
    }
  ];

  console.log('\n📤 Uploading updated stories...\n');

  for (const story of stories) {
    console.log(`   Story ${story.order}: ${story.caption}`);

    if (!fs.existsSync(story.imagePath)) {
      console.error(`   ❌ Image not found: ${story.imagePath}`);
      continue;
    }

    const imageFile = fs.readFileSync(story.imagePath);
    const ext = path.extname(story.imagePath);
    const fileName = `${Date.now()}_step_${story.order}${ext}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('story-highlights')
      .upload(fileName, imageFile, {
        contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error(`   ❌ Upload error:`, uploadError);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('story-highlights')
      .getPublicUrl(fileName);

    // Insert story record
    const { error: insertError } = await supabase
      .from('highlight_stories')
      .insert({
        category_id: categoryId,
        image_url: publicUrl,
        caption: story.caption,
        gujarati_caption: story.gujaratiCaption,
        display_order: story.order,
        duration: story.order === 0 ? 5000 : 7000 // Intro 5s, steps 7s
      });

    if (insertError) {
      console.error(`   ❌ Insert error:`, insertError);
      continue;
    }

    console.log(`   ✓ Uploaded`);

    // Set intro as category cover
    if (story.order === 0) {
      await supabase
        .from('highlight_categories')
        .update({ cover_image_url: publicUrl })
        .eq('id', categoryId);
    }

    // Small delay to avoid timestamp conflicts
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '═'.repeat(70));
  console.log('  ✅ Complete! 7 stories uploaded');
  console.log('═'.repeat(70));
  console.log('\nStory Flow:');
  console.log('  0. Intro: Steps to Order @ Ramani\'s Cafe');
  console.log('  1. Browse menu and select items');
  console.log('  2. Review and place your order');
  console.log('  3. Staff confirms (illustration)');
  console.log('  4. Add more items (NEW IMAGE)');
  console.log('  5. View bill anytime');
  console.log('  6. Pay at counter (illustration)');
}

updateSteps().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
