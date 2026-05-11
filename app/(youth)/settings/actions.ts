'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type ActionResult = { error?: string }

// ── updatePrivacy ──────────────────────────────────────────────
// Strict single-column update: only is_profile_public is written.
// The own-row guard is the .eq('user_id', user.id) on the service
// write — auth.getUser() establishes identity, the eq clause ensures
// no other user's row can be touched regardless of what the client sends.

export async function updatePrivacy(formData: FormData): Promise<ActionResult> {
  const isPublicRaw = String(formData.get('is_profile_public') ?? 'false')
  const isPublic    = isPublicRaw === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Confirm a youth_profiles row exists for this user.
  // The anon client + own-row RLS policy is sufficient here — if the
  // row doesn't exist (or belongs to a different user) this returns null.
  const { data: rawProfile } = await supabase
    .from('youth_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!rawProfile) redirect('/login')

  // Hard-coded single-column update. No dynamic key spreading.
  // is_profile_public is the only column in this update object.
  const { error: updateError } = await createServiceClient()
    .from('youth_profiles')
    .update({ is_profile_public: isPublic })
    .eq('user_id', user.id)

  if (updateError) return { error: 'Could not save your settings. Please try again.' }

  return {}
}
