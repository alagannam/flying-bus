/**
 * Supabase database types — stub file.
 *
 * Replace this entire file by running:
 *   npm run db:generate-types
 *
 * That command runs: supabase gen types typescript --local > types/database.ts
 * Do this after applying migrations and starting the local Supabase instance.
 *
 * Insert types mark columns optional when the SQL column has a DEFAULT or is
 * nullable — matching what Supabase's code generator produces.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          account_type: 'youth' | 'parent' | 'editor' | 'moderator' | 'admin' | 'sponsor'
          account_status: 'active' | 'suspended' | 'frozen' | 'deleted' | 'pending_exit'
          email_verified: boolean
          suspended_until: string | null
          created_at: string
          last_login_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string                    // DEFAULT gen_random_uuid()
          email: string
          account_type: 'youth' | 'parent' | 'editor' | 'moderator' | 'admin' | 'sponsor'
          account_status?: 'active' | 'suspended' | 'frozen' | 'deleted' | 'pending_exit' // DEFAULT 'active'
          email_verified?: boolean       // DEFAULT false
          suspended_until?: string | null
          last_login_at?: string | null
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }
      youth_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          username: string
          avatar_url: string | null
          bio: string | null
          age_band: '8-10' | '11-13' | '14-18'
          age_band_changes_on: string | null
          platform_exit_date: string
          guardian_linked: boolean
          creator_level: number
          participation_score: number
          creator_score: number
          streak_current: number
          streak_longest: number
          last_login_date: string | null
          coins_balance: number
          thirdweb_wallet_address: string | null
          is_profile_public: boolean
          joined_at: string
        }
        Insert: {
          user_id: string
          display_name: string
          username: string
          avatar_url?: string | null
          bio?: string | null
          age_band: '8-10' | '11-13' | '14-18'
          age_band_changes_on?: string | null
          platform_exit_date: string
          guardian_linked?: boolean      // DEFAULT false
          creator_level?: number         // DEFAULT 1
          participation_score?: number   // DEFAULT 0
          creator_score?: number         // DEFAULT 0
          streak_current?: number        // DEFAULT 0
          streak_longest?: number        // DEFAULT 0
          last_login_date?: string | null
          coins_balance?: number         // DEFAULT 0
          thirdweb_wallet_address?: string | null
          is_profile_public?: boolean    // DEFAULT true
        }
        Update: Partial<Database['public']['Tables']['youth_profiles']['Insert']>
        Relationships: []
      }
      parent_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          phone: string | null
          notify_on_submission: boolean
          notify_on_approval: boolean
          notify_on_moderation: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          display_name: string
          phone?: string | null
          notify_on_submission?: boolean  // DEFAULT true
          notify_on_approval?: boolean    // DEFAULT true
          notify_on_moderation?: boolean  // DEFAULT true
        }
        Update: Partial<Database['public']['Tables']['parent_profiles']['Insert']>
        Relationships: []
      }
      guardian_links: {
        Row: {
          id: string
          parent_user_id: string
          child_user_id: string
          relationship: string
          status: 'pending' | 'active' | 'revoked'
          spending_requires_approval: boolean
          publish_requires_approval: boolean
          created_at: string
          approved_at: string | null
        }
        Insert: {
          parent_user_id: string
          child_user_id: string
          relationship?: string           // DEFAULT 'parent'
          status?: 'pending' | 'active' | 'revoked'  // DEFAULT 'pending'
          spending_requires_approval?: boolean        // DEFAULT false
          publish_requires_approval?: boolean         // DEFAULT false
          approved_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['guardian_links']['Insert']>
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'contributor' | 'author' | 'junior_editor' | 'editor' | 'channel_host' | 'club_captain' | 'moderator' | 'admin' | 'sponsor'
          scope_type: 'global' | 'club'
          scope_id: string | null
          granted_by: string | null
          granted_at: string
          revoked_at: string | null
        }
        Insert: {
          user_id: string
          role: 'contributor' | 'author' | 'junior_editor' | 'editor' | 'channel_host' | 'club_captain' | 'moderator' | 'admin' | 'sponsor'
          scope_type?: 'global' | 'club'  // DEFAULT 'global'
          scope_id?: string | null
          granted_by?: string | null
          revoked_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>
        Relationships: []
      }
      pending_guardian_invites: {
        Row: {
          id: string
          parent_email: string
          child_user_id: string
          token_hash: string
          expires_at: string
          consumed_at: string | null
          created_at: string
        }
        Insert: {
          parent_email: string
          child_user_id: string
          token_hash: string
          expires_at: string
          consumed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['pending_guardian_invites']['Insert']>
        Relationships: []
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
        Update: Partial<Database['public']['Tables']['platform_config']['Insert']>
        Relationships: []
      }
      clubs: {
        Row: {
          id: string
          slug: string
          name: string
          description: string
          mission: string
          cover_image_url: string | null
          age_bands: Array<'8-10' | '11-13' | '14-18'>
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          slug: string
          name: string
          description: string
          mission: string
          cover_image_url?: string | null
          age_bands?: Array<'8-10' | '11-13' | '14-18'>  // DEFAULT ARRAY['8-10','11-13','14-18']
          sort_order?: number             // DEFAULT 0
          is_active?: boolean             // DEFAULT true
        }
        Update: Partial<Database['public']['Tables']['clubs']['Insert']>
        Relationships: []
      }
      club_memberships: {
        Row: {
          id: string
          user_id: string
          club_id: string
          joined_at: string
          is_active: boolean
        }
        Insert: {
          user_id: string
          club_id: string
          is_active?: boolean             // DEFAULT true
        }
        Update: Partial<Database['public']['Tables']['club_memberships']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      account_type: 'youth' | 'parent' | 'editor' | 'moderator' | 'admin' | 'sponsor'
      account_status: 'active' | 'suspended' | 'frozen' | 'deleted' | 'pending_exit'
      age_band: '8-10' | '11-13' | '14-18'
      user_role: 'contributor' | 'author' | 'junior_editor' | 'editor' | 'channel_host' | 'club_captain' | 'moderator' | 'admin' | 'sponsor'
      role_scope_type: 'global' | 'club'
    }
    CompositeTypes: Record<string, never>
  }
}
