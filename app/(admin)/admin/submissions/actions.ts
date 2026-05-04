'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hasAdminAccess } from '@/lib/utils/permissions'
import { checkAndAwardBadges } from '@/lib/badges'
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
// 5. Increment creator score and flip profile public if needed.
// 6. Check and award badges for publish-relevant criteria.
// 7. Notify the youth.
//
// Steps 4–6 are best-effort: errors are logged and do not block
// the publish or the editor redirect. The submission is already
// live at the point those steps run.

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

  // Award coins — atomic RPC; updates coins_balance and appends a ledger row.
  // Best-effort: submission is already live, so log and continue on failure.
  // Coins can be corrected manually via the admin coins screen.
  const { error: coinsError } = await service.rpc('award_coins', {
    p_user_id: sub.youth_user_id,
    p_amount: coinAmount,
    p_reason: 'submission_approved',
    p_reference_id: id,
  })
  if (coinsError) {
    console.error('[approveSubmission] award_coins failed', { id, coinsError })
  }

  // Increment creator score — same point value as coins for V1.
  // Atomically updates creator_score and recalculates creator_level.
  const { error: scoreError } = await service.rpc('increment_creator_score', {
    p_user_id: sub.youth_user_id,
    p_points: coinAmount,
  })
  if (scoreError) {
    console.error('[approveSubmission] increment_creator_score failed', { id, scoreError })
  }

  // Make profile public if this is the creator's first published submission.
  // Conditional: .eq('is_profile_public', false) is a no-op if already true,
  // so repeated publishes never cause unnecessary writes.
  await service
    .from('youth_profiles')
    .update({ is_profile_public: true })
    .eq('user_id', sub.youth_user_id)
    .eq('is_profile_public', false)

  // Check and award badges. Runs after score and coin updates so profile
  // stats are fresh. Idempotent — duplicates are silently ignored by DB.
  await checkAndAwardBadges(
    sub.youth_user_id,
    service,
    ['submissions_published', 'creator_score', 'coins_balance'],
  ).catch(err => {
    console.error('[approveSubmission] checkAndAwardBadges failed', { id, err })
  })

  // Notify youth
  await service.from('notifications').insert({
    user_id: sub.youth_user_id,
    type: 'submission_published' as const,
    title: 'Your submission was published!',
    body: `"${sub.title}" is now live. You earned ${coinAmount} Kana Coins.`,
    reference_id: id,
  })

  redirect('/admin/submissions')
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

  redirect('/admin/submissions')
}
