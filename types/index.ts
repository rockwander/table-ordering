// Type exports for Turbopack compatibility

export type Table = {
  id: string;
  table_number: string;
  qr_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_vegetarian: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  table_id: string | null;
  table_number: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'bill_requested' | 'paid' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  viewed_by_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string | null;
  menu_item_id: string | null;
  name: string;
  price: number;
  quantity: number;
  special_instructions: string | null;
  created_at: string;
};

export type RestaurantSettings = {
  id: string;
  name: string;
  logo_url: string | null;
  tax_rate: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface MenuItemWithCategory extends MenuItem {
  category?: Category;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'bill_requested' | 'paid' | 'cancelled';

export type BuzzerNotification = {
  id: string;
  table_number: string;
  status: 'active' | 'dismissed';
  notification_type?: 'service_call' | 'new_order';
  created_at: string;
  dismissed_at: string | null;
};

// Add a default export to help module resolution
export default {};
