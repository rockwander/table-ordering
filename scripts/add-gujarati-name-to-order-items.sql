-- Add gujarati_name field to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gujarati_name TEXT;

-- Update existing order items to have gujarati_name from menu_items
UPDATE order_items oi
SET gujarati_name = mi.gujarati_name
FROM menu_items mi
WHERE oi.menu_item_id = mi.id
  AND oi.gujarati_name IS NULL;
