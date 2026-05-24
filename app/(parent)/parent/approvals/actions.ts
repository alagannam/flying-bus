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

  // Audit event — best-effort observability. The submission status update
  // is the source of truth; a missed audit row is logged but does not fail
  // the action.
  try {
    const { error: auditError } = await service.from('audit_events').insert({
      event_type:    'submission_parent_approved',
      actor_user_id: userId,
      target_type:   'submission',
      target_id:     submissionId,
      payload:       {},
    })
    if (auditError) {
      console.error('[parentApprove] audit_events insert failed', { submissionId, auditError })
    }
  } catch (err) {
    console.error('[parentApprove] audit_events insert threw', { submissionId, err })
  }

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

  // Audit event — best-effort observability. The submission status update
  // is the source of truth; a missed audit row is logged but does not fail
  // the action.
  try {
    const { error: auditError } = await service.from('audit_events').insert({
      event_type:    'submission_parent_rejected',
      actor_user_id: userId,
      target_type:   'submission',
      target_id:     submissionId,
      payload:       { parent_review_note: note.trim() },
    })
    if (auditError) {
      console.error('[parentReject] audit_events insert failed', { submissionId, auditError })
    }
  } catch (err) {
    console.error('[parentReject] audit_events insert threw', { submissionId, err })
  }

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

  // Coins deducted — now grant the badge referenced by the shop item.
  // Fetch item_ref and name here (after the status lock and spend) so early
  // exits above are never charged a pointless DB call.
  const { data: itemRow } = await service
    .from('shop_items')
    .select('item_ref, name')
    .eq('id', req.shop_item_id)
    .single()

  if (itemRow?.item_ref) {
    const { error: badgeError } = await service
      .from('youth_badges')
      .upsert(
        { user_id: req.youth_user_id, badge_slug: itemRow.item_ref },
        { onConflict: 'user_id,badge_slug', ignoreDuplicates: true },
      )

    if (badgeError) {
      // Coins are already deducted and request is marked approved.
      // Do not refund or surface to parent — log for manual reconciliation.
      console.error('[approveSpend] badge grant failed after coins deducted', {
        requestId,
        shopItemId: req.shop_item_id,
        badgeSlug:  itemRow.item_ref,
        badgeError,
      })
    }
  }

  // Notify youth — best-effort, does not affect the ActionResult.
  await service.from('notifications').insert({
    user_id:      req.youth_user_id,
    type:         'parent_approved',
    title:        'Your parent approved your purchase',
    body:         `"${itemRow?.name ?? 'Your item'}" is now in your profile. ${req.coins_amount.toLocaleString()} Kana Coins were deducted.`,
    reference_id: req.id,
  })

  // Audit event — best-effort observability. The spend request status,
  // coin deduction, and badge grant are the source of truth; a missed
  // audit row is logged but does not fail the action.
  try {
    const { error: auditError } = await service.from('audit_events').insert({
      event_type:    'spend_approved',
      actor_user_id: parentUserId,
      target_type:   'coin_spend_request',
      target_id:     requestId,
      payload:       { coins_amount: req.coins_amount, shop_item_id: req.shop_item_id ?? null },
    })
    if (auditError) {
      console.error('[approveSpend] audit_events insert failed', { requestId, auditError })
    }
  } catch (err) {
    console.error('[approveSpend] audit_events insert threw', { requestId, err })
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
    .select('id, parent_user_id, youth_user_id, shop_item_id, status, coins_amount')
    .eq('id', requestId)
    .single()

  const req = rawRequest as {
    id: string
    parent_user_id: string
    youth_user_id: string
    shop_item_id: string
    status: string
    coins_amount: number
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

  // Notify youth — fetch item name for the body, best-effort.
  const { data: itemRow } = await service
    .from('shop_items')
    .select('name')
    .eq('id', req.shop_item_id)
    .maybeSingle()

  await service.from('notifications').insert({
    user_id:      req.youth_user_id,
    type:         'parent_rejected',
    title:        'Your parent declined a purchase request',
    body:         `Your request for "${itemRow?.name ?? 'an item'}" was not approved.`,
    reference_id: req.id,
  })

  // Audit event — best-effort observability. The spend request status
  // is the source of truth; a missed audit row is logged but does not
  // fail the action.
  try {
    const { error: auditError } = await service.from('audit_events').insert({
      event_type:    'spend_rejected',
      actor_user_id: parentUserId,
      target_type:   'coin_spend_request',
      target_id:     requestId,
      payload:       { coins_amount: req.coins_amount },
    })
    if (auditError) {
      console.error('[rejectSpend] audit_events insert failed', { requestId, auditError })
    }
  } catch (err) {
    console.error('[rejectSpend] audit_events insert threw', { requestId, err })
  }

  return {}
}
