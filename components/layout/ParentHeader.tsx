import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Dashboard',   href: '/parent/dashboard' },
  { label: 'My Children', href: '/parent/children' },
  { label: 'Approvals',   href: '/parent/approvals' },
  { label: 'Settings',    href: '/parent/settings' },
]

export function ParentHeader({ displayName, unreadCount }: { displayName: string; unreadCount: number }) {
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
          <Link
            href="/parent/notifications"
            style={styles.notifButton}
            aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          >
            🔔
            {unreadCount > 0 && (
              <span style={styles.notifBadge} aria-hidden="true">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
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
  right: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  notifButton: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-surface-raised)',
    border: '1px solid var(--color-border)',
    textDecoration: 'none',
    fontSize: 'var(--text-base)',
  },
  notifBadge: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-error)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'var(--font-bold)' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: 3,
    lineHeight: 1,
  },
  displayName: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-secondary)',
  },
} as const
