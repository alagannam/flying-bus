import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Parents & safety' }

const PROMISES = [
  'Every submission is reviewed before it goes live.',
  'No open kid-to-kid messages.',
  'No algorithmic feeds.',
  'No public follower counts.',
  'No live video or open voice chat.',
]

const AGE_BANDS = [
  {
    band:  '8–10',
    who:   'For our youngest creators.',
    oversight:
      'Strongest oversight. Submissions go to a linked parent or guardian for approval before they ever reach editors. Coin spend requests in the shop also need parent sign-off.',
    youth:
      'Structured prompts in clubs like Story Relay and Challenge Arena. Safe reactions only — no open commenting.',
  },
  {
    band:  '11–13',
    who:   'For middle-grade kids ready to build a creator identity.',
    oversight:
      'Strong oversight remains in place. Parents see activity, can adjust spending rules, and stay in the loop without gating every submission.',
    youth:
      'More formats unlocked — longer pieces, more challenge categories, deeper club participation. Interactions are still guided.',
  },
  {
    band:  '14–18',
    who:   'For older creators taking on real leadership roles.',
    oversight:
      'Lighter touch from parents, but platform-level moderation stays strict. Adults review every public submission regardless of age.',
    youth:
      'Broader creative tools, leadership opportunities like junior editor and club captain, and more room to express. Moderation never sleeps.',
  },
]

const WONT_DO = [
  {
    title: 'No open DMs',
    desc:  'Kids cannot send direct private messages to each other. Conversations live in moderated club spaces or not at all.',
  },
  {
    title: 'No pile-ons',
    desc:  'No public comment threads on individual kids. No way for a crowd to gang up on one creator.',
  },
  {
    title: 'No autoplay rabbit holes',
    desc:  'Video content is curated, not algorithmically pushed. Nothing autoplays into an endless scroll.',
  },
  {
    title: 'No follower mechanics',
    desc:  'No follower counts, no like-counts on profiles, no popularity ranking. Recognition comes from contribution, not social score.',
  },
]

