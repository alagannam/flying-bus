'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { requestPasswordReset } from './actions'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [done,  setDone]      = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await requestPasswordReset(email)
      if (result?.error) {
        setError(result.error)
      } else {
        setDone(true)
      }
    })
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Link href="/login" style={styles.back}>← Back to login</Link>

        <div style={styles.header}>
          <h1 style={styles.heading}>Reset your password</h1>
          <p style={styles.sub}>
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {done ? (
          <div style={styles.confirmCard}>
            <p style={styles.confirmText}>
              Check your email — if an account exists for that address
              you&apos;ll receive a reset link shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {error && <div role="alert" style={styles.error}>{error}</div>}

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

            <button type="submit" style={styles.submit} disabled={isPending}>
              {isPending ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
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
  back: {
    fontSize:       'var(--text-sm)',
    color:          'var(--color-text-secondary)',
    textDecoration: 'none',
    alignSelf:      'flex-start' as const,
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
  confirmCard: {
    background:   'var(--color-success-surface)',
    color:        'var(--color-success)',
    borderRadius: 'var(--radius-lg)',
    padding:      'var(--space-5) var(--space-6)',
    border:       '1px solid var(--color-success)',
  },
  confirmText: {
    fontSize:   'var(--text-sm)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
  },
} as const
