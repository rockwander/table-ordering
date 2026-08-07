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

async function uploadRemaining() {
  console.log('═'.repeat(70));
  console.log('  Uploading Remaining Steps (4, 5, 6)');
  console.log('═'.repeat(70));

  const stories = [
    {
      imagePath: '/Users/raghav/table-ordering/public/WhatsApp Image 2026-08-07 at 14.30.10.jpeg',
      caption: '4. Add more items anytime with outstanding orders',
      gujaratiCaption: '4. બાકી ઓર્ડર્સ સાથે કોઈપણ સમયે વધુ વસ્તુઓ ઉમેરો',
      order: 4
    },
    {
      imagePath: '/Users/raghav/table-ordering/public/WhatsApp Image 2026-08-07 at 14.10.30.jpeg',
      caption: '5. View bill anytime by clicking Settle Bill',
      gujaratiCaption: '5. બિલ સેટલ પર ક્લિક કરીને કોઈપણ સમયે બિલ જુઓ',
      order: 5
    },
    {
      imagePath: '/Users/raghav/table-ordering/public/step6-illustration.png',
      caption: '6. Pay at the counter when ready',
      gujaratiCaption: '6. તૈયાર થાઓ ત્યારે કાઉન્ટર પર ચૂકવો',
      order: 6
    }
  ];

  for (const story of stories) {
    console.log(`\n   Story ${story.order}: ${story.caption}`);

    try {
      // Try to access file with different methods
      let imageFile: Buffer;

      try {
        imageFile = fs.readFileSync(story.imagePath);
      } catch (err: any) {
        if (err.code === 'EPERM') {
          console.error(`   ❌ Permission denied for: ${story.imagePath}`);
          console.log(`   💡 Please copy the file to the project directory:`);
          console.log(`      cp "${story.imagePath}" /Users/raghav/table-ordering/temp-step${story.order}.jpeg`);
          continue;
        }
        throw err;
      }

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
          duration: 7000
        });

      if (insertError) {
        console.error(`   ❌ Insert error:`, insertError);
        continue;
      }

      console.log(`   ✓ Uploaded successfully`);

      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('  Check results above');
  console.log('═'.repeat(70));
}

uploadRemaining().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
