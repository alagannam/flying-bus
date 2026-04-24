import type { Metadata } from 'next'
import { YouthSignupForm } from './YouthSignupForm'

export const metadata: Metadata = { title: 'Join — Youth & Family' }

export default function JoinYouthPage() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.heading}>Join The Flying Bus</h1>
          <p style={styles.sub}>
            Create, compete, earn Kana Coins, and help kids around the world.
          </p>
        </div>
        <YouthSignupForm />
        <p style={styles.loginNote}>
          Already have an account?{' '}
          <a href="/login" style={styles.link}>Log in</a>
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
    padding: 'var(--space-8)',
    background: 'var(--color-background)',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-2xl)',
    padding: 'var(--space-8)',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  header: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-2)' },
  heading: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' },
  loginNote: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center' as const },
  link: { color: 'var(--color-primary)', fontWeight: 'var(--font-medium)' },
} as const
