export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tables: {
        Row: {
          id: string
          table_number: number
          qr_code: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_number: number
          qr_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_number?: number
          qr_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_available: boolean
          is_vegetarian: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          is_available?: boolean
          is_vegetarian?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          is_available?: boolean
          is_vegetarian?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          table_id: string | null
          table_number: number
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'bill_requested' | 'paid' | 'cancelled'
          subtotal: number
          tax: number
          total: number
          notes: string | null
          viewed_by_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_id?: string | null
          table_number: number
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'bill_requested' | 'paid' | 'cancelled'
          subtotal?: number
          tax?: number
          total?: number
          notes?: string | null
          viewed_by_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_id?: string | null
          table_number?: number
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'bill_requested' | 'paid' | 'cancelled'
          subtotal?: number
          tax?: number
          total?: number
          notes?: string | null
          viewed_by_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          menu_item_id: string | null
          name: string
          price: number
          quantity: number
          special_instructions: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          menu_item_id?: string | null
          name: string
          price: number
          quantity?: number
          special_instructions?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          menu_item_id?: string | null
          name?: string
          price?: number
          quantity?: number
          special_instructions?: string | null
          created_at?: string
        }
      }
      restaurant_settings: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          tax_rate: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          logo_url?: string | null
          tax_rate?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          tax_rate?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
};
