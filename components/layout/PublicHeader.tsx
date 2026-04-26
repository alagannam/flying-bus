import Link from 'next/link'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.theflyingbus.org'

const NAV_LINKS = [
  { label: 'Clubs',        href: '/clubs' },
  { label: 'Challenges',   href: '/challenges' },
  { label: 'Leaderboards', href: '/leaderboards' },
  { label: 'Impact',       href: '/impact' },
]

export function PublicHeader() {
  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link href={process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theflyingbus.org'} style={styles.logo}>
          <span style={styles.logoText}>The Flying Bus</span>
        </Link>

        <nav style={styles.nav} aria-label="Primary navigation">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} style={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div style={styles.actions}>
          <Link href={`${APP_URL}/login`} style={styles.loginLink}>
            Log in
          </Link>
          <Link href={`${APP_URL}/join/youth`} style={styles.joinButton}>
            Join the mission
          </Link>
        </div>
      </div>
    </header>
  )
}

const styles = {
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    height: 'var(--nav-height)',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
  },
  inner: {
    maxWidth: 'var(--container-xl)',
    margin: '0 auto',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingInline: 'var(--space-6)',
    gap: 'var(--space-8)',
  },
  logo: {
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoText: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-primary)',
    letterSpacing: '-0.02em',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-6)',
    flex: 1,
  },
  navLink: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    transition: `color var(--duration-fast) var(--ease-default)`,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    flexShrink: 0,
  },
  loginLink: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    padding: `var(--space-2) var(--space-3)`,
  },
  joinButton: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-inverse)',
    background: 'var(--color-primary)',
    borderRadius: 'var(--radius-full)',
    padding: `var(--space-2) var(--space-5)`,
    textDecoration: 'none',
    transition: `background var(--duration-fast) var(--ease-default)`,
  },
} as const
