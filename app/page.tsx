import Link from 'next/link'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { Footer } from '@/components/layout/Footer'

// The root page sits outside the (public) route group, so it doesn't
// automatically inherit (public)/layout.tsx's header + footer wrapper.
// Importing them inline here keeps the homepage visually consistent
// with /clubs, /challenges, /impact, etc. without restructuring routes.

const PRODUCT_ZONES = [
  {
    title: 'Publish',
    desc:  'Stories, drawings, videos, debates, reports — every contribution goes through review before it goes live.',
  },
  {
    title: 'Belong',
    desc:  'Join clubs, teams, and regions. Build a profile that travels with you across the platform.',
  },
  {
    title: 'Compete',
    desc:  'Weekly missions, seasonal challenges, leaderboards, and badges — without the toxic social pile-on.',
  },
  {
    title: 'Earn',
    desc:  'Real Kana Coins for participation, contribution, and creativity. Spend them on badges, levels, and impact votes.',
  },
  {
    title: 'Help',
    desc:  'Sponsor-backed impact campaigns let kids back causes that matter and see real outcomes.',
  },
]

const QUICK_LINKS = [
  { label: 'Clubs',        href: '/clubs' },
  { label: 'Challenges',   href: '/challenges' },
  { label: 'Leaderboards', href: '/leaderboards' },
  { label: 'Impact',       href: '/impact' },
]

