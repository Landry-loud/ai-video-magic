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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          payload: Json | null
          target: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          payload?: Json | null
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          payload?: Json | null
          target?: string | null
        }
        Relationships: []
      }
      ai_analyses: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          project_id: string
          score: number | null
          source_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload: Json
          project_id: string
          score?: number | null
          source_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          project_id?: string
          score?: number | null
          source_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
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
          aspect_ratio: string | null
          audio_kbps: number | null
          bitrate_kbps: number | null
          burn_subs: boolean
          codec: string | null
          created_at: string
          duration_ms: number | null
          format: string
          fps: number | null
          id: string
          job_id: string | null
          project_id: string
          render_ms: number | null
          resolution: string
          size_bytes: number | null
          status: string
          storage_path: string | null
          thumbnail_url: string | null
          url: string | null
          user_id: string
          watermark: boolean
        }
        Insert: {
          aspect_ratio?: string | null
          audio_kbps?: number | null
          bitrate_kbps?: number | null
          burn_subs?: boolean
          codec?: string | null
          created_at?: string
          duration_ms?: number | null
          format?: string
          fps?: number | null
          id?: string
          job_id?: string | null
          project_id: string
          render_ms?: number | null
          resolution: string
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          thumbnail_url?: string | null
          url?: string | null
          user_id: string
          watermark?: boolean
        }
        Update: {
          aspect_ratio?: string | null
          audio_kbps?: number | null
          bitrate_kbps?: number | null
          burn_subs?: boolean
          codec?: string | null
          created_at?: string
          duration_ms?: number | null
          format?: string
          fps?: number | null
          id?: string
          job_id?: string | null
          project_id?: string
          render_ms?: number | null
          resolution?: string
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          thumbnail_url?: string | null
          url?: string | null
          user_id?: string
          watermark?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "exports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "processing_jobs"
            referencedColumns: ["id"]
          },
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read_at: string | null
          ref: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          read_at?: string | null
          ref?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          ref?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      processing_jobs: {
        Row: {
          attempt: number
          created_at: string
          credits_charged: number | null
          duration_ms: number | null
          error: string | null
          estimated_credits: number | null
          eta_seconds: number | null
          export_id: string | null
          finished_at: string | null
          id: string
          kind: Database["public"]["Enums"]["job_kind"]
          logs: Json
          max_attempts: number
          meta: Json | null
          progress: number
          project_id: string
          render_settings: Json | null
          result_url: string | null
          stage: string | null
          stage_progress: number
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string
          worker: string | null
        }
        Insert: {
          attempt?: number
          created_at?: string
          credits_charged?: number | null
          duration_ms?: number | null
          error?: string | null
          estimated_credits?: number | null
          eta_seconds?: number | null
          export_id?: string | null
          finished_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["job_kind"]
          logs?: Json
          max_attempts?: number
          meta?: Json | null
          progress?: number
          project_id: string
          render_settings?: Json | null
          result_url?: string | null
          stage?: string | null
          stage_progress?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id: string
          worker?: string | null
        }
        Update: {
          attempt?: number
          created_at?: string
          credits_charged?: number | null
          duration_ms?: number | null
          error?: string | null
          estimated_credits?: number | null
          eta_seconds?: number | null
          export_id?: string | null
          finished_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["job_kind"]
          logs?: Json
          max_attempts?: number
          meta?: Json | null
          progress?: number
          project_id?: string
          render_settings?: Json | null
          result_url?: string | null
          stage?: string | null
          stage_progress?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string
          worker?: string | null
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
          onboarded_at: string | null
          updated_at: string
          use_case: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          language?: string | null
          onboarded_at?: string | null
          updated_at?: string
          use_case?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          language?: string | null
          onboarded_at?: string | null
          updated_at?: string
          use_case?: string | null
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          project_id: string
          resolved: boolean
          time_sec: number | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          project_id: string
          resolved?: boolean
          time_sec?: number | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          project_id?: string
          resolved?: boolean
          time_sec?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_shares: {
        Row: {
          allow_remix: boolean
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          og_description: string | null
          og_image: string | null
          og_title: string | null
          project_id: string
          slug: string
          view_count: number
        }
        Insert: {
          allow_remix?: boolean
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          project_id: string
          slug?: string
          view_count?: number
        }
        Update: {
          allow_remix?: boolean
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          project_id?: string
          slug?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          team_id: string | null
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
          team_id?: string | null
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
          team_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
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
      support_tickets: {
        Row: {
          admin_reply: string | null
          body: string
          created_at: string
          id: string
          priority: string
          replied_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          body: string
          created_at?: string
          id?: string
          priority?: string
          replied_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          body?: string
          created_at?: string
          id?: string
          priority?: string
          replied_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          joined_at: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          plan: string
          seats_limit: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          plan?: string
          seats_limit?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          plan?: string
          seats_limit?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          author_id: string
          category: string | null
          created_at: string
          hero_url: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          like_count: number
          project_id: string | null
          remix_count: number
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string | null
          created_at?: string
          hero_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          like_count?: number
          project_id?: string | null
          remix_count?: number
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string | null
          created_at?: string
          hero_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          like_count?: number
          project_id?: string | null
          remix_count?: number
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_project_id_fkey"
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
      accept_team_invitation: { Args: { _token: string }; Returns: string }
      append_job_log: {
        Args: {
          _data?: Json
          _job_id: string
          _level: string
          _message: string
          _stage?: string
        }
        Returns: undefined
      }
      cancel_job: { Args: { _job_id: string }; Returns: boolean }
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
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      remix_template: { Args: { _template_id: string }; Returns: string }
      team_role_of: {
        Args: { _team_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["team_role"]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      job_kind: "transcribe" | "render" | "thumbnail" | "analyze"
      job_status:
        | "queued"
        | "processing"
        | "completed"
        | "failed"
        | "uploading"
        | "preparing"
        | "cancelled"
        | "retrying"
      plan_tier: "free" | "pro" | "agency"
      project_status: "draft" | "processing" | "ready" | "failed"
      team_role: "owner" | "admin" | "editor" | "viewer"
      ticket_status: "open" | "pending" | "closed"
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
      job_status: [
        "queued",
        "processing",
        "completed",
        "failed",
        "uploading",
        "preparing",
        "cancelled",
        "retrying",
      ],
      plan_tier: ["free", "pro", "agency"],
      project_status: ["draft", "processing", "ready", "failed"],
      team_role: ["owner", "admin", "editor", "viewer"],
      ticket_status: ["open", "pending", "closed"],
    },
  },
} as const
