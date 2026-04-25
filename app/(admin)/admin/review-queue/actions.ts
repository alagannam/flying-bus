'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hasAdminAccess } from '@/lib/utils/permissions'
import type { AccountType } from '@/types/app'

type ActionResult = { error?: string }

// ── Auth helper ───────────────────────────────────────────────
// Server actions are called directly from client components and
// must verify auth independently — they cannot rely on the layout.

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

// ── approveSubmission ─────────────────────────────────────────
// 1. Verify the submission is still pending_review.
// 2. Read the coin amount from platform_config (default 10).
// 3. Publish the submission with an optimistic-lock update.
// 4. Award coins via the atomic award_coins RPC.
// 5. Notify the youth.

export async function approveSubmission(
  id: string,
  note: string | null,
): Promise<ActionResult> {
  const { userId } = await getStaffSession()
  const service = createServiceClient()

  // Fetch submission — need youth_user_id and title for coin award + notification
  const { data: rawSub } = await service
    .from('submissions')
    .select('id, youth_user_id, title, status')
    .eq('id', id)
    .single()

  const sub = rawSub as {
    id: string
    youth_user_id: string
    title: string
    status: string
  } | null

  if (!sub) return { error: 'Submission not found.' }
  if (sub.status !== 'pending_review') {
    return { error: 'This submission is no longer in the review queue.' }
  }

  // Read coin amount from platform_config
  const { data: rawConfig } = await service
    .from('platform_config')
    .select('value')
    .eq('key', 'coin_earn_text_submission')
    .maybeSingle()

  const parsed = parseInt((rawConfig as { value?: string } | null)?.value ?? '', 10)
  const coinAmount = Number.isFinite(parsed) && parsed >= 0 ? parsed : 10

  // Publish — optimistic lock: .eq('status', 'pending_review') means the
  // update silently affects 0 rows if another editor already acted on it.
  const now = new Date().toISOString()
  const { data: updated, error: updateError } = await service
    .from('submissions')
    .update({
      status: 'published',
      reviewed_by: userId,
      reviewed_at: now,
      review_note: note?.trim() || null,
      published_at: now,
      coins_awarded: coinAmount,
    })
    .eq('id', id)
    .eq('status', 'pending_review')
    .select('id')

  if (updateError) return { error: 'Could not publish the submission. Please try again.' }
  if (!updated || updated.length === 0) {
    return { error: 'This submission was already reviewed by someone else.' }
  }

  // Award coins — atomic: updates youth_profiles.coins_balance and inserts kana_ledger row.
  // If this fails the submission is already published; log and continue so we don't
  // block the editor. Coins can be corrected manually via the admin coins screen.
  const { error: coinsError } = await service.rpc('award_coins', {
    p_user_id: sub.youth_user_id,
    p_amount: coinAmount,
    p_reason: 'submission_approved',
    p_reference_id: id,
  })

  if (coinsError) {
    console.error('[approveSubmission] award_coins failed', { id, coinsError })
  }

  // Notify youth
  await service.from('notifications').insert({
    user_id: sub.youth_user_id,
    type: 'submission_published' as const,
    title: 'Your submission was published!',
    body: `"${sub.title}" is now live. You earned ${coinAmount} Kana Coins.`,
    reference_id: id,
  })

  redirect('/admin/review-queue')
}

// ── rejectSubmission ──────────────────────────────────────────
// 1. Require a non-empty review note.
// 2. Verify the submission is still pending_review.
// 3. Reject with the optimistic-lock update.
// 4. Notify the youth with the note as the message body.

export async function rejectSubmission(
  id: string,
  note: string,
): Promise<ActionResult> {
  if (!note.trim()) {
    return { error: 'A feedback note is required when not approving a submission.' }
  }

  const { userId } = await getStaffSession()
  const service = createServiceClient()

  const { data: rawSub } = await service
    .from('submissions')
    .select('id, youth_user_id, title, status')
    .eq('id', id)
    .single()

  const sub = rawSub as {
    id: string
    youth_user_id: string
    title: string
    status: string
  } | null

  if (!sub) return { error: 'Submission not found.' }
  if (sub.status !== 'pending_review') {
    return { error: 'This submission is no longer in the review queue.' }
  }

  const { data: updated, error: updateError } = await service
    .from('submissions')
    .update({
      status: 'rejected',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_note: note.trim(),
    })
    .eq('id', id)
    .eq('status', 'pending_review')
    .select('id')

  if (updateError) return { error: 'Could not save the decision. Please try again.' }
  if (!updated || updated.length === 0) {
    return { error: 'This submission was already reviewed by someone else.' }
  }

  // Notify youth — note becomes the notification body so they see the feedback
  await service.from('notifications').insert({
    user_id: sub.youth_user_id,
    type: 'submission_rejected' as const,
    title: 'Your submission wasn\'t approved this time',
    body: note.trim(),
    reference_id: id,
  })

  redirect('/admin/review-queue')
}
