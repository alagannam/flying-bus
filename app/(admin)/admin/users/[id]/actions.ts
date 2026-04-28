'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hasAdminAccess } from '@/lib/utils/permissions'
import type { AccountType } from '@/types/app'

type ActionResult = { error?: string }

// Server actions must re-verify auth independently of the admin layout.
async function getStaffSession(): Promise<{ userId: string; accountType: AccountType }> {
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

  return { userId: user.id, accountType: userData.account_type }
}

// ── setAccountStatus ──────────────────────────────────────────
// Updates public.users.account_status and the Supabase Auth ban
// state so both stay aligned.
//
// V1 supports only 'active' (restore) and 'suspended' (ban).
// Other statuses (frozen, deleted, pending_exit) are not manageable
// via this action.
//
// Auth ban is applied AFTER the DB update. If the Auth call fails
// after the DB succeeds, a specific error is surfaced so the admin
// can retry or escalate — the DB record is the authoritative state.

export async function setAccountStatus(
  targetUserId: string,
  newStatus: 'active' | 'suspended',
): Promise<ActionResult> {
  if (newStatus !== 'active' && newStatus !== 'suspended') {
    return { error: 'Invalid status.' }
  }

  const { userId: staffUserId, accountType } = await getStaffSession()

  // Only moderators and admins can manage user accounts — not editors.
  if (accountType !== 'moderator' && accountType !== 'admin') {
    return { error: 'You do not have permission to manage user accounts.' }
  }

  // Prevent self-action.
  if (targetUserId === staffUserId) {
    return { error: 'You cannot change the status of your own account.' }
  }

  const service = createServiceClient()

  // Verify the target user exists and get current status.
  const { data: rawTarget } = await service
    .from('users')
    .select('id, account_status')
    .eq('id', targetUserId)
    .maybeSingle()

  if (!rawTarget) return { error: 'User not found.' }

  const target = rawTarget as { id: string; account_status: string }

  // Already in the requested state — treat as success.
  if (target.account_status === newStatus) {
    redirect(`/admin/users/${targetUserId}`)
  }

  // ── Step 1: Update DB ─────────────────────────────────────────
  const { error: dbError } = await service
    .from('users')
    .update({ account_status: newStatus })
    .eq('id', targetUserId)

  if (dbError) {
    console.error('[setAccountStatus] db update error', dbError)
    return { error: 'Could not update account status. Please try again.' }
  }

  // ── Step 2: Sync Supabase Auth ban state ──────────────────────
  // '876000h' ≈ 100 years — effectively permanent for a suspension.
  // 'none' removes the ban entirely.
  const banDuration = newStatus === 'suspended' ? '876000h' : 'none'

  const { error: authAdminError } = await service.auth.admin.updateUserById(
    targetUserId,
    { ban_duration: banDuration },
  )

  if (authAdminError) {
    console.error('[setAccountStatus] auth admin error', authAdminError)
    // DB succeeded but Auth ban failed. Surface clearly — admin must retry
    // or handle manually. DB record is considered authoritative.
    const direction = newStatus === 'suspended' ? 'applied' : 'removed'
    return {
      error: `Account status was saved, but the authentication ${
        newStatus === 'suspended' ? 'restriction' : 'restriction removal'
      } could not be ${direction}. Please reload and try again, or contact your Supabase administrator if the problem persists.`,
    }
  }

  redirect(`/admin/users/${targetUserId}`)
}
