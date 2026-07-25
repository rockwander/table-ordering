-- Complete Gujarati translations for all menu items
-- South Indian dishes translated to Gujarati

-- Classic Thin Roast Dosas
UPDATE menu_items SET gujarati_name = 'વડાકરી મસાલા દોસાઈ' WHERE name = 'Vadacurry Masala Dosai';
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ ગોબી મસાલા દોસાઈ' WHERE name = 'Chettinad Gobi Masala Dosai';
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ પનીર મસાલા દોસાઈ' WHERE name = 'Chettinad Paneer Masala Dosai';
UPDATE menu_items SET gujarati_name = 'મસાલા દોસાઈ' WHERE name = 'Masala Dosai';
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ પનીર મસાલા (ઘી)' WHERE name = 'Chettinad Paneer Masala (Ghee)';
UPDATE menu_items SET gujarati_name = 'વડાકરી મસાલા (ઘી)' WHERE name = 'Vadacurry Masala (Ghee)';
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ ગોબી મસાલા (ઘી)' WHERE name = 'Chettinad Gobi Masala (Ghee)';
UPDATE menu_items SET gujarati_name = 'ઘી રોસ્ટ' WHERE name = 'Ghee Roast' AND category_id IN (SELECT id FROM categories WHERE name = 'Classic Thin Roast Dosas');

-- Combos
UPDATE menu_items SET gujarati_name = '2 x ક્લાસિક પાતળા રોસ્ટ દોસા' WHERE name = '2 x Classic Thin Roast Dosas';
UPDATE menu_items SET gujarati_name = '6 x ક્લાસિક પાતળા રોસ્ટ દોસા' WHERE name = '6 x Classic Thin Roast Dosas';
UPDATE menu_items SET gujarati_name = 'ગ્રાન્ડ ચોલા કોમ્બો' WHERE name = 'Grand Chola Combo';
UPDATE menu_items SET gujarati_name = 'સ્વીટ + કોફી કોમ્બો' WHERE name = 'Sweet + Coffee Combo';

-- Tiffin @ Ramani's
UPDATE menu_items SET gujarati_name = 'કાંચીપુરમ ઇડલી - 2' WHERE name = 'Kanchipuram Idly - 2';
UPDATE menu_items SET gujarati_name = 'ઇડલી વડાકરી - 2' WHERE name = 'Idly Vadacurry - 2';
UPDATE menu_items SET gujarati_name = 'સ્પોન્જ દોસાઈ વડાકરી - 2' WHERE name = 'Sponge Dosai Vadacurry - 2';
UPDATE menu_items SET gujarati_name = 'મેદુ વડા - 2' WHERE name = 'Medhu Vada - 2';
UPDATE menu_items SET gujarati_name = 'મસાલા વડા - 2' WHERE name = 'Masala Vada - 2';
UPDATE menu_items SET gujarati_name = 'ઘી સાંભાર વડા - 2' WHERE name = 'Ghee Sambhar Vada - 2';
UPDATE menu_items SET gujarati_name = 'દહીં વડા - 2' WHERE name = 'Dahi Vada - 2';
UPDATE menu_items SET gujarati_name = 'ઇડલી - 2' WHERE name = 'Idly - 2';
UPDATE menu_items SET gujarati_name = 'ઘી સાંભાર ઇડલી' WHERE name = 'Ghee Sambhar Idly';
UPDATE menu_items SET gujarati_name = 'કારા આપ્પમ - 5' WHERE name = 'Kara Appam - 5';

-- Starters - Idly Fry
UPDATE menu_items SET gujarati_name = 'સ્પેશિયલ પોડી' WHERE name = 'Special Podi';
UPDATE menu_items SET gujarati_name = 'પેરી પેરી' WHERE name = 'Peri Peri';
UPDATE menu_items SET gujarati_name = 'ચિલી ગાર્લિક મંચુરિયન' WHERE name = 'Chilli Garlic Manchurian';
UPDATE menu_items SET gujarati_name = 'દહીં ચાટ' WHERE name = 'Dahi Chat';

