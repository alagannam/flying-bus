'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hasAdminAccess } from '@/lib/utils/permissions'
import type { AccountType } from '@/types/app'

type ActionResult = { error?: string }

// Server actions are invoked directly from client components and must
// re-verify auth independently — they cannot rely on the admin layout.
async function getStaffSession(): Promise<{ userId: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawUser } = await supabase
    .from('users')
    .select('account_type')
    .eq('id', user.id)
    .single()

  const userData = rawUser as { account_type: AccountType } | null
  if (!userData || !hasAdminAccess(userData.account_type)) redirect('/dashboard')

  return { userId: user.id }
}

// ── reviewFlag ────────────────────────────────────────────────
// Records a moderator decision on an open content report.
// Does not automatically suspend the reported user — that is a
// separate manual step via admin user management (Batch 4).

export async function reviewFlag(
  reportId: string,
  decision: string,
  moderatorNote: string,
): Promise<ActionResult> {
  if (decision !== 'dismissed' && decision !== 'actioned') {
    return { error: 'Invalid decision.' }
  }

  const { userId } = await getStaffSession()
  const service = createServiceClient()

  // Verify the report exists and is still open.
  const { data: rawReport } = await service
    .from('content_reports')
    .select('id, status')
    .eq('id', reportId)
    .maybeSingle()

  if (!rawReport) return { error: 'Report not found.' }

  const report = rawReport as { id: string; status: string }

  if (report.status !== 'open') {
    return { error: 'This report has already been reviewed.' }
  }

  // Optimistic lock on status = 'open' prevents a double-review race.
  const { error: updateError } = await service
    .from('content_reports')
    .update({
      status:         decision,
      reviewed_by:    userId,
      reviewed_at:    new Date().toISOString(),
      moderator_note: moderatorNote.trim() || null,
    })
    .eq('id', reportId)
    .eq('status', 'open')

  if (updateError) {
    console.error('[reviewFlag] update error', updateError)
    return { error: 'Could not save your decision. Please try again.' }
  }

  redirect('/admin/flags')
}