export default function HomePage() {
  return (
    <>
      <PublicHeader />

      <main>

        {/* ── Hero ──────────────────────────────────────────── */}
        <section style={styles.hero}>
          <div style={styles.heroInner}>
            <h1 style={styles.headline}>
              Kids helping kids, one mission at a time.
            </h1>
            <p style={styles.subheadline}>
              The Flying Bus is a safe global club where kids create, compete, earn
              Kana Coins, and help other kids around the world.
            </p>
            <div style={styles.ctaRow}>
              <Link href="/join" style={styles.primaryCta}>
                Join the mission
              </Link>
              <Link href="/how-it-works" style={styles.secondaryCta}>
                How it works
              </Link>
            </div>
          </div>
        </section>

        {/* ── Product zones ─────────────────────────────────── */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <p style={styles.eyebrow}>What you can do</p>
            <h2 style={styles.sectionTitle}>Five things, one platform</h2>
            <div style={styles.zoneGrid}>
              {PRODUCT_ZONES.map(zone => (
                <div key={zone.title} style={styles.zoneCard}>
                  <p style={styles.zoneTitle}>{zone.title}</p>
                  <p style={styles.zoneDesc}>{zone.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Quick links ───────────────────────────────────── */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <p style={styles.eyebrow}>Take a look around</p>
            <div style={styles.quickGrid}>
              {QUICK_LINKS.map(link => (
                <Link key={link.href} href={link.href} style={styles.quickCard}>
                  <span style={styles.quickLabel}>{link.label}</span>
                  <span style={styles.quickArrow}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Parent reassurance ────────────────────────────── */}
        <section style={styles.parentSection}>
          <div style={styles.sectionInner}>
            <p style={styles.eyebrow}>For parents and guardians</p>
            <h2 style={styles.sectionTitle}>Safety is a feature, not a footer</h2>
            <p style={styles.parentText}>
              Every submission goes through review before publishing. Parents and guardians
              hold real controls — approving content, gating coin spend, and watching their
              child&apos;s activity. There are no open kid-to-kid messages, no public follower
              counts, and no algorithmic pile-ons. The platform is built for kids ages 8 to 18,
              with stronger oversight for younger creators.
            </p>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────── */}
        <section style={styles.finalCta}>
          <div style={styles.finalCtaInner}>
            <h2 style={styles.finalCtaHeading}>Ready to fly?</h2>
            <Link href="/join" style={styles.primaryCta}>
              Join the mission
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}

const styles = {
  // ── Hero ────────────────────────────────────────────────────────
  hero: {
    background: 'var(--color-background)',
    padding:    'var(--space-16) var(--space-6)',
  },
  heroInner: {
    maxWidth:      'var(--container-md)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    alignItems:    'center',
    textAlign:     'center' as const,
    gap:           'var(--space-6)',
  },
  headline: {
    fontSize:   'var(--text-5xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
    margin:     0,
    maxWidth:   '20ch',
  },
  subheadline: {
    fontSize:   'var(--text-lg)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
    maxWidth:   '52ch',
  },
  ctaRow: {
    display:    'flex',
    gap:        'var(--space-3)',
    flexWrap:   'wrap' as const,
    justifyContent: 'center',
    marginTop:  'var(--space-2)',
  },
  primaryCta: {
    padding:        'var(--space-3) var(--space-6)',
    background:     'var(--color-primary)',
    color:          '#fff',
    borderRadius:   'var(--radius-full)',
    fontSize:       'var(--text-base)',
    fontWeight:     'var(--font-semibold)',
    textDecoration: 'none',
  },
  secondaryCta: {
    padding:        'var(--space-3) var(--space-6)',
    background:     'var(--color-surface)',
    color:          'var(--color-text)',
    border:         '1px solid var(--color-border)',
    borderRadius:   'var(--radius-full)',
    fontSize:       'var(--text-base)',
    fontWeight:     'var(--font-medium)',
    textDecoration: 'none',
  },

  // ── Sections ────────────────────────────────────────────────────
  section: {
    padding: 'var(--space-12) var(--space-6)',
  },
  sectionInner: {
    maxWidth:      'var(--container-lg)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-6)',
  },
  eyebrow: {
    fontSize:      'var(--text-xs)',
    fontWeight:    'var(--font-semibold)',
    color:         'var(--color-primary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin:        0,
  },
  sectionTitle: {
    fontSize:   'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    margin:     0,
    maxWidth:   '24ch',
  },

  // ── Product zones ───────────────────────────────────────────────
  zoneGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap:                 'var(--space-4)',
  },
  zoneCard: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
    background:    'var(--color-surface)',
    border:        '1px solid var(--color-border)',
    borderRadius:  'var(--radius-xl)',
    padding:       'var(--space-5) var(--space-6)',
  },
  zoneTitle: {
    fontSize:   'var(--text-lg)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-primary)',
    margin:     0,
  },
  zoneDesc: {
    fontSize:   'var(--text-sm)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
  },

  // ── Quick links ─────────────────────────────────────────────────
  quickGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap:                 'var(--space-3)',
  },
  quickCard: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    gap:            'var(--space-3)',
    background:     'var(--color-surface)',
    border:         '1px solid var(--color-border)',
    borderRadius:   'var(--radius-lg)',
    padding:        'var(--space-4) var(--space-5)',
    textDecoration: 'none',
  },
  quickLabel: {
    fontSize:   'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
  },
  quickArrow: {
    fontSize: 'var(--text-base)',
    color:    'var(--color-text-muted)',
  },

  // ── Parent reassurance ──────────────────────────────────────────
  parentSection: {
    background: 'var(--color-surface)',
    padding:    'var(--space-12) var(--space-6)',
    borderTop:  '1px solid var(--color-border)',
    borderBottom:'1px solid var(--color-border)',
  },
  parentText: {
    fontSize:   'var(--text-base)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
    maxWidth:   '60ch',
  },

  // ── Final CTA ───────────────────────────────────────────────────
  finalCta: {
    padding:    'var(--space-16) var(--space-6)',
    background: 'var(--color-background)',
  },
  finalCtaInner: {
    maxWidth:      'var(--container-md)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    alignItems:    'center',
    textAlign:     'center' as const,
    gap:           'var(--space-5)',
  },
  finalCtaHeading: {
    fontSize:   'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    margin:     0,
  },
} as const
