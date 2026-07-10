-- Add viewed_by_admin column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS viewed_by_admin BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_viewed ON orders(viewed_by_admin);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders(table_number, status);
