export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string;
          booking_time: string;
          created_at: string;
          customer_email: string | null;
          customer_name: string;
          customer_phone: string;
          id: string;
          notes: string | null;
          salon_id: string;
          service_name: string;
          service_price: number;
          status: string;
          user_id: string | null;
        };
        Insert: {
          booking_date: string;
          booking_time: string;
          created_at?: string;
          customer_email?: string | null;
          customer_name: string;
          customer_phone: string;
          id?: string;
          notes?: string | null;
          salon_id: string;
          service_name: string;
          service_price: number;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          booking_date?: string;
          booking_time?: string;
          created_at?: string;
          customer_email?: string | null;
          customer_name?: string;
          customer_phone?: string;
          id?: string;
          notes?: string | null;
          salon_id?: string;
          service_name?: string;
          service_price?: number;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      salon_holidays: {
        Row: {
          created_at: string;
          holiday_date: string;
          id: string;
          reason: string | null;
          salon_id: string;
        };
        Insert: {
          created_at?: string;
          holiday_date: string;
          id?: string;
          reason?: string | null;
          salon_id: string;
        };
        Update: {
          created_at?: string;
          holiday_date?: string;
          id?: string;
          reason?: string | null;
          salon_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_holidays_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      salons: {
        Row: {
          address: string;
          approved_at: string | null;
          created_at: string;
          description: string;
          email: string | null;
          featured: boolean;
          hours: string;
          id: string;
          image_url: string;
          instagram: string | null;
          max_bookings_per_day: number;
          name: string;
          neighborhood: string;
          owner_id: string | null;
          phone: string | null;
          price_tier: string;
          published: boolean;
          rating: number;
          rejection_reason: string | null;
          review_count: number;
          services: Json;
          slug: string;
          specialties: string[];
          status: string;
          submitted_at: string | null;
          tagline: string | null;
          updated_at: string;
          website: string | null;
          verification_document: string | null;
        };
        Insert: {
          address: string;
          approved_at?: string | null;
          created_at?: string;
          description: string;
          email?: string | null;
          featured?: boolean;
          hours?: string;
          id?: string;
          image_url: string;
          instagram?: string | null;
          max_bookings_per_day?: number;
          name: string;
          neighborhood: string;
          owner_id?: string | null;
          phone?: string | null;
          price_tier?: string;
          published?: boolean;
          rating?: number;
          rejection_reason?: string | null;
          review_count?: number;
          services?: Json;
          slug: string;
          specialties?: string[];
          status?: string;
          submitted_at?: string | null;
          tagline?: string | null;
          updated_at?: string;
          website?: string | null;
          verification_document?: string | null;
        };
        Update: {
          address?: string;
          approved_at?: string | null;
          created_at?: string;
          description?: string;
          email?: string | null;
          featured?: boolean;
          hours?: string;
          id?: string;
          image_url?: string;
          instagram?: string | null;
          max_bookings_per_day?: number;
          name?: string;
          neighborhood?: string;
          owner_id?: string | null;
          phone?: string | null;
          price_tier?: string;
          published?: boolean;
          rating?: number;
          rejection_reason?: string | null;
          review_count?: number;
          services?: Json;
          slug?: string;
          specialties?: string[];
          status?: string;
          submitted_at?: string | null;
          tagline?: string | null;
          updated_at?: string;
          website?: string | null;
          verification_document?: string | null;
        };
        Relationships: [];
      };
      special_requests: {
        Row: {
          created_at: string;
          customer_email: string | null;
          customer_name: string;
          customer_phone: string;
          id: string;
          message: string;
          preferred_date: string | null;
          salon_id: string;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          customer_email?: string | null;
          customer_name: string;
          customer_phone: string;
          id?: string;
          message: string;
          preferred_date?: string | null;
          salon_id: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          customer_email?: string | null;
          customer_name?: string;
          customer_phone?: string;
          id?: string;
          message?: string;
          preferred_date?: string | null;
          salon_id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "special_requests_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_approve_salon: {
        Args: { _approve: boolean; _reason?: string; _salon_id: string };
        Returns: undefined;
      };
      admin_list_users: {
        Args: never;
        Returns: {
          avatar_url: string;
          booking_count: number;
          created_at: string;
          email: string;
          full_name: string;
          roles: Database["public"]["Enums"]["app_role"][];
          user_id: string;
        }[];
      };
      admin_set_role: {
        Args: {
          _grant: boolean;
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: undefined;
      };
      claim_first_admin: { Args: never; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "customer" | "salon_owner" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "salon_owner", "admin"],
    },
  },
} as const;
