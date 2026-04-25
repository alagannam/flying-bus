import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Server-side Supabase client using the anon key.
 * RLS applies. Use in Server Components and Server Actions for user-scoped reads.
 */
export async function createClient() {
  const cookieStore = await cookies()

  // @supabase/ssr@0.5.x has a type-level bug: createServerClient returns
  // SupabaseClient<Database, SchemaName, Schema> where Schema (an object type)
  // lands in SupabaseClient's SchemaName (string) parameter position, causing
  // SupabaseClient.Schema to default to `never` and collapsing all update/insert
  // payloads to `never`. Cast to SupabaseClient<Database> (1 arg) so TypeScript
  // resolves SchemaName → 'public' and Schema → Database['public'] via defaults.
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies cannot be set here.
            // The middleware handles session refresh before this runs.
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>
}

/**
 * Service-role Supabase client — RLS is BYPASSED.
 *
 * Uses the base supabase-js client (not the SSR client) because service-role
 * auth is key-based, not session-based. No cookie handling needed.
 *
 * Use only in Server Actions for writes that must bypass RLS:
 *   - kana_ledger inserts
 *   - audit_log inserts
 *   - submission status transitions
 *   - score_event inserts
 *   - guardian_links creation
 *   - auth.admin.* operations
 *
 * NEVER pass this client or its output to client-side code.
 * NEVER use NEXT_PUBLIC_ prefix for SUPABASE_SERVICE_ROLE_KEY.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
