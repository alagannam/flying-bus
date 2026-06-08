'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hasAdminAccess } from '@/lib/utils/permissions'
import type { AccountType } from '@/types/app'

type ActionResult = { error?: string; ok?: boolean }

// Server actions re-verify auth independently of the admin layout — the
// layout guard does not protect server-action invocations.
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

/**
 * Set raised_cents for an impact campaign.
 *
 * Dollars in, cents out. No coin / token / ledger writes — this is a pure
 * USD admin entry. The impact bar is the single visible surface for this
 * field; updating it triggers revalidation of the public /impact page and
 * the youth /dashboard so the new figure shows up immediately.
 */
export async function setRaisedAmount(form: FormData): Promise<ActionResult> {
  const { userId: staffUserId, accountType } = await getStaffSession()

  // Editors do not manage finance figures — admins only.
  if (accountType !== 'admin') {
    return { error: 'Only admins can update raised amounts.' }
  }

  const campaignId = String(form.get('campaign_id') ?? '').trim()
  const dollarsRaw = String(form.get('raised_dollars') ?? '').trim()

  if (!campaignId)  return { error: 'Missing campaign.' }
  if (!dollarsRaw)  return { error: 'Enter a dollar amount.' }

  const dollars = Number(dollarsRaw)
  if (!Number.isFinite(dollars) || dollars < 0) {
    return { error: 'Enter a non-negative dollar amount.' }
  }

  const cents = Math.round(dollars * 100)

  const service = createServiceClient()

  // Read prior raised_cents for the audit payload (best-effort).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prior } = await (service as any)
    .from('impact_campaigns')
    .select('raised_cents')
    .eq('id', campaignId)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (service as any)
    .from('impact_campaigns')
    .update({ raised_cents: cents })
    .eq('id', campaignId)

  if (updateError) {
    console.error('[setRaisedAmount] update failed', { updateError, campaignId, cents })
    return { error: 'Could not update the campaign. Please try again.' }
  }

  // Audit event — best-effort observability. The impact_campaigns row is the
  // source of truth; a missed audit row is logged but does not fail the action.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: auditError } = await (service as any).from('audit_events').insert({
      event_type:    'impact_raised_updated',
      actor_user_id: staffUserId,
      target_type:   'impact_campaign',
      target_id:     campaignId,
      payload: {
        prior_raised_cents: prior?.raised_cents ?? null,
        new_raised_cents:   cents,
      },
    })
    if (auditError) {
      console.error('[setRaisedAmount] audit insert failed', { auditError, campaignId })
    }
  } catch (e) {
    console.error('[setRaisedAmount] audit threw', e)
  }

  revalidatePath('/admin/impact')
  revalidatePath('/impact')
  revalidatePath('/dashboard')

  return { ok: true }
}
