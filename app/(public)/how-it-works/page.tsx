import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'How it works' }

const STEPS = [
  {
    n:     '1',
    title: 'Sign up',
    desc:  'Pick the path that fits — a kid signing up to create, or a parent joining to support their child. Age band sets the experience and the oversight that comes with it.',
  },
  {
    n:     '2',
    title: 'Join a club',
    desc:  'Story Relay, World Window, Challenge Arena, and more. Clubs are the homes for everything kids build together — pick the ones that match your interests.',
  },
  {
    n:     '3',
    title: 'Create and submit',
    desc:  'The submission studio guides you through writing, editing, and packaging your work. Drafts stay private until you choose to send them for review.',
  },
  {
    n:     '4',
    title: 'Get reviewed and published',
    desc:  'Every submission is reviewed before it goes live. For younger creators, a parent or guardian sees it first, then editors take a look. Feedback comes back whether you publish or not.',
  },
  {
    n:     '5',
    title: 'Earn Kana Coins and back causes',
    desc:  'Published work, weekly missions, and challenges earn Kana Coins. Spend them on badges, levels, and votes for sponsor-backed impact campaigns that help other kids.',
  },
]

export default function HowItWorksPage() {
  return (
    <div style={styles.page}>

      {/* ── Header ──────────────────────────────────────────── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>How it works</p>
          <h1 style={styles.headline}>How The Flying Bus works</h1>
          <p style={styles.intro}>
            From signing up to seeing your work go live — here&apos;s the full loop in five steps.
          </p>
        </div>
      </section>

      {/* ── Numbered steps ──────────────────────────────────── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <ol style={styles.stepList}>
            {STEPS.map(step => (
              <li key={step.n} style={styles.stepCard}>
                <span style={styles.stepNum}>{step.n}</span>
                <div style={styles.stepBody}>
                  <p style={styles.stepTitle}>{step.title}</p>
                  <p style={styles.stepDesc}>{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Trust and safety ────────────────────────────────── */}
      <section style={styles.safetySection}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>Built for trust</p>
          <h2 style={styles.sectionTitle}>Safety is in the workflow, not the footer</h2>
          <p style={styles.safetyText}>
            Every submission is reviewed before publishing. There are no open kid-to-kid
            messages, no public follower counts, and no algorithmic pile-ons. Parents and
            guardians have real controls — approving content and gating coin spend for
            younger creators, with lighter oversight as kids grow. The platform is built for
            ages 8 to 18, with the strongest gates around the youngest creators.
          </p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaInner}>
          <h2 style={styles.ctaHeading}>Ready to start?</h2>
          <div style={styles.ctaRow}>
            <Link href="/join" style={styles.primaryCta}>
              Join the mission
            </Link>
            <Link href="/clubs" style={styles.secondaryCta}>
              Explore clubs first
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

  // ── Numbered steps ──────────────────────────────────────────────
  stepList: {
    listStyle:     'none',
    padding:       0,
    margin:        0,
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-4)',
  },
  stepCard: {
    display:      'flex',
    gap:          'var(--space-5)',
    background:   'var(--color-surface)',
    border:       '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding:      'var(--space-5) var(--space-6)',
  },
  stepNum: {
    flexShrink:        0,
    width:             40,
    height:            40,
    borderRadius:      'var(--radius-full)',
    background:        'var(--color-primary-surface)',
    color:             'var(--color-primary)',
    fontSize:          'var(--text-lg)',
    fontWeight:        'var(--font-bold)',
    display:           'flex',
    alignItems:        'center',
    justifyContent:    'center',
    fontVariantNumeric: 'tabular-nums',
  },
  stepBody: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-1)',
    minWidth:      0,
    flex:          1,
  },
  stepTitle: {
    fontSize:   'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
    margin:     0,
  },
  stepDesc: {
    fontSize:   'var(--text-sm)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
  },

  // ── Safety section ──────────────────────────────────────────────
  safetySection: {
    background:   'var(--color-surface)',
    borderTop:    '1px solid var(--color-border)',
    borderBottom: '1px solid var(--color-border)',
    padding:      'var(--space-12) var(--space-6)',
  },
  safetyText: {
    fontSize:   'var(--text-base)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
    maxWidth:   '60ch',
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
