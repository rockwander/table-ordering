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

async function fixStepOrder() {
  console.log('═'.repeat(70));
  console.log('  Fixing Step Order - Inserting New Step 5');
  console.log('═'.repeat(70));

  // Step 1: Get all existing stories
  const { data: existingStories, error: fetchError } = await supabase
    .from('highlight_stories')
    .select('*')
    .eq('category_id', categoryId)
    .order('display_order');

  if (fetchError) {
    console.error('Error fetching stories:', fetchError);
    return;
  }

  console.log('\n📋 Current stories:');
  existingStories?.forEach(s => {
    console.log(`   ${s.display_order}. ${s.caption}`);
  });

  // Step 2: Delete all existing stories
  console.log('\n🗑️  Removing all stories temporarily...');
  const { error: deleteError } = await supabase
    .from('highlight_stories')
    .delete()
    .eq('category_id', categoryId);

  if (deleteError) {
    console.error('Error:', deleteError);
    return;
  }
  console.log('✓ Stories removed');

  // Step 3: Re-upload with correct order
  console.log('\n📤 Re-uploading with correct order...\n');

  const stories = [
    {
      imagePath: '/Users/raghav/table-ordering/public/step0-intro.png',
      caption: 'Steps to Order @ Ramani\'s Cafe',
      gujaratiCaption: 'રમણીઝ કૅફે માં ઓર્ડર કરવાના પગલાં',
      order: 0,
      duration: 5000
    },
    {
      imagePath: '/Users/raghav/table-ordering/public/WhatsApp Image 2026-08-07 at 14.10.28.jpeg',
      caption: '1. Browse menu and select items',
      gujaratiCaption: '1. મેનુ બ્રાઉઝ કરો અને વસ્તુઓ પસંદ કરો',
      order: 1,
      duration: 7000
    },
    {
      imagePath: '/Users/raghav/table-ordering/public/WhatsApp Image 2026-08-07 at 14.10.29.jpeg',
      caption: '2. Review and place your order',
      gujaratiCaption: '2. તમારા ઓર્ડરની સમીક્ષા કરો અને પ્લેસ કરો',
      order: 2,
      duration: 7000
    },
    {
      imagePath: '/Users/raghav/table-ordering/public/step3-illustration.png',
      caption: '3. Staff confirms your order in person',
      gujaratiCaption: '3. સ્ટાફ તમારા ઓર્ડરની રૂબરૂ પુષ્ટિ કરે છે',
      order: 3,
      duration: 7000
    },
    {
      imagePath: '/Users/raghav/table-ordering/public/WhatsApp Image 2026-08-07 at 14.30.10.jpeg',
      caption: '4. Add more items anytime with outstanding orders',
      gujaratiCaption: '4. બાકી ઓર્ડર્સ સાથે કોઈપણ સમયે વધુ વસ્તુઓ ઉમેરો',
      order: 4,
      duration: 7000
    },
    {
      imagePath: '/Users/raghav/table-ordering/public/WhatsApp Image 2026-08-07 at 14.10.29 (2).jpeg',
      caption: '5. Confirm new order along with outstanding orders',
      gujaratiCaption: '5. બાકી ઓર્ડર્સ સાથે નવા ઓર્ડરની પુષ્ટિ કરો',
      order: 5,
      duration: 7000
    },
    {
      imagePath: '/Users/raghav/table-ordering/public/WhatsApp Image 2026-08-07 at 14.10.30.jpeg',
      caption: '6. Click Settle Bill to view total bill amount',
      gujaratiCaption: '6. કુલ બિલ રકમ જોવા માટે બિલ સેટલ પર ક્લિક કરો',
      order: 6,
      duration: 7000
    },
    {
      imagePath: '/Users/raghav/table-ordering/public/step6-illustration.png',
      caption: '7. Pay at the counter when ready',
      gujaratiCaption: '7. તૈયાર થાઓ ત્યારે કાઉન્ટર પર ચૂકવો',
      order: 7,
      duration: 7000
    }
  ];

  for (const story of stories) {
    console.log(`   ${story.order}. ${story.caption}`);

    if (!fs.existsSync(story.imagePath)) {
      console.error(`   ❌ File not found: ${story.imagePath}`);
      continue;
    }

    const imageFile = fs.readFileSync(story.imagePath);
    const ext = path.extname(story.imagePath);
    const fileName = `${Date.now()}_step_${story.order}${ext}`;

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

    const { error: insertError } = await supabase
      .from('highlight_stories')
      .insert({
        category_id: categoryId,
        image_url: publicUrl,
        caption: story.caption,
        gujarati_caption: story.gujaratiCaption,
        display_order: story.order,
        duration: story.duration
      });

    if (insertError) {
      console.error(`   ❌ Insert error:`, insertError);
      continue;
    }

    // Set intro as cover
    if (story.order === 0) {
      await supabase
        .from('highlight_categories')
        .update({ cover_image_url: publicUrl })
        .eq('id', categoryId);
    }

    console.log(`   ✓ Uploaded`);

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '═'.repeat(70));
  console.log('  ✅ Complete! All 8 stories in correct order');
  console.log('═'.repeat(70));
  console.log('\nFinal Flow:');
  console.log('  0. Intro: Steps to Order @ Ramani\'s Cafe');
  console.log('  1. Browse menu and select items');
  console.log('  2. Review and place your order');
  console.log('  3. Staff confirms your order');
  console.log('  4. Add more items anytime');
  console.log('  5. Confirm new order with outstanding orders (NEW)');
  console.log('  6. Click Settle Bill to view total');
  console.log('  7. Pay at counter');
}

fixStepOrder().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
