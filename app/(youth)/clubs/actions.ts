'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type ActionResult = { error?: string }

// ── joinClub ──────────────────────────────────────────────────
// Inserts a club_memberships row for the current user. Uses
// service-role with onConflict: ignoreDuplicates so clicking
// Join twice is a silent no-op rather than a unique-constraint
// error. The UNIQUE (user_id, club_id) constraint is the
// authoritative dedup.

export async function joinClub(clubId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  // Look up the club slug for path revalidation. Anon client + the
  // clubs_select_active policy returns null for inactive/missing ids,
  // which is fine — we still want to attempt the join (service-role
  // will succeed or fail authoritatively on the FK).
  const { data: clubRow } = await supabase
    .from('clubs')
    .select('slug')
    .eq('id', clubId)
    .maybeSingle()

  const service = createServiceClient()
  const { error: insertError } = await service
    .from('club_memberships')
    .upsert(
      { user_id: user.id, club_id: clubId, is_active: true },
      { onConflict: 'user_id,club_id', ignoreDuplicates: true },
    )

  if (insertError) {
    console.error('[joinClub] insert error', { clubId, insertError })
    return { error: 'Could not join club' }
  }

  revalidatePath('/my-clubs')
  if (clubRow?.slug) revalidatePath(`/clubs/${clubRow.slug}`)

  return {}
}
