-- Fix the 13 items missing Gujarati translations
-- Identified from database query on 2026-07-25

UPDATE menu_items SET gujarati_name = 'ઇડલી ફ્રાય - પેરી પેરી' WHERE name = 'Idly fry - Peri Peri';
UPDATE menu_items SET gujarati_name = 'ઇડલી ફ્રાય - સ્પેશિયલ પોડી' WHERE name = 'Idly fry - Special Podi';
UPDATE menu_items SET gujarati_name = 'ઇડલી વડાકરી - 2' WHERE name = 'Idly Vadacurry - 2';
UPDATE menu_items SET gujarati_name = 'કાંચીપુરમ ઇડલી - 2' WHERE name = 'Kanchipuram Idly - 2';
UPDATE menu_items SET gujarati_name = 'કારા આપ્પમ - 5' WHERE name = 'Kara Appam - 5';
UPDATE menu_items SET gujarati_name = 'મસાલા વડા - 2' WHERE name = 'Masala Vada - 2';
UPDATE menu_items SET gujarati_name = 'મેદુ વડા - 2' WHERE name = 'Medhu Vada - 2';
UPDATE menu_items SET gujarati_name = 'પાયસમ' WHERE name = 'Payasam';
UPDATE menu_items SET gujarati_name = 'રાગી મસાલા દોસા' WHERE name = 'Ragi Masala Dosa';
UPDATE menu_items SET gujarati_name = 'સ્પેશિયલ સીઝનલ હલવો' WHERE name = 'Special Seasonal Halwa';
UPDATE menu_items SET gujarati_name = 'સ્પોન્જ દોસાઈ વડાકરી - 2' WHERE name = 'Sponge Dosai Vadacurry - 2';
UPDATE menu_items SET gujarati_name = 'સ્વીટ + કોફી કોમ્બો' WHERE name = 'Sweet + Coffee Combo';
UPDATE menu_items SET gujarati_name = 'વડાકરી મસાલા (ઘી-મીની)' WHERE name = 'Vadacurry Masala (Ghee-Mini)';

-- Verify all items now have translations
SELECT
  COUNT(*) as total_items,
  COUNT(gujarati_name) as with_translation,
  COUNT(*) - COUNT(gujarati_name) as still_missing
FROM menu_items;

-- Show any remaining items without translation
SELECT
  name,
  gujarati_name
FROM menu_items
WHERE gujarati_name IS NULL
ORDER BY name;
