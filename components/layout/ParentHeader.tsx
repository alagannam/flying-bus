import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Dashboard',   href: '/parent/dashboard' },
  { label: 'My Children', href: '/parent/children' },
  { label: 'Approvals',   href: '/parent/approvals' },
  { label: 'Settings',    href: '/parent/settings' },
]

export function ParentHeader({ displayName }: { displayName: string }) {
  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link href="/parent/dashboard" style={styles.logo}>
          <span style={styles.logoText}>The Flying Bus</span>
          <span style={styles.parentBadge}>Parent</span>
        </Link>

        <nav style={styles.nav} aria-label="Parent navigation">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} style={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div style={styles.right}>
          <span style={styles.displayName}>{displayName}</span>
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
    gap: 'var(--space-8)',
    paddingInline: 'var(--space-6)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none' },
  logoText: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-primary)',
    letterSpacing: '-0.02em',
  },
  parentBadge: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-primary)',
    background: 'var(--color-primary-surface)',
    borderRadius: 'var(--radius-full)',
    padding: `2px var(--space-2)`,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-5)',
    flex: 1,
  },
  navLink: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
  },
  right: { flexShrink: 0 },
  displayName: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-secondary)',
  },
} as const
