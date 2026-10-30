-- Add is_mrp flag to menu_items
-- MRP items are sold at their printed Maximum Retail Price, so the app discount never applies to them.
-- Order items read this flag through order_items.menu_item_id.

ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS is_mrp BOOLEAN NOT NULL DEFAULT false;

-- Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'menu_items'
AND column_name = 'is_mrp';
