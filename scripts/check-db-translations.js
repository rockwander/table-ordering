const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTranslations() {
  console.log('Checking menu items for missing Gujarati translations...\n');

  // Get all menu items
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('name, gujarati_name')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total items in database: ${items.length}\n`);

  // Categorize items
  const nullItems = items.filter(i => i.gujarati_name === null);
  const emptyItems = items.filter(i => i.gujarati_name === '');
  const englishItems = items.filter(i => i.gujarati_name === i.name);
  const translatedItems = items.filter(i => i.gujarati_name && i.gujarati_name !== '' && i.gujarati_name !== i.name);

  console.log('=== SUMMARY ===');
  console.log(`NULL (needs translation): ${nullItems.length}`);
  console.log(`EMPTY (needs translation): ${emptyItems.length}`);
  console.log(`English fallback: ${englishItems.length}`);
  console.log(`Properly translated: ${translatedItems.length}`);
  console.log('');

  if (nullItems.length > 0) {
    console.log('=== Items with NULL gujarati_name ===');
    nullItems.forEach(item => console.log(`  - ${item.name}`));
    console.log('');
  }

  if (emptyItems.length > 0) {
    console.log('=== Items with EMPTY gujarati_name ===');
    emptyItems.forEach(item => console.log(`  - ${item.name}`));
    console.log('');
  }

  if (englishItems.length > 0) {
    console.log('=== Items using English fallback ===');
    englishItems.forEach(item => console.log(`  - ${item.name}`));
    console.log('');
  }

  if (translatedItems.length > 0) {
    console.log('=== Sample of properly translated items ===');
    const sampleSize = Math.min(10, translatedItems.length);
    for (let i = 0; i < sampleSize; i++) {
      console.log(`  ✓ ${translatedItems[i].name} → ${translatedItems[i].gujarati_name}`);
    }
    if (translatedItems.length > 10) {
      console.log(`  ... and ${translatedItems.length - 10} more`);
    }
  }
}

checkTranslations().catch(console.error);
