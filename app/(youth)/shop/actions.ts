'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

export type PurchaseResult =
  | { status: 'purchased'; newBalance: number; badgeName?: string }
  | { status: 'pending_approval' }
  | { status: 'already_owned' }
  | { status: 'insufficient_coins' }
  | { status: 'item_unavailable' }
  | { status: 'error'; message: string }

export async function initiatePurchase(itemId: string): Promise<PurchaseResult> {
  const supabase = await createClient()
  const service  = createServiceClient()

  // 1. Auth — must be a logged-in youth account.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: 'Not authenticated.' }

  const { data: userRow } = await supabase
    .from('users')
    .select('account_type')
    .eq('id', user.id)
    .single()

  if (!userRow || userRow.account_type !== 'youth') {
    return { status: 'error', message: 'Youth account required.' }
  }

  // 2. Fetch item + balance in parallel — both are needed before we can proceed.
  const [itemResult, profileResult] = await Promise.all([
    service
      .from('shop_items')
      .select('id, name, price_coins, item_ref')
      .eq('id', itemId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('youth_profiles')
      .select('coins_balance')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!itemResult.data) return { status: 'item_unavailable' }

  const item    = itemResult.data
  const balance = profileResult.data?.coins_balance ?? 0

  // 3. Ownership check — if the youth already owns the badge this item grants,
  //    skip the entire purchase flow (no coins moved, no approval request).
  const { data: existingBadge } = await service
    .from('youth_badges')
    .select('badge_slug')
    .eq('user_id', user.id)
    .eq('badge_slug', item.item_ref)
    .maybeSingle()

  if (existingBadge) return { status: 'already_owned' }

  // 4. Pre-flight balance check (spend_coins is the atomic gate, but failing
  //    here saves a round-trip and gives a clearer error message).
  if (balance < item.price_coins) return { status: 'insufficient_coins' }

  // 5. Guardian approval check — use service client so RLS on guardian_links
  //    doesn't interfere. If ANY active guardian requires spending approval,
  //    route to the approval flow (most-restrictive policy).
  const { data: approvalLink } = await service
    .from('guardian_links')
    .select('id, parent_user_id')
    .eq('child_user_id', user.id)
    .eq('status', 'active')
    .eq('spending_requires_approval', true)
    .limit(1)
    .maybeSingle()

  if (approvalLink) {
    // Create a pending spend request; coins are NOT deducted yet.
    const { data: spendRequest, error: insertError } = await service
      .from('coin_spend_requests')
      .insert({
        youth_user_id:    user.id,
        parent_user_id:   approvalLink.parent_user_id,
        guardian_link_id: approvalLink.id,
        shop_item_id:     item.id,
        coins_amount:     item.price_coins,
        status:           'pending',
      })
      .select('id')
      .single()

    if (insertError || !spendRequest) {
      return { status: 'error', message: 'Could not submit approval request. Please try again.' }
    }

    // Notify the parent — best-effort, does not block the pending_approval response.
    await service.from('notifications').insert({
      user_id:      approvalLink.parent_user_id,
      type:         'parent_approval_needed',
      title:        'Approval needed for a coin purchase',
      body:         `Your child wants to spend ${item.price_coins} Kana Coins on "${item.name}". Visit Approvals to review.`,
      reference_id: spendRequest.id,
    })

    // Audit event — best-effort observability. The coin_spend_requests row
    // is the source of truth; a missed audit row is logged but does not
    // fail the action. Pairs with spend_approved / spend_rejected by target_id.
    try {
      const { error: auditError } = await service.from('audit_events').insert({
        event_type:    'spend_requested',
        actor_user_id: user.id,
        target_type:   'coin_spend_request',
        target_id:     spendRequest.id,
        payload:       {
          coins_amount: item.price_coins,
          shop_item_id: item.id,
        },
      })
      if (auditError) {
        console.error('[initiatePurchase] audit_events insert failed', { spendRequestId: spendRequest.id, auditError })
      }
    } catch (err) {
      console.error('[initiatePurchase] audit_events insert threw', { spendRequestId: spendRequest.id, err })
    }

    return { status: 'pending_approval' }
  }

  // 6. No approval required — deduct coins atomically.
  // spend_coins raises P0001 'insufficient_balance' if the balance has dropped
  // since our pre-flight check (race condition guard).
  const { data: newBalance, error: spendError } = await service
    .rpc('spend_coins', {
      p_user_id:      user.id,
      p_amount:       item.price_coins,
      p_reason:       'shop_purchase',
      p_reference_id: item.id,
    })

  if (spendError) {
    if (spendError.code === 'P0001' || spendError.message?.includes('insufficient_balance')) {
      return { status: 'insufficient_coins' }
    }
    return { status: 'error', message: 'Purchase failed. Please try again.' }
  }

  // 7. Grant the badge referenced by item_ref. Upsert with ignoreDuplicates
  //    so re-purchasing an already-owned badge succeeds silently instead of
  //    throwing a unique-constraint error.
  const { error: badgeError } = await service
    .from('youth_badges')
    .upsert(
      { user_id: user.id, badge_slug: item.item_ref },
      { onConflict: 'user_id,badge_slug', ignoreDuplicates: true },
    )

  if (badgeError) {
    // Coins were legitimately deducted — do not refund. Log for reconciliation.
    console.error('[initiatePurchase] badge grant failed after coins deducted', {
      userId:    user.id,
      itemId:    item.id,
      badgeSlug: item.item_ref,
      badgeError,
    })
  }

  return { status: 'purchased', newBalance: newBalance as number, badgeName: item.name }
}
