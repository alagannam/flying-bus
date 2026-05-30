'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

export type LoginResult =
  | { error: 'invalid_credentials' }
  | { error: 'restricted' }
  | { error: 'account_not_found' }
  | { ok: true; destination: string }

export async function loginUser(
  email: string,
  password: string,
  next: string,
): Promise<LoginResult> {
  const supabase = await createClient()

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (authError || !data.user) {
    const msg = authError?.message?.toLowerCase() ?? ''
    if (
      msg.includes('banned') ||
      msg.includes('user_banned') ||
      authError?.code === 'user_banned'
    ) {
      return { error: 'restricted' }
    }
    return { error: 'invalid_credentials' }
  }

  const service = createServiceClient()
  const { data: rawUserData } = await service
    .from('users')
    .select('account_type')
    .eq('id', data.user.id)
    .single()

  const userData = rawUserData as { account_type: string } | null

  if (!userData) {
    return { error: 'account_not_found' }
  }

  let destination = next
  if (userData.account_type === 'parent') destination = '/parent/dashboard'
  else if (['editor', 'moderator', 'admin'].includes(userData.account_type)) destination = '/admin'
  else if (userData.account_type === 'youth' && next === '/dashboard') destination = '/dashboard'

  return { ok: true, destination }
}
