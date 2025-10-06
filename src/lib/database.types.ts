export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: {
          id: string
          shop_domain: string
          access_token: string
          plan: 'starter' | 'growth' | 'pro'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_domain: string
          access_token: string
          plan?: 'starter' | 'growth' | 'pro'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_domain?: string
          access_token?: string
          plan?: 'starter' | 'growth' | 'pro'
          created_at?: string
          updated_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          merchant_id: string
          name: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          name: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          name?: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          created_at?: string
          updated_at?: string
        }
      }
      links: {
        Row: {
          id: string
          merchant_id: string
          campaign_id?: string
          code: string
          product_id: string
          product_handle: string
          variant_id: string
          quantity: number
          discount_code?: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          target_url: string
          permalink_type: 'product' | 'cart' | 'custom'
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          campaign_id?: string
          code: string
          product_id: string
          product_handle: string
          variant_id: string
          quantity: number
          discount_code?: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          target_url: string
          permalink_type?: 'product' | 'cart' | 'custom'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          campaign_id?: string
          code?: string
          product_id?: string
          product_handle?: string
          variant_id?: string
          quantity?: number
          discount_code?: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          target_url?: string
          permalink_type?: 'product' | 'cart' | 'custom'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      scans: {
        Row: {
          id: string
          link_id: string
          merchant_id: string
          timestamp: string
          ip_address?: string
          user_agent?: string
          referer?: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          created_at: string
        }
        Insert: {
          id?: string
          link_id: string
          merchant_id: string
          timestamp?: string
          ip_address?: string
          user_agent?: string
          referer?: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          created_at?: string
        }
        Update: {
          id?: string
          link_id?: string
          merchant_id?: string
          timestamp?: string
          ip_address?: string
          user_agent?: string
          referer?: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          merchant_id: string
          link_id?: string
          shop_order_id: string
          subtotal: number
          total: number
          currency: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          created_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          link_id?: string
          shop_order_id: string
          subtotal: number
          total: number
          currency: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          created_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          link_id?: string
          shop_order_id?: string
          subtotal?: number
          total?: number
          currency?: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_term?: string
          utm_content?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
