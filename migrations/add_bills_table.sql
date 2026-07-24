-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number TEXT UNIQUE NOT NULL,
  table_number TEXT NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  settled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add bill_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES bills(id) ON DELETE SET NULL;

-- Remove tax from orders table (set to 0 for existing records)
UPDATE orders SET tax = 0 WHERE tax IS NOT NULL;

-- Update total to equal subtotal (removing tax)
UPDATE orders SET total = subtotal WHERE total != subtotal;

-- Create index for bills
CREATE INDEX IF NOT EXISTS idx_bills_table_number ON bills(table_number);
CREATE INDEX IF NOT EXISTS idx_bills_settled_at ON bills(settled_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_bill ON orders(bill_id);

-- Enable RLS for bills
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bills
CREATE POLICY "Bills are viewable by everyone" ON bills
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage bills" ON bills
  FOR ALL USING (auth.role() = 'authenticated');
