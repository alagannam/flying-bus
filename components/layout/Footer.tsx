import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theflyingbus.com'

export function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <div style={styles.brand}>
          <span style={styles.brandName}>The Flying Bus</span>
          <p style={styles.tagline}>Kids helping kids, one mission at a time.</p>
        </div>

        <nav style={styles.links} aria-label="Footer navigation">
          <Link href={`${SITE_URL}/about`} style={styles.link}>About</Link>
          <Link href={`${SITE_URL}/parents`} style={styles.link}>Parents</Link>
          <Link href={`${SITE_URL}/sponsors`} style={styles.link}>Sponsors</Link>
          <Link href={`${SITE_URL}/privacy`} style={styles.link}>Privacy</Link>
          <Link href={`${SITE_URL}/terms`} style={styles.link}>Terms</Link>
        </nav>

        <p style={styles.copy}>
          © {new Date().getFullYear()} The Flying Bus. A nonprofit platform.
        </p>
      </div>
    </footer>
  )
}

const styles = {
  footer: {
    borderTop: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    marginTop: 'auto',
  },
  inner: {
    maxWidth: 'var(--container-xl)',
    margin: '0 auto',
    padding: 'var(--space-12) var(--space-6)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
    alignItems: 'center',
    textAlign: 'center' as const,
  },
  brand: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-2)' },
  brandName: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-primary)',
    letterSpacing: '-0.02em',
  },
  tagline: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
  links: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 'var(--space-4)',
    justifyContent: 'center',
  },
  link: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
  },
  copy: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
} as const
