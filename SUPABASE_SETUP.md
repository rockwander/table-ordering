# Supabase Setup Guide for Ramani's Cafe

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

## 2. Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number INTEGER UNIQUE NOT NULL,
  qr_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_vegetarian BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  table_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'bill_requested', 'paid', 'cancelled')),
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant Settings
CREATE TABLE restaurant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT DEFAULT 'Ramani''s Cafe',
  logo_url TEXT,
  tax_rate DECIMAL(5, 2) DEFAULT 5.00,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO restaurant_settings (name, tax_rate, currency)
VALUES ('Ramani''s Cafe', 5.00, 'INR');

-- Create indexes for better performance
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Enable Row Level Security
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access (customers)
-- Tables
CREATE POLICY "Tables are viewable by everyone" ON tables
  FOR SELECT USING (is_active = true);

-- Categories
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (is_active = true);

-- Menu Items
CREATE POLICY "Menu items are viewable by everyone" ON menu_items
  FOR SELECT USING (is_available = true);

-- Orders - customers can view their table's orders
CREATE POLICY "Orders are viewable by table" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Customers can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can update their orders" ON orders
  FOR UPDATE USING (status IN ('pending', 'bill_requested'));

-- Order Items
CREATE POLICY "Order items are viewable by everyone" ON order_items
  FOR SELECT USING (true);

CREATE POLICY "Customers can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Restaurant Settings
CREATE POLICY "Settings are viewable by everyone" ON restaurant_settings
  FOR SELECT USING (true);

-- Admin policies (authenticated users with admin role)
-- You'll need to set up admin authentication separately
-- For now, these policies allow authenticated users full access

CREATE POLICY "Admins can manage tables" ON tables
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage menu items" ON menu_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage order items" ON order_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage settings" ON restaurant_settings
  FOR ALL USING (auth.role() = 'authenticated');
```

## 3. Enable Realtime

1. Go to Database > Replication in your Supabase dashboard
2. Enable realtime for these tables:
   - `orders`
   - `order_items`
   - `menu_items`
   - `tables`

## 4. Authentication Setup

1. Go to Authentication > Providers
2. Enable Email authentication
3. Create an admin user:
   - Go to Authentication > Users
   - Click "Add User"
   - Email: `admin@ramaniscafe.com` (or your preferred email)
   - Password: Choose a strong password
   - Email Confirm: Yes

## 5. Environment Variables

Create a `.env.local` file in your project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 6. Sample Data (Optional)

You can insert sample menu items and categories for testing:

```sql
-- Sample Categories
INSERT INTO categories (name, description, display_order) VALUES
  ('Breakfast', 'Start your day right', 1),
  ('South Indian Specials', 'Authentic South Indian cuisine', 2),
  ('Beverages', 'Hot and cold drinks', 3),
  ('Desserts', 'Sweet endings', 4);

-- Sample Menu Items
INSERT INTO menu_items (category_id, name, description, price, is_vegetarian, display_order)
SELECT
  c.id,
  'Masala Dosa',
  'Crispy rice crepe with spiced potato filling',
  120.00,
  true,
  1
FROM categories c WHERE c.name = 'South Indian Specials';

INSERT INTO menu_items (category_id, name, description, price, is_vegetarian, display_order)
SELECT
  c.id,
  'Idli Sambar',
  'Steamed rice cakes with lentil soup',
  80.00,
  true,
  2
FROM categories c WHERE c.name = 'South Indian Specials';

INSERT INTO menu_items (category_id, name, description, price, is_vegetarian, display_order)
SELECT
  c.id,
  'Filter Coffee',
  'Traditional South Indian filter coffee',
  60.00,
  true,
  1
FROM categories c WHERE c.name = 'Beverages';

-- Sample Tables
INSERT INTO tables (table_number) VALUES
  (1), (2), (3), (4), (5), (6), (7), (8), (9), (10);
```
