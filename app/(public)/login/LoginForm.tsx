'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isRestricted, setIsRestricted] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsRestricted(false)

    startTransition(async () => {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (authError || !data.user) {
        const msg = authError?.message?.toLowerCase() ?? ''
        if (msg.includes('banned') || msg.includes('user_banned') || authError?.code === 'user_banned') {
          setIsRestricted(true)
        } else {
          setError('Incorrect email or password.')
        }
        return
      }

      // Determine redirect based on account_type
      const { data: rawUserData } = await supabase
        .from('users')
        .select('account_type')
        .eq('id', data.user.id)
        .single()

      const userData = rawUserData as { account_type: string } | null

      if (!userData) {
        setError('Account not found. Please contact support.')
        return
      }

      let destination = next
      if (userData.account_type === 'parent') destination = '/parent/dashboard'
      else if (['editor', 'moderator', 'admin'].includes(userData.account_type)) destination = '/admin'
      else if (userData.account_type === 'youth' && next === '/dashboard') destination = '/dashboard'

      router.push(destination)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      {isRestricted && (
        <div role="alert" style={styles.restricted}>
          Your account has been restricted.{' '}
          <a href="/account-restricted" style={styles.restrictedLink}>
            Learn more
          </a>
        </div>
      )}
      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}

      <div style={styles.field}>
        <label htmlFor="email" style={styles.label}>Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={styles.input}
          disabled={isPending}
        />
      </div>

      <div style={styles.field}>
        <label htmlFor="password" style={styles.label}>Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={styles.input}
          disabled={isPending}
        />
      </div>

      <button type="submit" style={styles.submit} disabled={isPending}>
        {isPending ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  )
}

const styles = {
  form: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-4)' },
  restricted: {
    background: 'var(--color-warning-surface)',
    color: 'var(--color-warning)',
    borderRadius: 'var(--radius-md)',
    padding: `var(--space-3) var(--space-4)`,
    fontSize: 'var(--text-sm)',
    lineHeight: 'var(--leading-relaxed)',
  },
  restrictedLink: {
    color: 'var(--color-warning)',
    fontWeight: 'var(--font-semibold)',
  },
  error: {
    background: 'var(--color-error-surface)',
    color: 'var(--color-error)',
    borderRadius: 'var(--radius-md)',
    padding: `var(--space-3) var(--space-4)`,
    fontSize: 'var(--text-sm)',
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-1)' },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
  },
  input: {
    height: 40,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    padding: `0 var(--space-3)`,
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    background: 'var(--color-surface)',
    outline: 'none',
    width: '100%',
  },
  submit: {
    height: 44,
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    fontWeight: 'var(--font-semibold)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
    marginTop: 'var(--space-2)',
  },
} as const
