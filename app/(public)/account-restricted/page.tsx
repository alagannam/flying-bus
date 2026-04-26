import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Account Restricted' }

export default function AccountRestrictedPage() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <span style={styles.icon}>🔒</span>
        <h1 style={styles.heading}>Your account is restricted</h1>
        <p style={styles.body}>
          Your account has been suspended or is currently unavailable. If you
          believe this is a mistake, please contact us at{' '}
          <a href="mailto:support@theflyingbus.org" style={styles.link}>
            support@theflyingbus.org
          </a>
          .
        </p>
        <a href="/login" style={styles.back}>Back to login</a>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', background: 'var(--color-background)' },
  card: { maxWidth: 420, width: '100%', background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-8)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-4)', textAlign: 'center' as const },
  icon: { fontSize: 40 },
  heading: { fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' },
  body: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' },
  link: { color: 'var(--color-primary)' },
  back: { fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-primary)', textDecoration: 'none' },
} as const
