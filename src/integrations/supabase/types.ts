export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          brand_id: number
          brand_name: string
          created_at: string | null
          logo_url: string | null
          sourcing_link: string | null
          updated_at: string | null
          uuid: string
          website_url: string | null
        }
        Insert: {
          brand_id: number
          brand_name: string
          created_at?: string | null
          logo_url?: string | null
          sourcing_link?: string | null
          updated_at?: string | null
          uuid?: string
          website_url?: string | null
        }
        Update: {
          brand_id?: number
          brand_name?: string
          created_at?: string | null
          logo_url?: string | null
          sourcing_link?: string | null
          updated_at?: string | null
          uuid?: string
          website_url?: string | null
        }
        Relationships: []
      }
      creator_brand_insights: {
        Row: {
          brand_id: number
          created_at: string | null
          creator_id: number
          id: string
          theme_id: string
          updated_at: string | null
          value: number
        }
        Insert: {
          brand_id: number
          created_at?: string | null
          creator_id: number
          id?: string
          theme_id: string
          updated_at?: string | null
          value: number
        }
        Update: {
          brand_id?: number
          created_at?: string | null
          creator_id?: number
          id?: string
          theme_id?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "creator_brand_insights_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "creator_brand_insights_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["creator_id"]
          },
        ]
      }
      creator_engagement_events: {
        Row: {
          brand_id: number | null
          created_at: string
          creator_id: number
          event_type: string
          id: string
          metadata: Json | null
          theme_id: string | null
        }
        Insert: {
          brand_id?: number | null
          created_at?: string
          creator_id: number
          event_type: string
          id?: string
          metadata?: Json | null
          theme_id?: string | null
        }
        Update: {
          brand_id?: number | null
          created_at?: string
          creator_id?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          theme_id?: string | null
        }
        Relationships: []
      }
      creator_x_product_recommendations: {
        Row: {
          brand: string | null
          count_90_days: number
          created_at: string
          creator_id: number | null
          header: string | null
          id: number
          name: string
          platform: string | null
          post_clicks: number
          product_id: number | null
          purchase_url: string | null
          sim_score: number
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          count_90_days?: number
          created_at?: string
          creator_id?: number | null
          header?: string | null
          id?: never
          name: string
          platform?: string | null
          post_clicks?: number
          product_id?: number | null
          purchase_url?: string | null
          sim_score: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          count_90_days?: number
          created_at?: string
          creator_id?: number | null
          header?: string | null
          id?: never
          name?: string
          platform?: string | null
          post_clicks?: number
          product_id?: number | null
          purchase_url?: string | null
          sim_score?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_x_product_recommendations_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["creator_id"]
          },
        ]
      }
      creators: {
        Row: {
          created_at: string | null
          creator_id: number
          name: string
          updated_at: string | null
          uuid: string
        }
        Insert: {
          created_at?: string | null
          creator_id: number
          name: string
          updated_at?: string | null
          uuid?: string
        }
        Update: {
          created_at?: string | null
          creator_id?: number
          name?: string
          updated_at?: string | null
          uuid?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          creator_id: number
          id: string
          q1_useful: string | null
          q1_value_rating: number | null
          q2_actionability: string | null
          q2_intent: string | null
          q3_themes: string | null
          q4_missing_info: string | null
          q5_barriers: string | null
          q6_open_feedback: string | null
          submitted_at: string | null
        }
        Insert: {
          creator_id: number
          id?: string
          q1_useful?: string | null
          q1_value_rating?: number | null
          q2_actionability?: string | null
          q2_intent?: string | null
          q3_themes?: string | null
          q4_missing_info?: string | null
          q5_barriers?: string | null
          q6_open_feedback?: string | null
          submitted_at?: string | null
        }
        Update: {
          creator_id?: number
          id?: string
          q1_useful?: string | null
          q1_value_rating?: number | null
          q2_actionability?: string | null
          q2_intent?: string | null
          q3_themes?: string | null
          q4_missing_info?: string | null
          q5_barriers?: string | null
          q6_open_feedback?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["creator_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      creator_brand_pairs: {
        Row: {
          brand_name: string | null
          creator_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_brand_insights_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["creator_id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
