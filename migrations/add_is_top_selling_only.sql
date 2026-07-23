-- Add is_top_selling field to menu_items table

-- Check if column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items'
    AND column_name = 'is_top_selling'
  ) THEN
    ALTER TABLE menu_items
    ADD COLUMN is_top_selling BOOLEAN NOT NULL DEFAULT false;

    CREATE INDEX idx_menu_items_top_selling ON menu_items(is_top_selling);
  END IF;
END $$;

-- Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'menu_items'
AND column_name = 'is_top_selling';
