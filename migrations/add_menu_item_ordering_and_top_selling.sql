-- Add display_order and is_top_selling fields to menu_items table
-- This allows menu items to be reordered and marked as top selling

-- Add display_order column (defaults to id for existing items)
ALTER TABLE menu_items
ADD COLUMN display_order INTEGER;

-- Set initial display_order based on creation order (id)
UPDATE menu_items
SET display_order = CAST(EXTRACT(EPOCH FROM created_at) AS INTEGER);

-- Make display_order NOT NULL after setting values
ALTER TABLE menu_items
ALTER COLUMN display_order SET NOT NULL;

-- Add is_top_selling column (defaults to false)
ALTER TABLE menu_items
ADD COLUMN is_top_selling BOOLEAN NOT NULL DEFAULT false;

-- Add index for efficient sorting
CREATE INDEX idx_menu_items_display_order ON menu_items(display_order);
CREATE INDEX idx_menu_items_top_selling ON menu_items(is_top_selling);

-- Verify changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'menu_items'
AND column_name IN ('display_order', 'is_top_selling');
