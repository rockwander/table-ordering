-- Migration: Make table_id nullable to support Admin Orders
-- This allows admins to create orders without assigning them to a specific table

-- Make table_number nullable in orders table
ALTER TABLE orders
ALTER COLUMN table_number DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN orders.table_number IS 'Table number for this order. NULL for admin orders created without table assignment.';

-- Create index for admin orders (where table_number is null)
CREATE INDEX IF NOT EXISTS idx_orders_admin_orders ON orders(id) WHERE table_number IS NULL;
