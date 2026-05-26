'use server'

import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

type ActionResult = { error?: string }

// ── resetPassword ─────────────────────────────────────────────
// Validates the SHA-256 hash of the supplied raw token against
// the stored hash. Tokens are single-use and time-limited.
// Updates the Supabase Auth password via admin API.

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ActionResult> {
  if (!token || !token.trim()) {
    return { error: 'This reset link is invalid or has expired.' }
  }
  if (!newPassword || newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const service   = createServiceClient()

  // Look up the token. Must be unexpired AND unconsumed.
  const { data: rawRow } = await service
    .from('password_reset_tokens')
    .select('user_id, expires_at, consumed_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  const row = rawRow as { user_id: string; expires_at: string; consumed_at: string | null } | null

  if (!row) {
    return { error: 'This reset link is invalid or has expired.' }
  }
  if (row.consumed_at !== null) {
    return { error: 'This reset link is invalid or has expired.' }
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return { error: 'This reset link is invalid or has expired.' }
  }

  // Update the Supabase Auth password via admin API (service-role only).
  const { error: authError } = await service.auth.admin.updateUserById(
    row.user_id,
    { password: newPassword },
  )

  if (authError) {
    console.error('[resetPassword] auth update failed', { userId: row.user_id, authError })
    return { error: 'Could not reset password. Please try again.' }
  }

  // Mark the token consumed so the same link can't be reused.
  const { error: consumeError } = await service
    .from('password_reset_tokens')
    .update({ consumed_at: new Date().toISOString() })
    .eq('token_hash', tokenHash)

  if (consumeError) {
    // Password is already updated. Log for reconciliation but do not
    // fail the user — they shouldn't be told the reset failed when it
    // actually succeeded.
    console.error('[resetPassword] token consume failed', { userId: row.user_id, consumeError })
  }

  return {}
}
