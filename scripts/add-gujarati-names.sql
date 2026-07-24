-- Add gujarati_name field to menu_items table
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS gujarati_name TEXT;

-- Add some example Gujarati names for common items
-- You'll need to update these with your actual menu items

-- Example updates (replace with your actual item names):
-- UPDATE menu_items SET gujarati_name = 'દોસા' WHERE name = 'Dosa';
-- UPDATE menu_items SET gujarati_name = 'ઇડલી' WHERE name = 'Idli';
-- UPDATE menu_items SET gujarati_name = 'વડા' WHERE name = 'Vada';
-- UPDATE menu_items SET gujarati_name = 'કોફી' WHERE name = 'Coffee';
-- UPDATE menu_items SET gujarati_name = 'ચા' WHERE name = 'Tea';