export default function ParentsSafetyPage() {
  return (
    <div style={styles.page}>

      {/* ── Header ──────────────────────────────────────────── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>For parents and guardians</p>
          <h1 style={styles.headline}>Built for kids. Trusted by families.</h1>
          <p style={styles.intro}>
            Safety isn&apos;t a setting buried in a menu — it&apos;s how the platform is shaped from the ground up.
          </p>
        </div>
      </section>

      {/* ── The promise ─────────────────────────────────────── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>The promise</p>
          <h2 style={styles.sectionTitle}>What you can count on</h2>
          <ul style={styles.promiseList}>
            {PROMISES.map(p => (
              <li key={p} style={styles.promiseItem}>
                <span style={styles.bullet}>✓</span>
                <span style={styles.promiseText}>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Age bands ───────────────────────────────────────── */}
      <section style={styles.bandSection}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>Age bands</p>
          <h2 style={styles.sectionTitle}>Oversight that grows with your child</h2>
          <div style={styles.bandGrid}>
            {AGE_BANDS.map(b => (
              <div key={b.band} style={styles.bandCard}>
                <p style={styles.bandLabel}>Ages {b.band}</p>
                <p style={styles.bandWho}>{b.who}</p>
                <div style={styles.bandRow}>
                  <p style={styles.bandRowLabel}>Parent oversight</p>
                  <p style={styles.bandRowText}>{b.oversight}</p>
                </div>
                <div style={styles.bandRow}>
                  <p style={styles.bandRowLabel}>What youth can do</p>
                  <p style={styles.bandRowText}>{b.youth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we don't do ────────────────────────────────── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>What we don&apos;t do</p>
          <h2 style={styles.sectionTitle}>The things we deliberately left out</h2>
          <div style={styles.wontGrid}>
            {WONT_DO.map(item => (
              <div key={item.title} style={styles.wontCard}>
                <p style={styles.wontTitle}>{item.title}</p>
                <p style={styles.wontDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaInner}>
          <h2 style={styles.ctaHeading}>Ready to support a young creator?</h2>
          <div style={styles.ctaRow}>
            <Link href="/join/parent" style={styles.primaryCta}>
              Join as a parent
            </Link>
            <Link href="/how-it-works" style={styles.secondaryCta}>
              For families: how it works
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

const styles = {
  page: {
    minHeight:  '100vh',
    background: 'var(--color-background)',
  },

  // ── Sections ────────────────────────────────────────────────────
  section: {
    padding: 'var(--space-12) var(--space-6)',
  },
  sectionInner: {
    maxWidth:      'var(--container-md)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-5)',
  },
  eyebrow: {
    fontSize:      'var(--text-xs)',
    fontWeight:    'var(--font-semibold)',
    color:         'var(--color-primary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin:        0,
  },
  headline: {
    fontSize:   'var(--text-4xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
    margin:     0,
    maxWidth:   '22ch',
  },
  intro: {
    fontSize:   'var(--text-lg)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
    maxWidth:   '52ch',
  },
  sectionTitle: {
    fontSize:   'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    margin:     0,
    maxWidth:   '24ch',
  },

  // ── Promise bullets ─────────────────────────────────────────────
  promiseList: {
    listStyle:     'none',
    padding:       0,
    margin:        0,
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-3)',
  },
  promiseItem: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        'var(--space-3)',
  },
  bullet: {
    flexShrink:     0,
    width:          24,
    height:         24,
    borderRadius:   'var(--radius-full)',
    background:     'var(--color-success-surface)',
    color:          'var(--color-success)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       'var(--text-xs)',
    fontWeight:     'var(--font-bold)',
    marginTop:      2,
  },
  promiseText: {
    fontSize:   'var(--text-base)',
    color:      'var(--color-text)',
    lineHeight: 'var(--leading-relaxed)',
  },

  // ── Age bands ───────────────────────────────────────────────────
  bandSection: {
    background:   'var(--color-surface)',
    borderTop:    '1px solid var(--color-border)',
    borderBottom: '1px solid var(--color-border)',
    padding:      'var(--space-12) var(--space-6)',
  },
  bandGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap:                 'var(--space-4)',
  },
  bandCard: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-3)',
    background:    'var(--color-background)',
    border:        '1px solid var(--color-border)',
    borderRadius:  'var(--radius-xl)',
    padding:       'var(--space-5) var(--space-6)',
  },
  bandLabel: {
    fontSize:   'var(--text-xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-primary)',
    margin:     0,
  },
  bandWho: {
    fontSize:   'var(--text-sm)',
    color:      'var(--color-text)',
    fontWeight: 'var(--font-medium)',
    margin:     0,
  },
  bandRow: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-1)',
  },
  bandRowLabel: {
    fontSize:      'var(--text-xs)',
    fontWeight:    'var(--font-semibold)',
    color:         'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin:        0,
  },
  bandRowText: {
    fontSize:   'var(--text-sm)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
  },

  // ── What we don't do ────────────────────────────────────────────
  wontGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap:                 'var(--space-3)',
  },
  wontCard: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
    background:    'var(--color-surface)',
    border:        '1px solid var(--color-border)',
    borderRadius:  'var(--radius-lg)',
    padding:       'var(--space-4) var(--space-5)',
  },
  wontTitle: {
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    margin:     0,
  },
  wontDesc: {
    fontSize:   'var(--text-sm)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
  },

  // ── CTA ─────────────────────────────────────────────────────────
  ctaSection: {
    padding:    'var(--space-16) var(--space-6)',
    background: 'var(--color-background)',
  },
  ctaInner: {
    maxWidth:      'var(--container-md)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    alignItems:    'center',
    textAlign:     'center' as const,
    gap:           'var(--space-5)',
  },
  ctaHeading: {
    fontSize:   'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    margin:     0,
  },
  ctaRow: {
    display:        'flex',
    gap:            'var(--space-3)',
    flexWrap:       'wrap' as const,
    justifyContent: 'center',
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
} as const
