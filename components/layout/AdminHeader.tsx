import Link from 'next/link'
import type { AccountType } from '@/types/app'

const ALL_NAV_LINKS = [
  { label: 'Submissions',   href: '/admin/submissions',   roles: ['editor', 'admin'] },
  { label: 'Featured',      href: '/admin/featured',      roles: ['editor', 'admin'] },
  { label: 'Challenges',    href: '/admin/challenges',    roles: ['editor', 'admin'] },
  { label: 'Clubs',         href: '/admin/clubs',         roles: ['editor', 'admin'] },
  { label: 'Kana Channel',  href: '/admin/kana-channel',  roles: ['editor', 'admin'] },
  { label: 'Flags',         href: '/admin/flags',         roles: ['moderator', 'admin'] },
  { label: 'Users',         href: '/admin/users',         roles: ['moderator', 'admin'] },
  { label: 'Audit Log',     href: '/admin/audit-log',     roles: ['moderator', 'admin'] },
  { label: 'Impact',        href: '/admin/impact',        roles: ['admin'] },
  { label: 'Coins',         href: '/admin/coins',         roles: ['admin'] },
  { label: 'Roles',         href: '/admin/roles',         roles: ['admin'] },
  { label: 'Sponsors',      href: '/admin/sponsors',      roles: ['admin'] },
  { label: 'Settings',      href: '/admin/settings',      roles: ['admin'] },
]

export function AdminHeader({ accountType }: { accountType: AccountType }) {
  const visibleLinks = ALL_NAV_LINKS.filter(link =>
    link.roles.includes(accountType)
  )

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link href="/admin" style={styles.logo}>
          <span style={styles.logoText}>Flying Bus</span>
          <span style={styles.adminBadge}>{accountType}</span>
        </Link>

        <nav style={styles.nav} aria-label="Admin navigation">
          {visibleLinks.map(link => (
            <Link key={link.href} href={link.href} style={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>
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
    background: '#0F172A',
    borderBottom: '1px solid #1E293B',
  },
  inner: {
    maxWidth: 'var(--container-2xl)',
    margin: '0 auto',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-6)',
    paddingInline: 'var(--space-6)',
    overflowX: 'auto' as const,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none', flexShrink: 0 },
  logoText: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-bold)',
    color: '#F8FAFC',
  },
  adminBadge: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: '#94A3B8',
    background: '#1E293B',
    borderRadius: 'var(--radius-full)',
    padding: `2px var(--space-2)`,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    flex: 1,
  },
  navLink: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    color: '#94A3B8',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    padding: `var(--space-1) var(--space-2)`,
    borderRadius: 'var(--radius-sm)',
  },
} as const
