export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      badge_definitions: {
        Row: {
          created_at: string
          criteria_type: string
          description: string
          icon_emoji: string
          name: string
          slug: string
          threshold: number | null
        }
        Insert: {
          created_at?: string
          criteria_type: string
          description: string
          icon_emoji?: string
          name: string
          slug: string
          threshold?: number | null
        }
        Update: {
          created_at?: string
          criteria_type?: string
          description?: string
          icon_emoji?: string
          name?: string
          slug?: string
          threshold?: number | null
        }
        Relationships: []
      }
      club_memberships: {
        Row: {
          club_id: string
          id: string
          is_active: boolean
          joined_at: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          is_active?: boolean
          joined_at?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          age_bands: Database["public"]["Enums"]["age_band"][]
          cover_image_url: string | null
          created_at: string
          description: string
          id: string
          is_active: boolean
          mission: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          age_bands?: Database["public"]["Enums"]["age_band"][]
          cover_image_url?: string | null
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          mission: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          age_bands?: Database["public"]["Enums"]["age_band"][]
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          mission?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          moderator_note: string | null
          reason: string
          reporter_user_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          moderator_note?: string | null
          reason: string
          reporter_user_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_type?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          moderator_note?: string | null
          reason?: string
          reporter_user_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_links: {
        Row: {
          approved_at: string | null
          child_user_id: string
          created_at: string
          id: string
          parent_user_id: string
          publish_requires_approval: boolean
          relationship: string
          spending_requires_approval: boolean
          status: string
        }
        Insert: {
          approved_at?: string | null
          child_user_id: string
          created_at?: string
          id?: string
          parent_user_id: string
          publish_requires_approval?: boolean
          relationship?: string
          spending_requires_approval?: boolean
          status?: string
        }
        Update: {
          approved_at?: string | null
          child_user_id?: string
          created_at?: string
          id?: string
          parent_user_id?: string
          publish_requires_approval?: boolean
          relationship?: string
          spending_requires_approval?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_links_child_user_id_fkey"
            columns: ["child_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_links_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kana_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          reason: Database["public"]["Enums"]["kana_reason"]
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          reason: Database["public"]["Enums"]["kana_reason"]
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          reason?: Database["public"]["Enums"]["kana_reason"]
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kana_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          reference_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          reference_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          reference_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          notify_on_approval: boolean
          notify_on_moderation: boolean
          notify_on_submission: boolean
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          notify_on_approval?: boolean
          notify_on_moderation?: boolean
          notify_on_submission?: boolean
          phone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          notify_on_approval?: boolean
          notify_on_moderation?: boolean
          notify_on_submission?: boolean
          phone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_guardian_invites: {
        Row: {
          child_user_id: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          parent_email: string
          token_hash: string
        }
        Insert: {
          child_user_id: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          parent_email: string
          token_hash: string
        }
        Update: {
          child_user_id?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          parent_email?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_guardian_invites_child_user_id_fkey"
            columns: ["child_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          age_band: Database["public"]["Enums"]["age_band"]
          body: string
          club_id: string | null
          coins_awarded: number
          created_at: string
          id: string
          parent_review_note: string | null
          parent_reviewed_at: string | null
          parent_reviewed_by: string | null
          published_at: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string | null
          title: string
          youth_user_id: string
        }
        Insert: {
          age_band: Database["public"]["Enums"]["age_band"]
          body: string
          club_id?: string | null
          coins_awarded?: number
          created_at?: string
          id?: string
          parent_review_note?: string | null
          parent_reviewed_at?: string | null
          parent_reviewed_by?: string | null
          published_at?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          title: string
          youth_user_id: string
        }
        Update: {
          age_band?: Database["public"]["Enums"]["age_band"]
          body?: string
          club_id?: string | null
          coins_awarded?: number
          created_at?: string
          id?: string
          parent_review_note?: string | null
          parent_reviewed_at?: string | null
          parent_reviewed_by?: string | null
          published_at?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          title?: string
          youth_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_parent_reviewed_by_fkey"
            columns: ["parent_reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_youth_user_id_fkey"
            columns: ["youth_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          scope_id: string | null
          scope_type: Database["public"]["Enums"]["role_scope_type"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          role: Database["public"]["Enums"]["user_role"]
          scope_id?: string | null
          scope_type?: Database["public"]["Enums"]["role_scope_type"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          scope_id?: string | null
          scope_type?: Database["public"]["Enums"]["role_scope_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_scope_clubs_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          deleted_at: string | null
          email: string
          email_verified: boolean
          id: string
          last_login_at: string | null
          suspended_until: string | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string
          deleted_at?: string | null
          email: string
          email_verified?: boolean
          id?: string
          last_login_at?: string | null
          suspended_until?: string | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          deleted_at?: string | null
          email?: string
          email_verified?: boolean
          id?: string
          last_login_at?: string | null
          suspended_until?: string | null
        }
        Relationships: []
      }
      youth_badges: {
        Row: {
          awarded_at: string
          badge_slug: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_slug: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_slug?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "youth_badges_badge_slug_fkey"
            columns: ["badge_slug"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "youth_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      youth_profiles: {
        Row: {
          age_band: Database["public"]["Enums"]["age_band"]
          age_band_changes_on: string | null
          avatar_url: string | null
          bio: string | null
          coins_balance: number
          creator_level: number
          creator_score: number
          display_name: string
          guardian_linked: boolean
          id: string
          is_profile_public: boolean
          joined_at: string
          last_login_date: string | null
          participation_score: number
          platform_exit_date: string
          streak_current: number
          streak_longest: number
          thirdweb_wallet_address: string | null
          user_id: string
          username: string
        }
        Insert: {
          age_band: Database["public"]["Enums"]["age_band"]
          age_band_changes_on?: string | null
          avatar_url?: string | null
          bio?: string | null
          coins_balance?: number
          creator_level?: number
          creator_score?: number
          display_name: string
          guardian_linked?: boolean
          id?: string
          is_profile_public?: boolean
          joined_at?: string
          last_login_date?: string | null
          participation_score?: number
          platform_exit_date: string
          streak_current?: number
          streak_longest?: number
          thirdweb_wallet_address?: string | null
          user_id: string
          username: string
        }
        Update: {
          age_band?: Database["public"]["Enums"]["age_band"]
          age_band_changes_on?: string | null
          avatar_url?: string | null
          bio?: string | null
          coins_balance?: number
          creator_level?: number
          creator_score?: number
          display_name?: string
          guardian_linked?: boolean
          id?: string
          is_profile_public?: boolean
          joined_at?: string
          last_login_date?: string | null
          participation_score?: number
          platform_exit_date?: string
          streak_current?: number
          streak_longest?: number
          thirdweb_wallet_address?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "youth_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_coins: {
        Args: {
          p_amount: number
          p_reason: Database["public"]["Enums"]["kana_reason"]
          p_reference_id?: string
          p_user_id: string
        }
        Returns: number
      }
      bump_streak: { Args: { p_user_id: string }; Returns: number }
      increment_creator_score: {
        Args: { p_points: number; p_user_id: string }
        Returns: number
      }
    }
    Enums: {
      account_status:
        | "active"
        | "suspended"
        | "frozen"
        | "deleted"
        | "pending_exit"
      account_type:
        | "youth"
        | "parent"
        | "editor"
        | "moderator"
        | "admin"
        | "sponsor"
      age_band: "8-10" | "11-13" | "14-18"
      kana_reason:
        | "submission_approved"
        | "challenge_completed"
        | "weekly_mission"
        | "admin_grant"
        | "admin_deduct"
        | "spend"
      notification_type:
        | "submission_published"
        | "submission_rejected"
        | "parent_approval_needed"
        | "parent_approved"
        | "parent_rejected"
        | "coins_earned"
        | "general"
      role_scope_type: "global" | "club"
      submission_status:
        | "draft"
        | "pending_parent_approval"
        | "pending_review"
        | "published"
        | "rejected"
      user_role:
        | "contributor"
        | "author"
        | "junior_editor"
        | "editor"
        | "channel_host"
        | "club_captain"
        | "moderator"
        | "admin"
        | "sponsor"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: [
        "active",
        "suspended",
        "frozen",
        "deleted",
        "pending_exit",
      ],
      account_type: [
        "youth",
        "parent",
        "editor",
        "moderator",
        "admin",
        "sponsor",
      ],
      age_band: ["8-10", "11-13", "14-18"],
      kana_reason: [
        "submission_approved",
        "challenge_completed",
        "weekly_mission",
        "admin_grant",
        "admin_deduct",
        "spend",
      ],
      notification_type: [
        "submission_published",
        "submission_rejected",
        "parent_approval_needed",
        "parent_approved",
        "parent_rejected",
        "coins_earned",
        "general",
      ],
      role_scope_type: ["global", "club"],
      submission_status: [
        "draft",
        "pending_parent_approval",
        "pending_review",
        "published",
        "rejected",
      ],
      user_role: [
        "contributor",
        "author",
        "junior_editor",
        "editor",
        "channel_host",
        "club_captain",
        "moderator",
        "admin",
        "sponsor",
      ],
    },
  },
} as const

