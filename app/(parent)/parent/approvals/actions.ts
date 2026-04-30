'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type ActionResult = { error?: string }

// Server actions are called directly from client components and must verify
// auth independently — they cannot rely on the parent layout.

async function getParentSession(): Promise<{ userId: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawUser } = await supabase
    .from('users')
    .select('account_type')
    .eq('id', user.id)
    .single()

  const userData = rawUser as { account_type: string } | null
  if (!userData || userData.account_type !== 'parent') redirect('/login')

  return { userId: user.id }
}

// Verify the parent has an active guardian_link to the child.
// Uses service client — called inside actions that already have service context.
async function hasActiveLink(
  service: ReturnType<typeof createServiceClient>,
  parentUserId: string,
  childUserId: string,
): Promise<boolean> {
  const { data } = await service
    .from('guardian_links')
    .select('id')
    .eq('parent_user_id', parentUserId)
    .eq('child_user_id', childUserId)
    .eq('status', 'active')
    .maybeSingle()
  return !!data
}

// ── parentApprove ─────────────────────────────────────────────
// Moves a pending_parent_approval submission to pending_review and
// notifies the youth that their parent approved it.

export async function parentApprove(submissionId: string): Promise<ActionResult> {
  const { userId } = await getParentSession()
  const service = createServiceClient()

  const { data: rawSub } = await service
    .from('submissions')
    .select('id, youth_user_id, title, status')
    .eq('id', submissionId)
    .single()

  const sub = rawSub as {
    id: string
    youth_user_id: string
    title: string
    status: string
  } | null

  if (!sub) return { error: 'Submission not found.' }
  if (sub.status !== 'pending_parent_approval') {
    return { error: 'This submission is no longer waiting for your approval.' }
  }

  const linked = await hasActiveLink(service, userId, sub.youth_user_id)
  if (!linked) return { error: 'You are not linked to this account.' }

  const { data: updated, error: updateError } = await service
    .from('submissions')
    .update({
      status: 'pending_review',
      parent_reviewed_by: userId,
      parent_reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .eq('status', 'pending_parent_approval')  // optimistic lock
    .select('id')

  if (updateError) return { error: 'Could not approve. Please try again.' }
  if (!updated || updated.length === 0) {
    return { error: 'This submission was already actioned.' }
  }

  await service.from('notifications').insert({
    user_id: sub.youth_user_id,
    type: 'parent_approved' as const,
    title: 'Your parent approved your submission',
    body: `"${sub.title}" has been sent to the editors for review.`,
    reference_id: submissionId,
  })

  redirect('/parent/approvals')
}

// ── parentReject ──────────────────────────────────────────────

// Sets the submission to rejected (not pending_review) and sends
// the parent's note to the youth as feedback.

export async function parentReject(
  submissionId: string,
  note: string,
): Promise<ActionResult> {
  if (!note.trim()) {
    return { error: 'A note is required when declining a submission.' }
  }

  const { userId } = await getParentSession()
  const service = createServiceClient()

  const { data: rawSub } = await service
    .from('submissions')
    .select('id, youth_user_id, title, status')
    .eq('id', submissionId)
    .single()

  const sub = rawSub as {
    id: string
    youth_user_id: string
    title: string
    status: string
  } | null

  if (!sub) return { error: 'Submission not found.' }
  if (sub.status !== 'pending_parent_approval') {
    return { error: 'This submission is no longer waiting for your approval.' }
  }

  const linked = await hasActiveLink(service, userId, sub.youth_user_id)
  if (!linked) return { error: 'You are not linked to this account.' }

  const { data: updated, error: updateError } = await service
    .from('submissions')
    .update({
      status: 'rejected',
      parent_reviewed_by: userId,
      parent_reviewed_at: new Date().toISOString(),
      parent_review_note: note.trim(),
    })
    .eq('id', submissionId)
    .eq('status', 'pending_parent_approval')  // optimistic lock
    .select('id')

  if (updateError) return { error: 'Could not save your decision. Please try again.' }
  if (!updated || updated.length === 0) {
    return { error: 'This submission was already actioned.' }
  }

  await service.from('notifications').insert({
    user_id: sub.youth_user_id,
    type: 'parent_rejected' as const,
    title: 'Your parent reviewed your submission',
    body: note.trim(),
    reference_id: submissionId,
  })

  redirect('/parent/approvals')
}

// ── approveSpend ──────────────────────────────────────────────
// Approves a pending coin_spend_request and deducts coins from
// the youth. The status update uses an optimistic lock on
// status='pending' — whichever concurrent call wins that UPDATE
// is the only one that proceeds to spend_coins. Any call that
// finds 0 rows updated knows it lost the race and must not deduct.

export async function approveSpend(requestId: string): Promise<ActionResult> {
  const { userId: parentUserId } = await getParentSession()
  const service = createServiceClient()

  const { data: rawRequest } = await service
    .from('coin_spend_requests')
    .select('id, youth_user_id, shop_item_id, coins_amount, status, parent_user_id')
    .eq('id', requestId)
    .single()

  const req = rawRequest as {
    id: string
    youth_user_id: string
    shop_item_id: string
    coins_amount: number
    status: string
    parent_user_id: string
  } | null

  if (!req) return { error: 'Request not found.' }
  if (req.parent_user_id !== parentUserId) return { error: 'Not authorized.' }
  if (req.status !== 'pending') return { error: 'This request has already been actioned.' }

  // Claim the 'pending' slot atomically. If another session already approved
  // or rejected, updated.length will be 0 and we stop before touching coins.
  const { data: updated, error: updateError } = await service
    .from('coin_spend_requests')
    .update({
      status:      'approved',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'pending')   // optimistic lock — double-deduction guard
    .select('id')

  if (updateError) return { error: 'Could not process approval. Please try again.' }
  if (!updated || updated.length === 0) {
    return { error: 'This request was already actioned by another session.' }
  }

  // Status is now 'approved'. Deduct coins atomically via spend_coins, which
  // enforces balance >= amount at the DB level (raises P0001 if not).
  const { error: spendError } = await service.rpc('spend_coins', {
    p_user_id:      req.youth_user_id,
    p_amount:       req.coins_amount,
    p_reason:       'shop_purchase',
    p_reference_id: req.shop_item_id,
  })

  if (spendError) {
    // Status is already 'approved' — spend_coins failed. Most likely the
    // youth's balance dropped because a different request was approved first.
    // Log for manual reconciliation; surface the error to the parent.
    console.error('[approveSpend] spend_coins failed after status claim', { requestId, spendError })
    if (spendError.code === 'P0001' || spendError.message?.includes('insufficient_balance')) {
      return { error: 'The youth no longer has enough coins — another request may have been approved first.' }
    }
    return { error: 'Coins could not be deducted. Please contact support.' }
  }

  return {}
}

// ── rejectSpend ───────────────────────────────────────────────
// Rejects a pending coin_spend_request. No coins are moved.
// Uses the same optimistic lock pattern as approveSpend.

export async function rejectSpend(requestId: string): Promise<ActionResult> {
  const { userId: parentUserId } = await getParentSession()
  const service = createServiceClient()

  const { data: rawRequest } = await service
    .from('coin_spend_requests')
    .select('id, parent_user_id, status')
    .eq('id', requestId)
    .single()

  const req = rawRequest as {
    id: string
    parent_user_id: string
    status: string
  } | null

  if (!req) return { error: 'Request not found.' }
  if (req.parent_user_id !== parentUserId) return { error: 'Not authorized.' }
  if (req.status !== 'pending') return { error: 'This request has already been actioned.' }

  const { data: updated, error: updateError } = await service
    .from('coin_spend_requests')
    .update({
      status:      'rejected',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'pending')   // optimistic lock
    .select('id')

  if (updateError) return { error: 'Could not save your decision. Please try again.' }
  if (!updated || updated.length === 0) {
    return { error: 'This request was already actioned by another session.' }
  }

  return {}
}
