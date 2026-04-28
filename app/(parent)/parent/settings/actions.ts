'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type ActionResult = { error?: string }

// Server actions must re-verify auth independently of the parent layout.
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

// ── updateGuardianPermissions ─────────────────────────────────
// Updates publish_requires_approval and spending_requires_approval
// on the guardian_links row for this parent → child pair.
//
// Only these two fields are allowed; relationship and status are
// not editable through this action.

export async function updateGuardianPermissions(
  childUserId: string,
  publishRequiresApproval: boolean,
  spendingRequiresApproval: boolean,
): Promise<ActionResult> {
  const { userId: parentUserId } = await getParentSession()
  const service = createServiceClient()

  // Verify the active link exists before attempting the update.
  const { data: rawLink } = await service
    .from('guardian_links')
    .select('id')
    .eq('parent_user_id', parentUserId)
    .eq('child_user_id', childUserId)
    .eq('status', 'active')
    .maybeSingle()

  if (!rawLink) return { error: 'No active link found for this child.' }

  const { error: updateError } = await service
    .from('guardian_links')
    .update({
      publish_requires_approval:  publishRequiresApproval,
      spending_requires_approval: spendingRequiresApproval,
    })
    .eq('parent_user_id', parentUserId)
    .eq('child_user_id', childUserId)
    .eq('status', 'active')

  if (updateError) {
    console.error('[updateGuardianPermissions] update error', updateError)
    return { error: 'Could not save settings. Please try again.' }
  }

  return {}
}
