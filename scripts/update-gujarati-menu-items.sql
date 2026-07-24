-- Add Gujarati translations for all menu items
-- South Indian dishes translated to Gujarati

UPDATE menu_items SET gujarati_name = '2 x ક્લાસિક પાતળા રોસ્ટ મીની દોસા' WHERE name = '2 x Classic Thin Roast Mini Dosas';
UPDATE menu_items SET gujarati_name = '6 x ક્લાસિક પાતળા રોસ્ટ મીની દોસા' WHERE name = '6 x Classic Thin Roast Mini Dosas';
UPDATE menu_items SET gujarati_name = 'ચક્કરા/મીઠી પોંગલ' WHERE name = 'Chakkara/Sweet Pongal';
UPDATE menu_items SET gujarati_name = 'ચીઝ ઉત્તપમ' WHERE name = 'Cheese Uttappam';
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ ગોબી મસાલા (ઘી-મીની)' WHERE name = 'Chettinad Gobi Masala (Ghee-Mini)';
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ ગોબી મસાલા દોસાઈ (મીની)' WHERE name = 'Chettinad Gobi Masala Dosai (Mini)';
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ પનીર મસાલા (ઘી-મીની)' WHERE name = 'Chettinad Paneer Masala (Ghee-Mini)';
UPDATE menu_items SET gujarati_name = 'ચેટ્ટીનાડ પનીર મસાલા દોસાઈ (મીની)' WHERE name = 'Chettinad Paneer Masala Dosai (Mini)';
UPDATE menu_items SET gujarati_name = 'નારિયેળ શેક' WHERE name = 'Coconut Shake';
UPDATE menu_items SET gujarati_name = 'કોલ્ડ કોફી શેક' WHERE name = 'Cold Coffee Shake';
UPDATE menu_items SET gujarati_name = 'દહીં વડા - 2' WHERE name = 'Dahi Vada - 2';
UPDATE menu_items SET gujarati_name = 'ઘી કારા બાથ' WHERE name = 'Ghee Kaara Bath';
UPDATE menu_items SET gujarati_name = 'ઘી રોસ્ટ (મીની)' WHERE name = 'Ghee Roast (Mini)';
UPDATE menu_items SET gujarati_name = 'ઘી સાંભાર ઇડલી' WHERE name = 'Ghee Sambhar Idly';
UPDATE menu_items SET gujarati_name = 'ઘી સાંભાર વડા - 2' WHERE name = 'Ghee Sambhar Vada - 2';
UPDATE menu_items SET gujarati_name = 'ગ્રાન્ડ ચોલા કોમ્બો' WHERE name = 'Grand Chola Combo';
UPDATE menu_items SET gujarati_name = 'ગુલકંદ રોઝ શેક' WHERE name = 'Gulkand Rose Shake';
UPDATE menu_items SET gujarati_name = 'ઇડલી - 2' WHERE name = 'Idly - 2';
UPDATE menu_items SET gujarati_name = 'ઇડલી ફ્રાય - ચિલી ગાર્લિક મંચુરિયન' WHERE name = 'Idly fry - Chilli Garlic Manchurian';
UPDATE menu_items SET gujarati_name = 'ઇડલી ફ્રાય - દહીં ચાટ' WHERE name = 'Idly fry - Dahi Chat';

-- Get more items and continue
UPDATE menu_items SET gujarati_name = 'કલ્ડિંગ બટર મસાલા દોસાઈ' WHERE name LIKE '%Kalding Butter Masala%';
UPDATE menu_items SET gujarati_name = 'કર્ણાટક મસાલા દોસા' WHERE name LIKE '%Karnataka Masala%';
UPDATE menu_items SET gujarati_name = 'મસાલા દોસા' WHERE name = 'Masala Dosa' OR name LIKE '%Masala Dosai%';
UPDATE menu_items SET gujarati_name = 'મેદુ વડા' WHERE name LIKE '%Medu Vada%';
UPDATE menu_items SET gujarati_name = 'મૈસૂર મસાલા દોસા' WHERE name LIKE '%Mysore Masala%';
UPDATE menu_items SET gujarati_name = 'પનીર દોસા' WHERE name LIKE '%Paneer Dosa%';
UPDATE menu_items SET gujarati_name = 'પ્લેન દોસા' WHERE name LIKE '%Plain Dosa%';
UPDATE menu_items SET gujarati_name = 'પેસરટુ' WHERE name LIKE '%Pesarattu%';
UPDATE menu_items SET gujarati_name = 'રવા દોસા' WHERE name LIKE '%Rava Dosa%';
UPDATE menu_items SET gujarati_name = 'સાંભાર ઇડલી' WHERE name LIKE '%Sambhar Idly%' AND name NOT LIKE '%Ghee%';
UPDATE menu_items SET gujarati_name = 'સાંભાર વડા' WHERE name LIKE '%Sambhar Vada%' AND name NOT LIKE '%Ghee%';
UPDATE menu_items SET gujarati_name = 'સેટ દોસા' WHERE name LIKE '%Set Dosa%';
UPDATE menu_items SET gujarati_name = 'ઉપ્મા' WHERE name LIKE '%Upma%';
UPDATE menu_items SET gujarati_name = 'ઉત્તપમ' WHERE name LIKE '%Uttappam%' AND name NOT LIKE '%Cheese%';
UPDATE menu_items SET gujarati_name = 'વેન પોંગલ' WHERE name LIKE '%Ven Pongal%';

-- Beverages
UPDATE menu_items SET gujarati_name = 'કોફી' WHERE name = 'Coffee' OR name LIKE '%Filter Coffee%';
UPDATE menu_items SET gujarati_name = 'ચા' WHERE name = 'Tea' OR name = 'Chai';
UPDATE menu_items SET gujarati_name = 'બદામ મિલ્ક' WHERE name LIKE '%Badam%Milk%';
UPDATE menu_items SET gujarati_name = 'લસ્સી' WHERE name LIKE '%Lassi%';
UPDATE menu_items SET gujarati_name = 'છાશ' WHERE name LIKE '%Buttermilk%' OR name LIKE '%Chaas%';
UPDATE menu_items SET gujarati_name = 'ગરમ દૂધ' WHERE name LIKE '%Hot Milk%';
UPDATE menu_items SET gujarati_name = 'ઠંડું દૂધ' WHERE name LIKE '%Cold Milk%';
