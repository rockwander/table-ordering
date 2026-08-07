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

// Story definitions
const stories = [
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
    imagePath: null, // Will create illustration for staff confirmation
    caption: '3. Staff confirms your order in person',
    gujaratiCaption: '3. સ્ટાફ તમારા ઓર્ડરની રૂબરૂ પુષ્ટિ કરે છે',
    order: 3,
    isIllustration: true
  },
  {
    imagePath: '/Users/raghav/Downloads/WhatsApp Image 2026-08-07 at 14.10.29 (1).jpeg',
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
    imagePath: null, // Counter payment illustration
    caption: '6. Pay at the counter when ready',
    gujaratiCaption: '6. તૈયાર થાઓ ત્યારે કાઉન્ટર પર ચૂકવો',
    order: 6,
    isIllustration: true
  }
];

async function uploadStory(story: typeof stories[0]) {
  console.log(`\nUploading Story ${story.order}: ${story.caption}`);

  if (story.isIllustration) {
    console.log('⚠️  This step needs an illustration. Skipping for now.');
    console.log(`   Caption: ${story.caption}`);
    console.log(`   You can add this manually later or I can create a simple text-based image.`);
    return;
  }

  if (!story.imagePath) {
    console.log('⚠️  No image path provided. Skipping.');
    return;
  }

  // Check if file exists
  if (!fs.existsSync(story.imagePath)) {
    console.error(`❌ Error: Image file not found at: ${story.imagePath}`);
    return;
  }

  // Read the image file
  const imageFile = fs.readFileSync(story.imagePath);
  const ext = path.extname(story.imagePath);
  const fileName = `${Date.now()}_step_${story.order}${ext}`;

  console.log('   Uploading to Supabase Storage...');

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('story-highlights')
    .upload(fileName, imageFile, {
      contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
      upsert: false
    });

  if (uploadError) {
    console.error('   ❌ Error uploading image:', uploadError);
    return;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('story-highlights')
    .getPublicUrl(fileName);

  console.log('   ✓ Image uploaded');

  // Insert story record
  const { data, error } = await supabase
    .from('highlight_stories')
    .insert({
      category_id: categoryId,
      image_url: publicUrl,
      caption: story.caption,
      gujarati_caption: story.gujaratiCaption,
      display_order: story.order,
      duration: 7000 // 7 seconds for steps with text
    })
    .select()
    .single();

  if (error) {
    console.error('   ❌ Error creating story:', error);
    return;
  }

  console.log(`   ✓ Story ${story.order} added successfully!`);

  // Set first story image as category cover
  if (story.order === 1) {
    await supabase
      .from('highlight_categories')
      .update({ cover_image_url: publicUrl })
      .eq('id', categoryId);
    console.log('   ✓ Set as category cover image');
  }
}

async function main() {
  console.log('═'.repeat(70));
  console.log('  Uploading Steps to Order Stories');
  console.log('═'.repeat(70));

  for (const story of stories) {
    await uploadStory(story);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('  Summary');
  console.log('═'.repeat(70));
  console.log('✓ Screenshot-based steps uploaded');
  console.log('⚠️  Step 3 (Staff confirmation) - needs illustration');
  console.log('⚠️  Step 6 (Pay at counter) - needs illustration');
  console.log('\nI can create simple text-based images for the missing steps.');
  console.log('Would you like me to create them?');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
