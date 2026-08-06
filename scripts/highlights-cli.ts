#!/usr/bin/env npx tsx

/**
 * Story Highlights CLI - Manage Instagram-style highlights for Ramani's Cafe
 *
 * Usage:
 *   npm run highlights setup           # Initialize database tables and storage
 *   npm run highlights create-category # Create a new highlight category
 *   npm run highlights add-story       # Add a story to a category
 *   npm run highlights list            # List all categories and stories
 *   npm run highlights delete-story    # Delete a specific story
 *   npm run highlights delete-category # Delete a category and all its stories
 *   npm run highlights toggle-category # Toggle category active status
 *   npm run highlights preview         # Preview highlights in browser
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as readline from 'readline';
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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupDatabase() {
  console.log('Setting up database tables and storage...\n');

  // Check if tables exist
  const { data: categories, error: catError } = await supabase
    .from('highlight_categories')
    .select('id')
    .limit(1);

  if (catError && catError.code === '42P01') {
    console.log('Tables do not exist. Please run the following SQL in your Supabase SQL Editor:\n');
    console.log('='.repeat(80));

    const migration1 = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20250807000001_create_story_highlights.sql'),
      'utf-8'
    );
    console.log(migration1);

    console.log('='.repeat(80));
    console.log('\nThen run this for storage setup:\n');
    console.log('='.repeat(80));

    const migration2 = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20250807000002_create_story_highlights_storage.sql'),
      'utf-8'
    );
    console.log(migration2);

    console.log('='.repeat(80));
    console.log('\nAfter running the SQL, re-run this command to verify setup.');
  } else if (!catError) {
    console.log('✓ Tables already exist');
    console.log('✓ Database setup complete!');
  } else {
    console.error('Error checking tables:', catError);
  }
}

async function createCategory() {
  console.log('\n=== Create New Highlight Category ===\n');

  const name = await question('English name: ');
  const gujaratiName = await question('Gujarati name: ');
  const displayOrder = await question('Display order (number, lower shows first): ');

  // For now, we'll use a placeholder cover image URL
  // The first story's image will be used as cover
  const coverImageUrl = await question('Cover image URL (optional, press enter to skip): ');

  const { data, error } = await supabase
    .from('highlight_categories')
    .insert({
      name,
      gujarati_name: gujaratiName || null,
      cover_image_url: coverImageUrl || null,
      display_order: parseInt(displayOrder) || 0,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
  } else {
    console.log('\n✓ Category created successfully!');
    console.log('ID:', data.id);
    console.log('Name:', data.name);
  }
}

async function listAll() {
  console.log('\n=== All Highlight Categories and Stories ===\n');

  const { data: categories, error: catError } = await supabase
    .from('highlight_categories')
    .select('*, highlight_stories(*)')
    .order('display_order');

  if (catError) {
    console.error('Error fetching categories:', catError);
    return;
  }

  if (!categories || categories.length === 0) {
    console.log('No categories found. Create one with: npm run highlights create-category');
    return;
  }

  categories.forEach((cat: any) => {
    console.log(`\n📁 ${cat.name} (${cat.gujarati_name || 'no gujarati name'})`);
    console.log(`   ID: ${cat.id}`);
    console.log(`   Status: ${cat.is_active ? '✓ Active' : '✗ Inactive'}`);
    console.log(`   Order: ${cat.display_order}`);
    console.log(`   Stories: ${cat.highlight_stories?.length || 0}`);

    if (cat.highlight_stories && cat.highlight_stories.length > 0) {
      cat.highlight_stories.forEach((story: any, idx: number) => {
        console.log(`      ${idx + 1}. ${story.caption || 'No caption'}`);
        console.log(`         ID: ${story.id}`);
        console.log(`         Image: ${story.image_url}`);
        console.log(`         Order: ${story.display_order}`);
      });
    }
  });

  console.log('\n');
}

async function addStory() {
  console.log('\n=== Add Story to Category ===\n');

  // List categories first
  const { data: categories, error: catError } = await supabase
    .from('highlight_categories')
    .select('id, name, gujarati_name')
    .order('display_order');

  if (catError || !categories || categories.length === 0) {
    console.log('No categories found. Create one first with: npm run highlights create-category');
    return;
  }

  console.log('Available categories:');
  categories.forEach((cat: any, idx: number) => {
    console.log(`${idx + 1}. ${cat.name} (${cat.gujarati_name || 'no gujarati'})`);
    console.log(`   ID: ${cat.id}`);
  });

  const categoryId = await question('\nEnter category ID: ');
  const imagePath = await question('Image file path (absolute or relative): ');
  const caption = await question('Caption (English): ');
  const gujaratiCaption = await question('Caption (Gujarati): ');
  const displayOrder = await question('Display order: ');
  const duration = await question('Duration in seconds (default 5): ');

  // Upload image to Supabase Storage
  console.log('\nUploading image...');

  const imageFile = fs.readFileSync(imagePath);
  const fileName = `${Date.now()}_${path.basename(imagePath)}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('story-highlights')
    .upload(fileName, imageFile, {
      contentType: 'image/jpeg', // Adjust based on actual file type
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    return;
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
      caption: caption || null,
      gujarati_caption: gujaratiCaption || null,
      display_order: parseInt(displayOrder) || 0,
      duration: (parseInt(duration) || 5) * 1000 // Convert to milliseconds
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating story:', error);
  } else {
    console.log('\n✓ Story added successfully!');
    console.log('ID:', data.id);

    // Update category cover image if it doesn't have one
    const category = categories.find((c: any) => c.id === categoryId);
    if (category) {
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
    }
  }
}

async function deleteStory() {
  console.log('\n=== Delete Story ===\n');

  const storyId = await question('Enter story ID to delete: ');

  // Get story to delete image from storage
  const { data: story, error: fetchError } = await supabase
    .from('highlight_stories')
    .select('image_url')
    .eq('id', storyId)
    .single();

  if (fetchError || !story) {
    console.error('Story not found');
    return;
  }

  // Extract file name from URL
  const fileName = story.image_url.split('/').pop();

  // Delete from database
  const { error: deleteError } = await supabase
    .from('highlight_stories')
    .delete()
    .eq('id', storyId);

  if (deleteError) {
    console.error('Error deleting story:', deleteError);
    return;
  }

  // Delete from storage
  if (fileName) {
    await supabase.storage
      .from('story-highlights')
      .remove([fileName]);
  }

  console.log('✓ Story deleted successfully');
}

async function deleteCategory() {
  console.log('\n=== Delete Category ===\n');
  console.log('⚠️  This will delete the category and ALL its stories!\n');

  const categoryId = await question('Enter category ID to delete: ');
  const confirm = await question('Are you sure? Type "yes" to confirm: ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('Cancelled');
    return;
  }

  // Get all stories in category to delete images
  const { data: stories } = await supabase
    .from('highlight_stories')
    .select('image_url')
    .eq('category_id', categoryId);

  // Delete category (will cascade delete stories)
  const { error: deleteError } = await supabase
    .from('highlight_categories')
    .delete()
    .eq('id', categoryId);

  if (deleteError) {
    console.error('Error deleting category:', deleteError);
    return;
  }

  // Delete images from storage
  if (stories && stories.length > 0) {
    const fileNames = stories
      .map((s: any) => s.image_url.split('/').pop())
      .filter(Boolean);

    if (fileNames.length > 0) {
      await supabase.storage
        .from('story-highlights')
        .remove(fileNames);
    }
  }

  console.log('✓ Category and all stories deleted successfully');
}

async function toggleCategory() {
  console.log('\n=== Toggle Category Active Status ===\n');

  const categoryId = await question('Enter category ID: ');

  const { data: category } = await supabase
    .from('highlight_categories')
    .select('is_active')
    .eq('id', categoryId)
    .single();

  if (!category) {
    console.error('Category not found');
    return;
  }

  const { error } = await supabase
    .from('highlight_categories')
    .update({ is_active: !category.is_active })
    .eq('id', categoryId);

  if (error) {
    console.error('Error toggling category:', error);
  } else {
    console.log(`✓ Category is now ${!category.is_active ? 'active' : 'inactive'}`);
  }
}

async function preview() {
  console.log('\n=== Preview Highlights ===\n');
  console.log('Opening preview in browser...');
  console.log(`URL: ${supabaseUrl.replace('https://', 'http://localhost:3000/')}`);
  console.log('\nMake sure your dev server is running (npm run dev)');
  console.log('Then navigate to the menu page to see highlights.');
}

// Main CLI handler
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'setup':
      await setupDatabase();
      break;
    case 'create-category':
      await createCategory();
      break;
    case 'add-story':
      await addStory();
      break;
    case 'list':
      await listAll();
      break;
    case 'delete-story':
      await deleteStory();
      break;
    case 'delete-category':
      await deleteCategory();
      break;
    case 'toggle-category':
      await toggleCategory();
      break;
    case 'preview':
      await preview();
      break;
    default:
      console.log('Story Highlights CLI\n');
      console.log('Available commands:');
      console.log('  setup           - Initialize database tables and storage');
      console.log('  create-category - Create a new highlight category');
      console.log('  add-story       - Add a story to a category');
      console.log('  list            - List all categories and stories');
      console.log('  delete-story    - Delete a specific story');
      console.log('  delete-category - Delete a category and all its stories');
      console.log('  toggle-category - Toggle category active status');
      console.log('  preview         - Preview highlights in browser');
      console.log('\nUsage: npx tsx scripts/highlights-cli.ts <command>');
  }

  rl.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});
