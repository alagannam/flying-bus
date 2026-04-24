import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Log in' }

export default function LoginPage() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Welcome back</h1>
        <p style={styles.sub}>Log in to The Flying Bus</p>
        <Suspense fallback={<div style={styles.formSkeleton} />}>
          <LoginForm />
        </Suspense>
        <p style={styles.join}>
          New here?{' '}
          <a href="/join/youth" style={styles.joinLink}>
            Join the mission
          </a>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-6)',
    background: 'var(--color-background)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-2xl)',
    padding: 'var(--space-8)',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  heading: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  sub: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    marginTop: 'calc(-1 * var(--space-2))',
  },
  join: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    textAlign: 'center' as const,
  },
  joinLink: {
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-medium)',
  },
  formSkeleton: {
    height: 148,
  },
} as const