-- Sweets and Beverages
UPDATE menu_items SET gujarati_name = 'કુંભકોણમ ફિલ્ટર કોફી (રેગ્યુલર)' WHERE name = 'Kumbakonam Filter Coffee (Regular)';
UPDATE menu_items SET gujarati_name = 'કુંભકોણમ ફિલ્ટર કોફી (લાર્જ)' WHERE name = 'Kumbakonam Filter Coffee (Large)';
UPDATE menu_items SET gujarati_name = 'પાયસમ' WHERE name = 'Payasam';
UPDATE menu_items SET gujarati_name = 'ચક્કરા/મીઠી પોંગલ' WHERE name = 'Chakkara/Sweet Pongal';
UPDATE menu_items SET gujarati_name = 'સ્પેશિયલ સીઝનલ હલવો' WHERE name = 'Special Seasonal Halwa';
UPDATE menu_items SET gujarati_name = 'કોલ્ડ કોફી શેક' WHERE name = 'Cold Coffee Shake';
UPDATE menu_items SET gujarati_name = 'ગુલકંદ રોઝ શેક' WHERE name = 'Gulkand Rose Shake';
UPDATE menu_items SET gujarati_name = 'નારિયેળ શેક' WHERE name = 'Coconut Shake';

-- Signature Pan Roast Dosas
UPDATE menu_items SET gujarati_name = 'મૈસૂર મસાલા દોસાઈ (ઘી)' WHERE name = 'Mysore Masala Dosai (Ghee)';
UPDATE menu_items SET gujarati_name = 'મૈસૂર દોસાઈ (ઘી)' WHERE name = 'Mysore Dosai (Ghee)';
UPDATE menu_items SET gujarati_name = 'પોડી મસાલા દોસાઈ (ઘી)' WHERE name = 'Podi Masala Dosai (Ghee)';
UPDATE menu_items SET gujarati_name = 'ઘી રોસ્ટ' WHERE name = 'Ghee Roast' AND category_id IN (SELECT id FROM categories WHERE name = 'Signature Pan Roast Dosas');
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ પનીર મસાલા (ઘી)' WHERE name = 'Chettinad Paneer Masala (Ghee)' AND category_id IN (SELECT id FROM categories WHERE name = 'Signature Pan Roast Dosas');
UPDATE menu_items SET gujarati_name = 'ઘી વડાકરી મસાલા (ઘી)' WHERE name = 'Ghee Vadacurry Masala (Ghee)';
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ ગોબી મસાલા (ઘી)' WHERE name = 'Chettinad Gobi Masala (Ghee)' AND category_id IN (SELECT id FROM categories WHERE name = 'Signature Pan Roast Dosas');

-- Signature Pan Uttappams
UPDATE menu_items SET gujarati_name = 'ડુંગળી ઉત્તપમ' WHERE name = 'Onion Uttappam';
UPDATE menu_items SET gujarati_name = 'મિક્સ વેજ ઉત્તપમ' WHERE name = 'Mix Veg Uttappam';
UPDATE menu_items SET gujarati_name = 'ટામેટા ઉત્તપમ' WHERE name = 'Tomato Uttappam';
UPDATE menu_items SET gujarati_name = 'પોડી ઉત્તપમ' WHERE name = 'Podi Uttappam';
UPDATE menu_items SET gujarati_name = 'ચીઝ ઉત્તપમ' WHERE name = 'Cheese Uttappam';
UPDATE menu_items SET gujarati_name = 'શેઝવાન ઉત્તપમ' WHERE name = 'Schezwan Uttappam';
UPDATE menu_items SET gujarati_name = 'પનીર ઉત્તપમ' WHERE name = 'Paneer Uttappam';

-- Set default gujarati_name to English name for any items still missing translation
UPDATE menu_items SET gujarati_name = name WHERE gujarati_name IS NULL OR gujarati_name = '';
