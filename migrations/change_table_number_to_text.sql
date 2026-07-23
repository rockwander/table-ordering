-- Migration: Change table_number from INTEGER to TEXT to support alphanumeric table names
-- This allows table numbers like "counter", "table-1", "VIP-A", etc.

BEGIN;

-- 1. Add new TEXT columns for table_number in all tables
ALTER TABLE tables
  ADD COLUMN table_number_new TEXT;

ALTER TABLE orders
  ADD COLUMN table_number_new TEXT;

ALTER TABLE buzzer_notifications
  ADD COLUMN table_number_new TEXT;

-- 2. Copy data from old INTEGER columns to new TEXT columns
UPDATE tables
  SET table_number_new = table_number::TEXT;

UPDATE orders
  SET table_number_new = table_number::TEXT;

UPDATE buzzer_notifications
  SET table_number_new = table_number::TEXT;

-- 3. Drop old INTEGER columns
ALTER TABLE tables
  DROP COLUMN table_number;

ALTER TABLE orders
  DROP COLUMN table_number;

ALTER TABLE buzzer_notifications
  DROP COLUMN table_number;

-- 4. Rename new columns to original name
ALTER TABLE tables
  RENAME COLUMN table_number_new TO table_number;

ALTER TABLE orders
  RENAME COLUMN table_number_new TO table_number;

ALTER TABLE buzzer_notifications
  RENAME COLUMN table_number_new TO table_number;

-- 5. Add NOT NULL constraints
ALTER TABLE tables
  ALTER COLUMN table_number SET NOT NULL;

ALTER TABLE orders
  ALTER COLUMN table_number SET NOT NULL;

ALTER TABLE buzzer_notifications
  ALTER COLUMN table_number SET NOT NULL;

-- 6. Add unique constraint on tables.table_number
ALTER TABLE tables
  ADD CONSTRAINT tables_table_number_unique UNIQUE (table_number);

-- 7. Recreate indexes with TEXT type
DROP INDEX IF EXISTS idx_buzzer_notifications_table_number;
CREATE INDEX idx_orders_table_number ON orders(table_number);
CREATE INDEX idx_buzzer_notifications_table_number ON buzzer_notifications(table_number);

-- 8. Insert "counter" table if it doesn't exist
INSERT INTO tables (table_number, qr_code, is_active)
VALUES ('counter', 'counter', true)
ON CONFLICT (table_number) DO NOTHING;

COMMIT;

-- Verify the changes
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('tables', 'orders', 'buzzer_notifications')
  AND column_name = 'table_number'
ORDER BY table_name;

-- Show all tables including the new "counter" table
SELECT * FROM tables ORDER BY
  CASE
    WHEN table_number = 'counter' THEN 0
    ELSE 1
  END,
  table_number;
