'use server'

import { randomBytes, createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPasswordResetEmail } from '@/lib/email'

type ActionResult = { error?: string }

// ── requestPasswordReset ──────────────────────────────────────
// Always returns {} on success regardless of whether the email
// exists. This prevents using the form as a user-enumeration
// oracle — attackers cannot tell from the response whether a
// given email is registered.

export async function requestPasswordReset(email: string): Promise<ActionResult> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !normalized.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  const service = createServiceClient()

  // Look up by email — service-role bypasses RLS.
  const { data: rawUser } = await service
    .from('users')
    .select('id')
    .eq('email', normalized)
    .maybeSingle()

  const user = rawUser as { id: string } | null

  if (user) {
    // Generate single-use token. The raw token goes in the email; only
    // its SHA-256 hash is stored, so a DB leak doesn't expose live tokens.
    const rawToken  = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    // Upsert on user_id (UNIQUE) — a new reset request replaces any
    // existing one, so there's never more than one active token per user.
    const { error: insertError } = await service
      .from('password_reset_tokens')
      .upsert(
        {
          user_id:     user.id,
          token_hash:  tokenHash,
          expires_at:  expiresAt,
          consumed_at: null,
        },
        { onConflict: 'user_id' },
      )

    if (insertError) {
      console.error('[requestPasswordReset] token insert failed', { userId: user.id, insertError })
    } else {
      const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`
      try {
        await sendPasswordResetEmail(normalized, resetUrl)
      } catch (err) {
        console.error('[requestPasswordReset] email send failed', { userId: user.id, err })
      }
    }
  }

  // Same response regardless of whether the email exists.
  return {}
}
