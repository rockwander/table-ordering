-- Complete and comprehensive Gujarati translations
-- This script translates ALL items and handles edge cases

-- First, run the complete translations we already have
-- Classic Thin Roast Dosas
UPDATE menu_items SET gujarati_name = 'વડાકરી મસાલા દોસાઈ' WHERE name = 'Vadacurry Masala Dosai' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ ગોબી મસાલા દોસાઈ' WHERE name = 'Chettinad Gobi Masala Dosai' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ પનીર મસાલા દોસાઈ' WHERE name = 'Chettinad Paneer Masala Dosai' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'મસાલા દોસાઈ' WHERE name = 'Masala Dosai' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ પનીર મસાલા (ઘી)' WHERE name = 'Chettinad Paneer Masala (Ghee)' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'વડાકરી મસાલા (ઘી)' WHERE name = 'Vadacurry Masala (Ghee)' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ ગોબી મસાલા (ઘી)' WHERE name = 'Chettinad Gobi Masala (Ghee)' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ઘી રોસ્ટ' WHERE name = 'Ghee Roast' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);

-- Combos
UPDATE menu_items SET gujarati_name = '2 x ક્લાસિક પાતળા રોસ્ટ દોસા' WHERE name = '2 x Classic Thin Roast Dosas' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = '6 x ક્લાસિક પાતળા રોસ્ટ દોસા' WHERE name = '6 x Classic Thin Roast Dosas' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ગ્રાન્ડ ચોલા કોમ્બો' WHERE name = 'Grand Chola Combo' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'સ્વીટ + કોફી કોમ્બો' WHERE name = 'Sweet + Coffee Combo' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);

-- Tiffin @ Ramani's
UPDATE menu_items SET gujarati_name = 'કાંચીપુરમ ઇડલી - 2' WHERE name = 'Kanchipuram Idly - 2' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ઇડલી વડાકરી - 2' WHERE name = 'Idly Vadacurry - 2' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'સ્પોન્જ દોસાઈ વડાકરી - 2' WHERE name = 'Sponge Dosai Vadacurry - 2' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'મેદુ વડા - 2' WHERE name = 'Medhu Vada - 2' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'મસાલા વડા - 2' WHERE name = 'Masala Vada - 2' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ઘી સાંભાર વડા - 2' WHERE name = 'Ghee Sambhar Vada - 2' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'દહીં વડા - 2' WHERE name = 'Dahi Vada - 2' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ઇડલી - 2' WHERE name = 'Idly - 2' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ઘી સાંભાર ઇડલી' WHERE name = 'Ghee Sambhar Idly' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'કારા આપ્પમ - 5' WHERE name = 'Kara Appam - 5' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);

-- Starters - Idly Fry
UPDATE menu_items SET gujarati_name = 'સ્પેશિયલ પોડી' WHERE name = 'Special Podi' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'પેરી પેરી' WHERE name = 'Peri Peri' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ચિલી ગાર્લિક મંચુરિયન' WHERE name = 'Chilli Garlic Manchurian' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'દહીં ચાટ' WHERE name = 'Dahi Chat' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);

-- Sweets and Beverages
UPDATE menu_items SET gujarati_name = 'કુંભકોણમ ફિલ્ટર કોફી (રેગ્યુલર)' WHERE name = 'Kumbakonam Filter Coffee (Regular)' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'કુંભકોણમ ફિલ્ટર કોફી (લાર્જ)' WHERE name = 'Kumbakonam Filter Coffee (Large)' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'પાયસમ' WHERE name = 'Payasam' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ચક્કરા/મીઠી પોંગલ' WHERE name = 'Chakkara/Sweet Pongal' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'સ્પેશિયલ સીઝનલ હલવો' WHERE name = 'Special Seasonal Halwa' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'કોલ્ડ કોફી શેક' WHERE name = 'Cold Coffee Shake' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ગુલકંદ રોઝ શેક' WHERE name = 'Gulkand Rose Shake' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'નારિયેળ શેક' WHERE name = 'Coconut Shake' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);

-- Signature Pan Roast Dosas
UPDATE menu_items SET gujarati_name = 'મૈસૂર મસાલા દોસાઈ (ઘી)' WHERE name = 'Mysore Masala Dosai (Ghee)' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'મૈસૂર દોસાઈ (ઘી)' WHERE name = 'Mysore Dosai (Ghee)' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'પોડી મસાલા દોસાઈ (ઘી)' WHERE name = 'Podi Masala Dosai (Ghee)' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ઘી વડાકરી મસાલા (ઘી)' WHERE name = 'Ghee Vadacurry Masala (Ghee)' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);

-- Signature Pan Uttappams
UPDATE menu_items SET gujarati_name = 'ડુંગળી ઉત્તપમ' WHERE name = 'Onion Uttappam' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'મિક્સ વેજ ઉત્તપમ' WHERE name = 'Mix Veg Uttappam' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ટામેટા ઉત્તપમ' WHERE name = 'Tomato Uttappam' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'પોડી ઉત્તપમ' WHERE name = 'Podi Uttappam' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ચીઝ ઉત્તપમ' WHERE name = 'Cheese Uttappam' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'શેઝવાન ઉત્તપમ' WHERE name = 'Schezwan Uttappam' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'પનીર ઉત્તપમ' WHERE name = 'Paneer Uttappam' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);

-- Mini variants (if they exist)
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ ગોબી મસાલા (ઘી-મીની)' WHERE name LIKE '%Chettinad Gobi Masala%Mini%' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ ગોબી મસાલા દોસાઈ (મીની)' WHERE name LIKE '%Chettinad Gobi Masala Dosai%Mini%' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ પનીર મસાલા (ઘી-મીની)' WHERE name LIKE '%Chettinad Paneer Masala%Ghee%Mini%' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ પનીર મસાલા દોસાઈ (મીની)' WHERE name LIKE '%Chettinad Paneer Masala Dosai%Mini%' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'ઘી રોસ્ટ (મીની)' WHERE name LIKE '%Ghee Roast%Mini%' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);

-- Variations and edge cases
UPDATE menu_items SET gujarati_name = 'સાંભાર ઇડલી' WHERE name LIKE '%Sambhar Idly%' AND name NOT LIKE '%Ghee%' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);
UPDATE menu_items SET gujarati_name = 'સાંભાર વડા' WHERE name LIKE '%Sambhar Vada%' AND name NOT LIKE '%Ghee%' AND (gujarati_name IS NULL OR gujarati_name = '' OR gujarati_name = name);

-- Check for any remaining NULL or empty values and display them
SELECT
  'Items still missing translation:' as info,
  name,
  gujarati_name
FROM menu_items
WHERE gujarati_name IS NULL OR gujarati_name = ''
ORDER BY name;

-- Count final status
SELECT
  CASE
    WHEN gujarati_name IS NULL THEN 'NULL (needs translation)'
    WHEN gujarati_name = '' THEN 'EMPTY (needs translation)'
    WHEN gujarati_name = name THEN 'FALLBACK (using English)'
    ELSE 'TRANSLATED'
  END as status,
  COUNT(*) as count
FROM menu_items
GROUP BY
  CASE
    WHEN gujarati_name IS NULL THEN 'NULL (needs translation)'
    WHEN gujarati_name = '' THEN 'EMPTY (needs translation)'
    WHEN gujarati_name = name THEN 'FALLBACK (using English)'
    ELSE 'TRANSLATED'
  END
ORDER BY count DESC;
