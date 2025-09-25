export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics_daily: {
        Row: {
          created_at: string | null
          date: string
          id: string
          orders_by_status: Json | null
          orders_by_time: Json | null
          top_products: Json | null
          total_orders: number | null
          total_revenue: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          orders_by_status?: Json | null
          orders_by_time?: Json | null
          top_products?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          orders_by_status?: Json | null
          orders_by_time?: Json | null
          top_products?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      break_times_config: {
        Row: {
          break_time: string
          created_at: string | null
          cycle: Database["public"]["Enums"]["user_role"]
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          break_time: string
          created_at?: string | null
          cycle: Database["public"]["Enums"]["user_role"]
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          break_time?: string
          created_at?: string | null
          cycle?: Database["public"]["Enums"]["user_role"]
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          change_type: string
          created_at: string | null
          created_by: string | null
          id: string
          new_quantity: number
          previous_quantity: number
          product_id: string | null
          quantity_change: number
          reason: string | null
        }
        Insert: {
          change_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_quantity: number
          previous_quantity: number
          product_id?: string | null
          quantity_change: number
          reason?: string | null
        }
        Update: {
          change_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          new_quantity?: number
          previous_quantity?: number
          product_id?: string | null
          quantity_change?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          customizations: Json | null
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          customizations?: Json | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          customizations?: Json | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          scheduled_time: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string | null
          user_cycle: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          scheduled_time: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string | null
          user_cycle?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          scheduled_time?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string | null
          user_cycle?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          is_available: boolean | null
          is_customizable: boolean | null
          min_stock_alert: number | null
          name: string
          price: number
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean | null
          is_customizable?: boolean | null
          min_stock_alert?: number | null
          name: string
          price: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean | null
          is_customizable?: boolean | null
          min_stock_alert?: number | null
          name?: string
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          reason: string
          reported_id: string | null
          reporter_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          reason: string
          reported_id?: string | null
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          reason?: string
          reported_id?: string | null
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          product_id: string | null
          rating: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          rating: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          rating?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctions: {
        Row: {
          created_at: string | null
          created_by: string | null
          duration_hours: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          reason: string
          type: Database["public"]["Enums"]["sanction_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
          type: Database["public"]["Enums"]["sanction_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
          type?: Database["public"]["Enums"]["sanction_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sanctions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanctions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          address: string | null
          birth_date: string | null
          course: string | null
          created_at: string | null
          email: string
          emergency_contact: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          password_hash: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          course?: string | null
          created_at?: string | null
          email: string
          emergency_contact?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          password_hash: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          course?: string | null
          created_at?: string | null
          email?: string
          emergency_contact?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          password_hash?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_daily_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      order_status: "pendiente" | "en_preparacion" | "listo" | "entregado" | "cancelado"
      payment_method: "tarjeta" | "mercadopago" | "efectivo"
      user_role: "ciclo_basico" | "ciclo_superior" | "kiosquero" | "admin"
      report_status: "pending" | "reviewed" | "resolved"
      sanction_type: "warning" | "timeout" | "ban"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never