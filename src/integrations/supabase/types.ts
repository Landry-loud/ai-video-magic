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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          id: string
          reason: string
          ref_id: string | null
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          reason: string
          ref_id?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          ref_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credits: {
        Row: {
          balance: number
          monthly_credits: number
          period_end: string
          plan: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          monthly_credits?: number
          period_end?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          monthly_credits?: number
          period_end?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exports: {
        Row: {
          burn_subs: boolean
          created_at: string
          format: string
          id: string
          project_id: string
          resolution: string
          size_bytes: number | null
          url: string | null
          user_id: string
        }
        Insert: {
          burn_subs?: boolean
          created_at?: string
          format?: string
          id?: string
          project_id: string
          resolution: string
          size_bytes?: number | null
          url?: string | null
          user_id: string
        }
        Update: {
          burn_subs?: boolean
          created_at?: string
          format?: string
          id?: string
          project_id?: string
          resolution?: string
          size_bytes?: number | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          description: string | null
          hosted_url: string | null
          id: string
          pdf_url: string | null
          provider: string
          provider_invoice_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description?: string | null
          hosted_url?: string | null
          id?: string
          pdf_url?: string | null
          provider?: string
          provider_invoice_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          hosted_url?: string | null
          id?: string
          pdf_url?: string | null
          provider?: string
          provider_invoice_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      processing_jobs: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          kind: Database["public"]["Enums"]["job_kind"]
          meta: Json | null
          progress: number
          project_id: string
          result_url: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["job_kind"]
          meta?: Json | null
          progress?: number
          project_id: string
          result_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["job_kind"]
          meta?: Json | null
          progress?: number
          project_id?: string
          result_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          language: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          language?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          language?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          prompt: string | null
          status: Database["public"]["Enums"]["project_status"]
          style: string | null
          subtitle_style: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          prompt?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          style?: string | null
          subtitle_style?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          prompt?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          style?: string | null
          subtitle_style?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subtitles: {
        Row: {
          end_ms: number
          id: string
          order_index: number
          project_id: string
          start_ms: number
          text: string
          user_id: string
        }
        Insert: {
          end_ms: number
          id?: string
          order_index?: number
          project_id: string
          start_ms: number
          text: string
          user_id: string
        }
        Update: {
          end_ms?: number
          id?: string
          order_index?: number
          project_id?: string
          start_ms?: number
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtitles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          duration_sec: number | null
          filename: string
          fps: number | null
          height: number | null
          id: string
          size_bytes: number | null
          storage_path: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          duration_sec?: number | null
          filename: string
          fps?: number | null
          height?: number | null
          id?: string
          size_bytes?: number | null
          storage_path: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          duration_sec?: number | null
          filename?: string
          fps?: number | null
          height?: number | null
          id?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_credits: {
        Args: { _amount: number; _reason: string; _ref?: string }
        Returns: number
      }
      grant_credits: {
        Args: {
          _amount: number
          _reason: string
          _ref?: string
          _user_id: string
        }
        Returns: number
      }
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
      job_kind: "transcribe" | "render" | "thumbnail" | "analyze"
      job_status: "queued" | "processing" | "completed" | "failed"
      plan_tier: "free" | "pro" | "agency"
      project_status: "draft" | "processing" | "ready" | "failed"
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
      job_kind: ["transcribe", "render", "thumbnail", "analyze"],
      job_status: ["queued", "processing", "completed", "failed"],
      plan_tier: ["free", "pro", "agency"],
      project_status: ["draft", "processing", "ready", "failed"],
    },
  },
} as const
