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
      admin_notifications: {
        Row: {
          admin_email: string
          client_email: string
          error_message: string | null
          gallery_id: string
          id: string
          notification_data: Json | null
          sent_at: string
          status: string
          type: string
        }
        Insert: {
          admin_email: string
          client_email: string
          error_message?: string | null
          gallery_id: string
          id?: string
          notification_data?: Json | null
          sent_at?: string
          status?: string
          type?: string
        }
        Update: {
          admin_email?: string
          client_email?: string
          error_message?: string | null
          gallery_id?: string
          id?: string
          notification_data?: Json | null
          sent_at?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          access_code: string
          created_at: string
          email: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          access_code: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          access_code?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      download_attempts: {
        Row: {
          attempt_type: string
          attempted_at: string | null
          blocked: boolean | null
          client_email: string
          gallery_id: string | null
          id: string
          ip_address: string | null
          photo_id: string | null
          user_agent: string | null
        }
        Insert: {
          attempt_type: string
          attempted_at?: string | null
          blocked?: boolean | null
          client_email: string
          gallery_id?: string | null
          id?: string
          ip_address?: string | null
          photo_id?: string | null
          user_agent?: string | null
        }
        Update: {
          attempt_type?: string
          attempted_at?: string | null
          blocked?: boolean | null
          client_email?: string
          gallery_id?: string | null
          id?: string
          ip_address?: string | null
          photo_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "download_attempts_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "download_attempts_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      galleries: {
        Row: {
          access_code: string
          client_email: string | null
          client_id: string | null
          client_name: string | null
          created_at: string
          free_photo_limit: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          access_code: string
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          free_photo_limit?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          access_code?: string
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          free_photo_limit?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "galleries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      image_access_logs: {
        Row: {
          access_token: string
          accessed_at: string | null
          chunk_id: string | null
          client_email: string
          expires_at: string
          gallery_id: string | null
          id: string
          ip_address: string | null
          is_suspicious: boolean | null
          photo_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_token: string
          accessed_at?: string | null
          chunk_id?: string | null
          client_email: string
          expires_at: string
          gallery_id?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          photo_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_token?: string
          accessed_at?: string | null
          chunk_id?: string | null
          client_email?: string
          expires_at?: string
          gallery_id?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          photo_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_access_logs_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "image_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_access_logs_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_access_logs_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      image_chunks: {
        Row: {
          accessed_at: string | null
          chunk_index: number
          chunk_token: string
          client_email: string
          created_at: string | null
          expires_at: string
          gallery_id: string
          id: string
          photo_id: string
        }
        Insert: {
          accessed_at?: string | null
          chunk_index: number
          chunk_token: string
          client_email: string
          created_at?: string | null
          expires_at: string
          gallery_id: string
          id?: string
          photo_id: string
        }
        Update: {
          accessed_at?: string | null
          chunk_index?: number
          chunk_token?: string
          client_email?: string
          created_at?: string | null
          expires_at?: string
          gallery_id?: string
          id?: string
          photo_id?: string
        }
        Relationships: []
      }
      payment_sessions: {
        Row: {
          amount_cents: number
          client_email: string
          created_at: string
          extra_photos_count: number
          gallery_id: string
          id: string
          status: string
          stripe_session_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          client_email: string
          created_at?: string
          extra_photos_count: number
          gallery_id: string
          id?: string
          status?: string
          stripe_session_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          client_email?: string
          created_at?: string
          extra_photos_count?: number
          gallery_id?: string
          id?: string
          status?: string
          stripe_session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_sessions_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_selections: {
        Row: {
          client_email: string
          gallery_id: string
          id: string
          photo_id: string
          selected_at: string
        }
        Insert: {
          client_email: string
          gallery_id: string
          id?: string
          photo_id: string
          selected_at?: string
        }
        Update: {
          client_email?: string
          gallery_id?: string
          id?: string
          photo_id?: string
          selected_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_selections_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_selections_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string
          description: string | null
          filename: string
          gallery_id: string
          id: string
          is_selected: boolean | null
          storage_path: string
          thumbnail_path: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          filename: string
          gallery_id: string
          id?: string
          is_selected?: boolean | null
          storage_path: string
          thumbnail_path?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          filename?: string
          gallery_id?: string
          id?: string
          is_selected?: boolean | null
          storage_path?: string
          thumbnail_path?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      viewing_sessions: {
        Row: {
          client_email: string
          created_at: string | null
          current_views: number | null
          expires_at: string
          gallery_id: string | null
          id: string
          ip_address: string | null
          max_views: number | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          client_email: string
          created_at?: string | null
          current_views?: number | null
          expires_at: string
          gallery_id?: string | null
          id?: string
          ip_address?: string | null
          max_views?: number | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          client_email?: string
          created_at?: string | null
          current_views?: number | null
          expires_at?: string
          gallery_id?: string | null
          id?: string
          ip_address?: string | null
          max_views?: number | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viewing_sessions_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_chunks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_access_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      handle_photo_selections: {
        Args: {
          p_gallery_id: string
          p_client_email: string
          p_photo_ids: string[]
        }
        Returns: undefined
      }
      increment_session_views: {
        Args: { p_session_token: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
