'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signUpYouth } from './actions'

export function YouthSignupForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await signUpYouth(form)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    })
  }

  if (success) {
    return (
      <div style={successStyles.box}>
        <p style={successStyles.title}>You&apos;re in! 🎉</p>
        <p style={successStyles.body}>
          Check your email to verify your account. We&apos;ve also emailed your parent
          to get them set up.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      {error && (
        <div role="alert" style={styles.error}>{error}</div>
      )}

      <Field id="display_name" label="Your name (displayed on the platform)" type="text" autoComplete="name" required disabled={isPending} />
      <Field id="username" label="Username (public, no real names)" type="text" autoComplete="username" required disabled={isPending} hint="Letters, numbers, underscores only" />
      <Field id="email" label="Your email" type="email" autoComplete="email" required disabled={isPending} />
      <Field id="password" label="Password" type="password" autoComplete="new-password" required disabled={isPending} hint="At least 8 characters" />
      <Field id="date_of_birth" label="Date of birth" type="date" required disabled={isPending} hint="Used to personalise your experience. Never stored or shared." />
      <Field id="parent_email" label="Parent or guardian email" type="email" autoComplete="off" required disabled={isPending} hint="We'll email them to create a linked account." />

      <button type="submit" style={styles.submit} disabled={isPending}>
        {isPending ? 'Creating your account…' : 'Join the mission'}
      </button>

      <p style={styles.legal}>
        By joining you agree to our{' '}
        <a href="https://theflyingbus.com/terms" target="_blank" rel="noopener noreferrer">Terms</a>
        {' '}and{' '}
        <a href="https://theflyingbus.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
      </p>
    </form>
  )
}

function Field({
  id, label, type, autoComplete, required, disabled, hint,
}: {
  id: string
  label: string
  type: string
  autoComplete?: string
  required?: boolean
  disabled?: boolean
  hint?: string
}) {
  return (
    <div style={styles.field}>
      <label htmlFor={id} style={styles.label}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        style={styles.input}
      />
      {hint && <span style={styles.hint}>{hint}</span>}
    </div>
  )
}

const styles = {
  form: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-4)' },
  error: {
    background: 'var(--color-error-surface)',
    color: 'var(--color-error)',
    borderRadius: 'var(--radius-md)',
    padding: `var(--space-3) var(--space-4)`,
    fontSize: 'var(--text-sm)',
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-1)' },
  label: { fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text)' },
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
  hint: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' },
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
  legal: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' as const },
} as const

const successStyles = {
  box: {
    background: 'var(--color-success-surface)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  title: { fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-success)' },
  body: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' },
} as const
