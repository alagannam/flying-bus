'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useTransition } from 'react'
import { resetPassword } from './actions'

function ResetPasswordInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error,           setError]           = useState<string | null>(null)
  const [done,            setDone]            = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <p style={styles.errorCardText}>Invalid or expired reset link.</p>
          <Link href="/forgot-password" style={styles.errorCardLink}>
            Request a new reset link →
          </Link>
        </div>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const result = await resetPassword(token!, password)
      if (result?.error) {
        setError(result.error)
      } else {
        setDone(true)
      }
    })
  }

  if (done) {
    return (
      <div style={styles.container}>
        <div style={styles.confirmCard}>
          <p style={styles.confirmText}>Password reset successfully.</p>
          <Link href="/login" style={styles.confirmLink}>Go to login →</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Choose a new password</h1>
        <p style={styles.sub}>Pick something at least 8 characters long.</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {error && <div role="alert" style={styles.error}>{error}</div>}

        <div style={styles.field}>
          <label htmlFor="password" style={styles.label}>New password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            disabled={isPending}
          />
        </div>

        <div style={styles.field}>
          <label htmlFor="confirm" style={styles.label}>Confirm password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={styles.input}
            disabled={isPending}
          />
        </div>

        <button type="submit" style={styles.submit} disabled={isPending}>
          {isPending ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={styles.page}>
      <Suspense fallback={<div style={styles.container}><p style={styles.sub}>Loading…</p></div>}>
        <ResetPasswordInner />
      </Suspense>
    </div>
  )
}

const styles = {
  page: {
    minHeight:  '100vh',
    background: 'var(--color-background)',
    padding:    'var(--space-10) var(--space-6)',
  },
  container: {
    maxWidth:      'var(--container-sm)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-6)',
  },
  header: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
  },
  heading: {
    fontSize:   'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    margin:     0,
  },
  sub: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
    margin:   0,
  },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-4)' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-1)' },
  label: {
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color:      'var(--color-text)',
  },
  input: {
    height:       40,
    borderRadius: 'var(--radius-md)',
    border:       '1px solid var(--color-border-strong)',
    padding:      '0 var(--space-3)',
    fontSize:     'var(--text-sm)',
    color:        'var(--color-text)',
    background:   'var(--color-surface)',
    outline:      'none',
    width:        '100%',
  },
  submit: {
    height:       44,
    borderRadius: 'var(--radius-full)',
    border:       'none',
    background:   'var(--color-primary)',
    color:        'var(--color-text-inverse)',
    fontWeight:   'var(--font-semibold)',
    fontSize:     'var(--text-sm)',
    cursor:       'pointer',
    marginTop:    'var(--space-2)',
  },
  error: {
    background:   'var(--color-error-surface)',
    color:        'var(--color-error)',
    borderRadius: 'var(--radius-md)',
    padding:      'var(--space-3) var(--space-4)',
    fontSize:     'var(--text-sm)',
  },
  errorCard: {
    background:    'var(--color-error-surface)',
    color:         'var(--color-error)',
    borderRadius:  'var(--radius-lg)',
    padding:       'var(--space-5) var(--space-6)',
    border:        '1px solid var(--color-error)',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
  },
  errorCardText: {
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    margin:     0,
  },
  errorCardLink: {
    fontSize:       'var(--text-sm)',
    color:          'var(--color-error)',
    fontWeight:     'var(--font-semibold)',
    textDecoration: 'underline',
  },
  confirmCard: {
    background:    'var(--color-success-surface)',
    color:         'var(--color-success)',
    borderRadius:  'var(--radius-lg)',
    padding:       'var(--space-5) var(--space-6)',
    border:        '1px solid var(--color-success)',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
  },
  confirmText: {
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    margin:     0,
  },
  confirmLink: {
    fontSize:       'var(--text-sm)',
    color:          'var(--color-success)',
    fontWeight:     'var(--font-semibold)',
    textDecoration: 'underline',
  },
} as const
