'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type ActionResult = { error?: string }

// ── updateProfile ─────────────────────────────────────────────
// Strict allowlist: only display_name and bio are read from
// FormData. Every other field in the form payload is silently
// ignored — it never reaches the .update() call.
//
// username, age_band, creator_score, coins_balance,
// is_profile_public and all other profile columns are NOT
// included in the update object and are therefore never touched,
// regardless of what the client sends.

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  // Allowlist extraction — hard-coded keys only
  const displayName = String(formData.get('display_name') ?? '').trim()
  const bioRaw      = String(formData.get('bio')          ?? '').trim()
  const bio         = bioRaw.length > 0 ? bioRaw : null

  // Validate before hitting the database
  if (displayName.length < 2 || displayName.length > 40) {
    return { error: 'Display name must be between 2 and 40 characters.' }
  }
  if (bio !== null && bio.length > 200) {
    return { error: 'Bio must be 200 characters or fewer.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify profile exists before writing — defends against edge cases
  // where auth.getUser() succeeds but no youth_profile row exists.
  const { data: rawProfile } = await supabase
    .from('youth_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!rawProfile) redirect('/login')

  // Explicit update object — no dynamic spreading, no variable keys.
  // Only these two columns are written.
  const { error: updateError } = await createServiceClient()
    .from('youth_profiles')
    .update({ display_name: displayName, bio })
    .eq('user_id', user.id)

  if (updateError) return { error: 'Could not save your changes. Please try again.' }

  redirect('/profile')
}
