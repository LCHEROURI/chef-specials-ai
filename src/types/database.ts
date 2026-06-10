export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      folders: {
        Row: {
          color: string;
          created_at: string;
          folder_name: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          folder_name: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          folder_name?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string | null;
          plan: Database["public"]["Enums"]["account_plan"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          name?: string | null;
          plan?: Database["public"]["Enums"]["account_plan"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string | null;
          plan?: Database["public"]["Enums"]["account_plan"];
          updated_at?: string;
        };
        Relationships: [];
      };
      prompt_files: {
        Row: {
          created_at: string;
          file_name: string;
          id: string;
          mime_type: string;
          prompt_id: string;
          size_bytes: number;
          storage_path: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          id?: string;
          mime_type: string;
          prompt_id: string;
          size_bytes: number;
          storage_path: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["prompt_files"]["Insert"]>;
        Relationships: [];
      };
      prompt_folders: {
        Row: {
          folder_id: string;
          prompt_id: string;
        };
        Insert: {
          folder_id: string;
          prompt_id: string;
        };
        Update: {
          folder_id?: string;
          prompt_id?: string;
        };
        Relationships: [];
      };
      prompt_tags: {
        Row: {
          prompt_id: string;
          tag_id: string;
        };
        Insert: {
          prompt_id: string;
          tag_id: string;
        };
        Update: {
          prompt_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
      prompt_usage: {
        Row: {
          last_used: string;
          prompt_id: string;
          updated_at: string;
          use_count: number;
          user_id: string;
        };
        Insert: {
          last_used?: string;
          prompt_id: string;
          updated_at?: string;
          use_count?: number;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["prompt_usage"]["Insert"]>;
        Relationships: [];
      };
      prompt_versions: {
        Row: {
          change_notes: string | null;
          created_at: string;
          created_by: string;
          id: string;
          prompt_id: string;
          prompt_text: string;
          version_number: number;
        };
        Insert: {
          change_notes?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          prompt_id: string;
          prompt_text: string;
          version_number: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["prompt_versions"]["Insert"]
        >;
        Relationships: [];
      };
      prompts: {
        Row: {
          ai_platform: string;
          category: string;
          created_at: string;
          description: string;
          favorite: boolean;
          id: string;
          prompt_text: string;
          rating: number | null;
          search_document: unknown;
          status: Database["public"]["Enums"]["prompt_status"];
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_platform: string;
          category: string;
          created_at?: string;
          description?: string;
          favorite?: boolean;
          id?: string;
          prompt_text: string;
          rating?: number | null;
          status?: Database["public"]["Enums"]["prompt_status"];
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["prompts"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          plan: Database["public"]["Enums"]["account_plan"];
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          plan?: Database["public"]["Enums"]["account_plan"];
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["subscriptions"]["Insert"]
        >;
        Relationships: [];
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["tags"]["Insert"]>;
        Relationships: [];
      };
      templates: {
        Row: {
          ai_platform: string;
          category: string;
          created_at: string;
          description: string;
          id: string;
          is_system: boolean;
          owner_id: string | null;
          prompt_text: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          ai_platform: string;
          category: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_system?: boolean;
          owner_id?: string | null;
          prompt_text: string;
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["templates"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_prompt_use: {
        Args: { p_prompt_id: string };
        Returns: Database["public"]["Tables"]["prompt_usage"]["Row"];
      };
      save_prompt: {
        Args: {
          p_ai_platform: string;
          p_category: string;
          p_change_notes?: string | null;
          p_description: string;
          p_favorite: boolean;
          p_id: string | null;
          p_prompt_text: string;
          p_rating: number | null;
          p_status: Database["public"]["Enums"]["prompt_status"];
          p_title: string;
        };
        Returns: Database["public"]["Tables"]["prompts"]["Row"];
      };
      search_prompts: {
        Args: {
          p_category?: string | null;
          p_created_from?: string | null;
          p_created_to?: string | null;
          p_favorite?: boolean | null;
          p_limit?: number;
          p_min_rating?: number | null;
          p_offset?: number;
          p_platform?: string | null;
          p_query?: string | null;
          p_sort?: string;
          p_status?: Database["public"]["Enums"]["prompt_status"] | null;
          p_tags?: string[] | null;
        };
        Returns: Array<
          Omit<
            Database["public"]["Tables"]["prompts"]["Row"],
            "search_document"
          > & { total_count: number }
        >;
      };
    };
    Enums: {
      account_plan: "free" | "pro";
      prompt_status: "active" | "archived";
      subscription_status:
        | "inactive"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled";
    };
    CompositeTypes: Record<string, never>;
  };
};
