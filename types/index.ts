import { Database } from './database';

// Database types
export type Table = Database['public']['Tables']['tables']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type MenuItem = Database['public']['Tables']['menu_items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type RestaurantSettings = Database['public']['Tables']['restaurant_settings']['Row'];

// Application types
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
