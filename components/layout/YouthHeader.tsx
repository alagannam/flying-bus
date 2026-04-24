import Link from 'next/link'

interface YouthHeaderProps {
  profile: {
    display_name: string
    username: string
    avatar_url: string | null
    coins_balance: number
    creator_level: number
  }
}

const NAV_LINKS = [
  { label: 'Home',         href: '/dashboard' },
  { label: 'My Clubs',     href: '/my-clubs' },
  { label: 'Challenges',   href: '/challenges' },
  { label: 'Kana Channel', href: '/kana-channel' },
  { label: 'Leaderboards', href: '/leaderboards' },
  { label: 'Impact',       href: '/impact' },
]

export function YouthHeader({ profile }: YouthHeaderProps) {
  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link href="/dashboard" style={styles.logo}>
          <span style={styles.logoText}>The Flying Bus</span>
        </Link>

        <nav style={styles.nav} aria-label="Youth navigation">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} style={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div style={styles.right}>
          <Link href="/coins" style={styles.coinsBadge} title="My Kana Coins">
            <span style={styles.coinsIcon}>✦</span>
            <span style={styles.coinsCount}>{profile.coins_balance.toLocaleString()}</span>
          </Link>

          <Link href="/notifications" style={styles.iconButton} aria-label="Notifications">
            🔔
          </Link>

          <Link href="/profile" style={styles.avatar} title={profile.display_name}>
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                width={32}
                height={32}
                style={{ borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
              />
            ) : (
              <span style={styles.avatarFallback}>
                {profile.display_name[0]?.toUpperCase()}
              </span>
            )}
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
    gap: 'var(--space-6)',
    paddingInline: 'var(--space-6)',
  },
  logo: { textDecoration: 'none', flexShrink: 0 },
  logoText: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-primary)',
    letterSpacing: '-0.02em',
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
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    flexShrink: 0,
  },
  coinsBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    background: 'var(--color-kana-surface)',
    borderRadius: 'var(--radius-full)',
    padding: `var(--space-1) var(--space-3)`,
    textDecoration: 'none',
  },
  coinsIcon: {
    color: 'var(--color-kana)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-bold)',
  },
  coinsCount: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-full)',
    textDecoration: 'none',
    fontSize: 16,
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    textDecoration: 'none',
    background: 'var(--color-primary-surface)',
    flexShrink: 0,
  },
  avatarFallback: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-primary)',
  },
} as const
