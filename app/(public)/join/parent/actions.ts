'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  defaultPublishRequiresApproval,
  defaultSpendingRequiresApproval,
} from '@/lib/utils/permissions'
import { createHash } from 'crypto'
import type { AgeBand } from '@/types/app'

export async function signUpParent(form: FormData): Promise<{ error?: string }> {
  const displayName = String(form.get('display_name') ?? '').trim()
  const email       = String(form.get('email') ?? '').trim().toLowerCase()
  const password    = String(form.get('password') ?? '')
  const token       = String(form.get('token') ?? '').trim()

  if (!displayName || !email || !password) {
    return { error: 'All fields are required.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const supabase = createServiceClient()

  // Validate token if provided
  let childUserId: string | null = null
  let childAgeBand: AgeBand | null = null

  if (token) {
    const tokenHash = createHash('sha256').update(token).digest('hex')

    const { data: invite } = await supabase
      .from('pending_guardian_invites')
      .select('id, child_user_id, expires_at, consumed_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (!invite) return { error: 'This invite link is invalid or has expired.' }
    if (invite.consumed_at) return { error: 'This invite link has already been used.' }
    if (new Date(invite.expires_at) < new Date()) {
      return { error: 'This invite link has expired. Ask your child to resend it.' }
    }

    childUserId = invite.child_user_id

    // Get child's age band to set correct permission defaults
    const { data: childProfile } = await supabase
      .from('youth_profiles')
      .select('age_band')
      .eq('user_id', childUserId)
      .single()

    childAgeBand = (childProfile?.age_band ?? null) as AgeBand | null
  }

  // EXISTING PARENT BRANCH — only meaningful when an invite is being honored,
  // because the whole point of this branch is to attach a NEW child to an
  // ALREADY-EXISTING parent account. Without a valid invite there is no child
  // to link, so we fall through to the new-parent branch (which will then
  // surface the "already registered" error as it did before).
  if (token && childUserId && childAgeBand) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, account_type')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      if (existingUser.account_type !== 'parent') {
        return { error: 'That email is already used by another account type.' }
      }

      // Verify ownership AND establish the parent's session in one step.
      // We deliberately use the cookie-aware client here so the sign-in
      // cookie is written; the service client cannot do that.
      const cookieClient = await createClient()
      const { data: signInData, error: signInError } =
        await cookieClient.auth.signInWithPassword({ email, password })

      if (signInError || !signInData.user) {
        return {
          error:
            "An account with this email already exists. Enter that account's password to add this child.",
        }
      }

      const parentUserId = signInData.user.id

      // Idempotency: if this parent is already linked to this child, do not
      // duplicate the row. We still consume the invite below so the link
      // cannot be replayed against a different account.
      const { data: existingLink } = await supabase
        .from('guardian_links')
        .select('id')
        .eq('parent_user_id', parentUserId)
        .eq('child_user_id', childUserId)
        .maybeSingle()

      if (!existingLink) {
        await supabase.from('guardian_links').insert({
          parent_user_id: parentUserId,
          child_user_id: childUserId,
          relationship: 'parent',
          status: 'active',
          publish_requires_approval: defaultPublishRequiresApproval(childAgeBand),
          spending_requires_approval: defaultSpendingRequiresApproval(childAgeBand),
          approved_at: new Date().toISOString(),
        })

        await supabase
          .from('youth_profiles')
          .update({ guardian_linked: true })
          .eq('user_id', childUserId)
      }

      const tokenHash = createHash('sha256').update(token).digest('hex')
      await supabase
        .from('pending_guardian_invites')
        .update({ consumed_at: new Date().toISOString() })
        .eq('token_hash', tokenHash)

      return {}
    }
  }

  // NEW PARENT BRANCH — unchanged from before.

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Parents are verified via the invite flow
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already registered')) {
      return { error: 'An account with that email already exists.' }
    }
    return { error: 'Could not create your account. Please try again.' }
  }

  const parentUserId = authData.user.id

  console.log('[signUpParent] auth user created', {
    parentUserId: authData?.user?.id,
    email,
  })

  // Insert users row
  const { error: usersError } = await supabase.from('users').insert({
    id: parentUserId,
    email,
    account_type: 'parent',
    account_status: 'active',
    email_verified: true,
  })

  if (usersError) {
    console.error('[signUpParent] users insert failed', {
      usersError,
      parentUserId,
      email,
    })
  }

  if (usersError) {
    await supabase.auth.admin.deleteUser(parentUserId)
    return { error: 'Account setup failed. Please try again.' }
  }

  // Insert parent_profiles row
  await supabase.from('parent_profiles').insert({
    user_id: parentUserId,
    display_name: displayName,
    notify_on_submission: true,
    notify_on_approval: true,
    notify_on_moderation: true,
  })

  // Link child if token was valid
  if (childUserId && childAgeBand) {
    await supabase.from('guardian_links').insert({
      parent_user_id: parentUserId,
      child_user_id: childUserId,
      relationship: 'parent',
      status: 'active',
      publish_requires_approval: defaultPublishRequiresApproval(childAgeBand),
      spending_requires_approval: defaultSpendingRequiresApproval(childAgeBand),
      approved_at: new Date().toISOString(),
    })

    // Update child's guardian_linked flag
    await supabase
      .from('youth_profiles')
      .update({ guardian_linked: true })
      .eq('user_id', childUserId)

    // Mark invite consumed
    const tokenHash = createHash('sha256').update(token).digest('hex')
    await supabase
      .from('pending_guardian_invites')
      .update({ consumed_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)
  }

  return {}
}
