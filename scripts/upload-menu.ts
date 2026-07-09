import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

interface MenuItem {
  category: string;
  name: string;
  price: number;
  description?: string;
  is_vegetarian?: boolean;
}

const menuData: MenuItem[] = [
  // Classic Thin Roast Dosas
  { category: 'Classic Thin Roast Dosas', name: 'Vadacurry Masala Dosai', price: 90, description: 'Classic thin roast dosa with vadacurry masala', is_vegetarian: true },
  { category: 'Classic Thin Roast Dosas', name: 'Chettinad Gobi Masala Dosai', price: 90, description: 'Classic thin roast dosa with Chettinad gobi masala', is_vegetarian: true },
  { category: 'Classic Thin Roast Dosas', name: 'Chettinad Paneer Masala Dosai', price: 100, description: 'Classic thin roast dosa with Chettinad paneer masala', is_vegetarian: true },
  { category: 'Classic Thin Roast Dosas', name: 'Masala Dosai', price: 75, description: 'Classic thin roast masala dosa', is_vegetarian: true },
  { category: 'Classic Thin Roast Dosas', name: 'Chettinad Paneer Masala (Ghee)', price: 120, description: 'Classic thin roast dosa with Chettinad paneer masala and ghee', is_vegetarian: true },
  { category: 'Classic Thin Roast Dosas', name: 'Vadacurry Masala (Ghee)', price: 110, description: 'Classic thin roast dosa with vadacurry masala and ghee', is_vegetarian: true },
  { category: 'Classic Thin Roast Dosas', name: 'Chettinad Gobi Masala (Ghee)', price: 110, description: 'Classic thin roast dosa with Chettinad gobi masala and ghee', is_vegetarian: true },
  { category: 'Classic Thin Roast Dosas', name: 'Ghee Roast', price: 80, description: 'Classic thin roast dosa with ghee', is_vegetarian: true },

  // Combos
  { category: 'Combos', name: '2 x Classic Thin Roast Dosas', price: 169, description: 'Combo of 2 classic thin roast dosas', is_vegetarian: true },
  { category: 'Combos', name: '6 x Classic Thin Roast Dosas', price: 499, description: 'Combo of 6 classic thin roast dosas', is_vegetarian: true },
  { category: 'Combos', name: 'Grand Chola Combo', price: 349, description: '2 Classic Thin Roast Dosai, 1 Kanchipuram/Vadacurry Idly, 1 Medhu Vada, Kumbakonam Filter Coffee, Sweet', is_vegetarian: true },
  { category: 'Combos', name: 'Sweet + Coffee Combo', price: 99, description: 'Sweet and coffee combo', is_vegetarian: true },

  // Tiffin @ Ramani's
  { category: 'Tiffin @ Ramani\'s', name: 'Kanchipuram Idly - 2', price: 100, description: 'Pair of Kanchipuram idlies', is_vegetarian: true },
  { category: 'Tiffin @ Ramani\'s', name: 'Idly Vadacurry - 2', price: 100, description: 'Pair of idlies with vadacurry', is_vegetarian: true },
  { category: 'Tiffin @ Ramani\'s', name: 'Sponge Dosai Vadacurry - 2', price: 120, description: 'Pair of sponge dosas with vadacurry', is_vegetarian: true },
  { category: 'Tiffin @ Ramani\'s', name: 'Medhu Vada - 2', price: 80, description: 'Pair of crispy medhu vadas', is_vegetarian: true },
  { category: 'Tiffin @ Ramani\'s', name: 'Masala Vada - 2', price: 80, description: 'Pair of masala vadas', is_vegetarian: true },
  { category: 'Tiffin @ Ramani\'s', name: 'Ghee Sambhar Vada - 2', price: 100, description: 'Pair of vadas in ghee sambhar', is_vegetarian: true },
  { category: 'Tiffin @ Ramani\'s', name: 'Dahi Vada - 2', price: 110, description: 'Pair of dahi vadas', is_vegetarian: true },
  { category: 'Tiffin @ Ramani\'s', name: 'Idly - 2', price: 70, description: 'Pair of steamed idlies', is_vegetarian: true },
  { category: 'Tiffin @ Ramani\'s', name: 'Ghee Sambhar Idly', price: 100, description: 'Idlies in ghee sambhar', is_vegetarian: true },
  { category: 'Tiffin @ Ramani\'s', name: 'Kara Appam - 5', price: 120, description: '5 pieces of kara appam', is_vegetarian: true },

  // Starters - Idly Fry
  { category: 'Starters - Idly Fry', name: 'Special Podi', price: 100, description: 'Idly fry with special podi', is_vegetarian: true },
  { category: 'Starters - Idly Fry', name: 'Peri Peri', price: 100, description: 'Idly fry with peri peri seasoning', is_vegetarian: true },
  { category: 'Starters - Idly Fry', name: 'Chilli Garlic Manchurian', price: 120, description: 'Idly fry Manchurian style with chilli garlic', is_vegetarian: true },
  { category: 'Starters - Idly Fry', name: 'Dahi Chat', price: 120, description: 'Idly fry dahi chat', is_vegetarian: true },

  // Sweets and Beverages
  { category: 'Sweets and Beverages', name: 'Kumbakonam Filter Coffee (Regular)', price: 35, description: 'Traditional South Indian filter coffee', is_vegetarian: true },
  { category: 'Sweets and Beverages', name: 'Kumbakonam Filter Coffee (Large)', price: 50, description: 'Traditional South Indian filter coffee - Large', is_vegetarian: true },
  { category: 'Sweets and Beverages', name: 'Payasam', price: 90, description: 'Traditional South Indian sweet dessert', is_vegetarian: true },
  { category: 'Sweets and Beverages', name: 'Chakkara/Sweet Pongal', price: 90, description: 'Sweet pongal', is_vegetarian: true },
  { category: 'Sweets and Beverages', name: 'Special Seasonal Halwa', price: 80, description: 'Seasonal halwa variety', is_vegetarian: true },
  { category: 'Sweets and Beverages', name: 'Cold Coffee Shake', price: 140, description: 'Thick cold coffee shake', is_vegetarian: true },
  { category: 'Sweets and Beverages', name: 'Gulkand Rose Shake', price: 140, description: 'Thick gulkand rose shake', is_vegetarian: true },
  { category: 'Sweets and Beverages', name: 'Coconut Shake', price: 140, description: 'Thick coconut shake', is_vegetarian: true },

  // Signature Pan Roast Dosas
  { category: 'Signature Pan Roast Dosas', name: 'Mysore Masala Dosai (Ghee)', price: 145, description: 'Signature pan roast Mysore masala dosa with ghee', is_vegetarian: true },
  { category: 'Signature Pan Roast Dosas', name: 'Mysore Dosai (Ghee)', price: 120, description: 'Signature pan roast Mysore dosa with ghee', is_vegetarian: true },
  { category: 'Signature Pan Roast Dosas', name: 'Podi Masala Dosai (Ghee)', price: 145, description: 'Signature pan roast podi masala dosa with ghee', is_vegetarian: true },
  { category: 'Signature Pan Roast Dosas', name: 'Ghee Roast', price: 110, description: 'Signature pan roast dosa with ghee', is_vegetarian: true },
  { category: 'Signature Pan Roast Dosas', name: 'Chettinad Paneer Masala (Ghee)', price: 160, description: 'Signature pan roast with Chettinad paneer masala and ghee', is_vegetarian: true },
  { category: 'Signature Pan Roast Dosas', name: 'Ghee Vadacurry Masala (Ghee)', price: 145, description: 'Signature pan roast with vadacurry masala and ghee', is_vegetarian: true },
  { category: 'Signature Pan Roast Dosas', name: 'Chettinad Gobi Masala (Ghee)', price: 145, description: 'Signature pan roast with Chettinad gobi masala and ghee', is_vegetarian: true },

  // Signature Pan Uttappams
  { category: 'Signature Pan Uttappams', name: 'Onion Uttappam', price: 130, description: 'Signature pan uttappam with onions', is_vegetarian: true },
  { category: 'Signature Pan Uttappams', name: 'Mix Veg Uttappam', price: 140, description: 'Signature pan uttappam with mixed vegetables', is_vegetarian: true },
  { category: 'Signature Pan Uttappams', name: 'Tomato Uttappam', price: 130, description: 'Signature pan uttappam with tomatoes', is_vegetarian: true },
  { category: 'Signature Pan Uttappams', name: 'Podi Uttappam', price: 130, description: 'Signature pan uttappam with podi', is_vegetarian: true },
  { category: 'Signature Pan Uttappams', name: 'Cheese Uttappam', price: 150, description: 'Signature pan uttappam with cheese', is_vegetarian: true },
  { category: 'Signature Pan Uttappams', name: 'Schezwan Uttappam', price: 150, description: 'Signature pan uttappam with schezwan sauce', is_vegetarian: true },
  { category: 'Signature Pan Uttappams', name: 'Paneer Uttappam', price: 160, description: 'Signature pan uttappam with paneer', is_vegetarian: true },
];

