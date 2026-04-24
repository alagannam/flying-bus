'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signUpParent } from './actions'

export function ParentSignupForm({ token }: { token: string | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    if (token) form.set('token', token)

    startTransition(async () => {
      const result = await signUpParent(form)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/parent/dashboard'), 1500)
      }
    })
  }

  if (success) {
    return (
      <div style={successStyles.box}>
        <p style={successStyles.title}>Account created!</p>
        <p style={successStyles.body}>Taking you to your parent dashboard…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      {error && <div role="alert" style={styles.error}>{error}</div>}

      <div style={styles.field}>
        <label htmlFor="display_name" style={styles.label}>Your name</label>
        <input id="display_name" name="display_name" type="text" autoComplete="name" required disabled={isPending} style={styles.input} />
      </div>

      <div style={styles.field}>
        <label htmlFor="email" style={styles.label}>Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required disabled={isPending} style={styles.input} />
      </div>

      <div style={styles.field}>
        <label htmlFor="password" style={styles.label}>Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required disabled={isPending} style={styles.input} />
        <span style={styles.hint}>At least 8 characters</span>
      </div>

      <button type="submit" style={styles.submit} disabled={isPending}>
        {isPending ? 'Creating account…' : 'Create parent account'}
      </button>
    </form>
  )
}

const styles = {
  form: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-4)' },
  error: { background: 'var(--color-error-surface)', color: 'var(--color-error)', borderRadius: 'var(--radius-md)', padding: `var(--space-3) var(--space-4)`, fontSize: 'var(--text-sm)' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-1)' },
  label: { fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text)' },
  input: { height: 40, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', padding: `0 var(--space-3)`, fontSize: 'var(--text-sm)', color: 'var(--color-text)', background: 'var(--color-surface)', outline: 'none', width: '100%' },
  hint: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' },
  submit: { height: 44, borderRadius: 'var(--radius-full)', border: 'none', background: 'var(--color-primary)', color: 'var(--color-text-inverse)', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', cursor: 'pointer', marginTop: 'var(--space-2)' },
} as const

const successStyles = {
  box: { background: 'var(--color-success-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-2)' },
  title: { fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-success)' },
  body: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' },
} as const
