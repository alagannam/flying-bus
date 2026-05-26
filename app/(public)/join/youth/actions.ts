'use server'

import { createServiceClient } from '@/lib/supabase/server'
import {
  computeAgeBand,
  computeAgeBandChangesOn,
  computePlatformExitDate,
} from '@/lib/utils/age-band'
import { sendParentInviteEmail } from '@/lib/email'
import { createHash, randomBytes } from 'crypto'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/

export async function signUpYouth(form: FormData): Promise<{ error?: string }> {
  const displayName  = String(form.get('display_name') ?? '').trim()
  const username     = String(form.get('username') ?? '').trim().toLowerCase()
  const email        = String(form.get('email') ?? '').trim().toLowerCase()
  const password     = String(form.get('password') ?? '')
  const dobString    = String(form.get('date_of_birth') ?? '')
  const parentEmail  = String(form.get('parent_email') ?? '').trim().toLowerCase()

  // ── Validation ──────────────────────────────────────────────
  if (!displayName || !username || !email || !password || !dobString || !parentEmail) {
    return { error: 'All fields are required.' }
  }

  if (!USERNAME_RE.test(username)) {
    return { error: 'Username can only contain letters, numbers, and underscores (3–30 characters).' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  if (email === parentEmail) {
    return { error: 'Your email and your parent\'s email must be different.' }
  }

  // ── Age-band computation — DOB is never stored ───────────────
  const dob = new Date(dobString)
  if (isNaN(dob.getTime())) return { error: 'Invalid date of birth.' }

  const ageBand = computeAgeBand(dob)
  if (!ageBand) {
    return { error: 'The Flying Bus is for ages 8–18. Check your date of birth.' }
  }

  const ageBandChangesOn = computeAgeBandChangesOn(dob, ageBand)
  const platformExitDate = computePlatformExitDate(dob)

  // ── Database writes ──────────────────────────────────────────
  const supabase = createServiceClient()

  // Check username uniqueness
  const { data: existing } = await supabase
    .from('youth_profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) return { error: 'That username is already taken.' }

  // Create Supabase auth user — Supabase sends the verification email
  // automatically based on project email settings when email_confirm: false.
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already registered')) {
      return { error: 'An account with that email already exists.' }
    }
    return { error: 'Could not create your account. Please try again.' }
  }

  const userId = authData.user.id

  // Insert users row
  const { error: usersError } = await supabase.from('users').insert({
    id: userId,
    email,
    account_type: 'youth',
    account_status: 'active',
    email_verified: false,
  })

  if (usersError) {
    await supabase.auth.admin.deleteUser(userId)
    return { error: 'Account setup failed. Please try again.' }
  }

  // Insert youth_profiles row — DOB not stored
  const { error: profileError } = await supabase.from('youth_profiles').insert({
    user_id: userId,
    display_name: displayName,
    username,
    age_band: ageBand,
    age_band_changes_on: ageBandChangesOn?.toISOString().split('T')[0] ?? null,
    platform_exit_date: platformExitDate.toISOString().split('T')[0],
    guardian_linked: false,
    coins_balance: 0,
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId)
    return { error: 'Profile setup failed. Please try again.' }
  }

  // Insert default contributor role
  await supabase.from('user_roles').insert({
    user_id: userId,
    role: 'contributor',
    scope_type: 'global',
    granted_by: null,
  })

  // Create guardian invite token
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await supabase.from('pending_guardian_invites').insert({
    parent_email: parentEmail,
    child_user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  })

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/join/parent?token=${rawToken}`
  await sendParentInviteEmail(parentEmail, displayName, inviteUrl).catch(err => {
    console.error('[signUpYouth] sendParentInviteEmail failed', err)
  })

  // TODO: createThirdwebWallet(userId) — when Thirdweb SDK is configured

  return {}
}