async function uploadMenu() {
  console.log('Starting menu upload...');

  try {
    // Get unique categories
    const categories = Array.from(new Set(menuData.map(item => item.category)));
    console.log(`Found ${categories.length} categories`);

    // Create categories
    const categoryMap = new Map<string, string>();

    for (let i = 0; i < categories.length; i++) {
      const categoryName = categories[i];
      console.log(`Creating category: ${categoryName}`);

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: categoryName,
          description: '',
          display_order: i,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating category ${categoryName}:`, error);
        throw error;
      }

      categoryMap.set(categoryName, data.id);
      console.log(`Created category: ${categoryName} with ID: ${data.id}`);
    }

    // Create menu items
    console.log(`\nCreating ${menuData.length} menu items...`);

    for (let i = 0; i < menuData.length; i++) {
      const item = menuData[i];
      const categoryId = categoryMap.get(item.category);

      if (!categoryId) {
        console.error(`Category not found: ${item.category}`);
        continue;
      }

      console.log(`Creating item ${i + 1}/${menuData.length}: ${item.name}`);

      const { error } = await supabase
        .from('menu_items')
        .insert({
          category_id: categoryId,
          name: item.name,
          description: item.description || '',
          price: item.price,
          is_available: true,
          is_vegetarian: item.is_vegetarian ?? true,
          display_order: i,
        });

      if (error) {
        console.error(`Error creating item ${item.name}:`, error);
        throw error;
      }
    }

    console.log('\n✅ Menu upload completed successfully!');
    console.log(`Created ${categories.length} categories and ${menuData.length} menu items`);

  } catch (error) {
    console.error('❌ Error uploading menu:', error);
    throw error;
  }
}

uploadMenu();
