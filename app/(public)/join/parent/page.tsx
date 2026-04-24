import type { Metadata } from 'next'
import { ParentSignupForm } from './ParentSignupForm'

export const metadata: Metadata = { title: 'Parent Account' }

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function JoinParentPage({ searchParams }: Props) {
  const { token } = await searchParams

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.shield}>🛡️</span>
          <h1 style={styles.heading}>Create a parent account</h1>
          <p style={styles.sub}>
            {token
              ? 'Your child signed up for The Flying Bus. Create your account to approve their access and stay informed.'
              : 'Create a parent account to manage your child\'s activity on The Flying Bus.'}
          </p>
        </div>
        <ParentSignupForm token={token ?? null} />
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
  header: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-3)', alignItems: 'flex-start' },
  shield: { fontSize: 32 },
  heading: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' },
} as const
