import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Join The Flying Bus' }

const PATHS = [
  {
    href: '/join/youth',
    label: 'Join as a kid',
    description: 'Ages 8–18. Create, compete, earn Kana Coins, and help other kids.',
    icon: '🚌',
    cta: 'Start here',
  },
  {
    href: '/join/parent',
    label: 'Create a parent account',
    description: 'Manage your child\'s account, approve activity, and stay informed.',
    icon: '🛡️',
    cta: 'Parent sign-up',
  },
]

export default function JoinPage() {
  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <h1 style={styles.heading}>Join the mission</h1>
        <p style={styles.sub}>Choose how you want to get started.</p>

        <div style={styles.cards}>
          {PATHS.map(path => (
            <Link key={path.href} href={path.href} style={styles.card}>
              <span style={styles.icon}>{path.icon}</span>
              <span style={styles.cardLabel}>{path.label}</span>
              <span style={styles.cardDesc}>{path.description}</span>
              <span style={styles.cta}>{path.cta} →</span>
            </Link>
          ))}
        </div>
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
  inner: {
    maxWidth: 600,
    width: '100%',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  heading: {
    fontSize: 'var(--text-4xl)',
    fontWeight: 'var(--font-extrabold)',
    color: 'var(--color-text)',
    letterSpacing: '-0.03em',
  },
  sub: { fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)' },
  cards: {
    display: 'grid',
    gap: 'var(--space-4)',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  },
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
    padding: 'var(--space-8)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-2xl)',
    border: '2px solid var(--color-border)',
    textDecoration: 'none',
    textAlign: 'left' as const,
    transition: `border-color var(--duration-base) var(--ease-default)`,
  },
  icon: { fontSize: 32 },
  cardLabel: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  cardDesc: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
  },
  cta: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-primary)',
    marginTop: 'var(--space-2)',
  },
} as const
