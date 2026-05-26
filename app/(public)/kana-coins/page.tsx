import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Kana Coins' }

const EARN = [
  {
    title: 'Publish your work',
    desc:  'Submissions that pass review earn coins. The more you contribute, the more you earn.',
  },
  {
    title: 'Complete weekly missions',
    desc:  'Each week brings small, focused missions across the clubs. Finish them to earn coins and badges.',
  },
  {
    title: 'Enter challenges',
    desc:  'Seasonal challenges in creativity, debate, kindness, and design — winning entries earn extra coins.',
  },
  {
    title: 'Hit streaks',
    desc:  'Show up consistently. Streak milestones recognize creators who keep coming back.',
  },
]

const SPEND = [
  {
    title: 'Badges',
    desc:  'Special badges you can pin to your profile and submissions.',
  },
  {
    title: 'Profile upgrades',
    desc:  'Customize how your profile looks to other kids and visitors.',
  },
  {
    title: 'Premium challenge tracks',
    desc:  'Access to special seasonal challenge tracks with bigger creative scope.',
  },
  {
    title: 'Impact voting',
    desc:  'Spend coins to back sponsor-funded campaigns that help other kids around the world.',
  },
]

const NOT = [
  {
    title: 'No trading',
    desc:  'Kana Coins cannot be traded between kids. There is no marketplace for them.',
  },
  {
    title: 'No price charts',
    desc:  'There is no price, no chart, no value-over-time graph. Coins are earned, not bought.',
  },
  {
    title: 'No speculation',
    desc:  'Nothing about Kana Coins encourages investment thinking or future-value bets.',
  },
  {
    title: 'No gambling aesthetics',
    desc:  'No spin wheels, no lottery mechanics, no loot boxes. Earning is direct and predictable.',
  },
  {
    title: 'No wallet management',
    desc:  'Kids never have to manage a wallet, copy a seed phrase, or learn crypto vocabulary to participate.',
  },
]

export default function KanaCoinsPage() {
  return (
    <div style={styles.page}>

      {/* ── Header ──────────────────────────────────────────── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>Kana Coins</p>
          <h1 style={styles.headline}>The currency for kids who create.</h1>
          <p style={styles.intro}>
            Kana Coins are how the platform recognizes participation, creativity, and helping others.
          </p>
        </div>
      </section>

      {/* ── What they are ───────────────────────────────────── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>What they are</p>
          <h2 style={styles.sectionTitle}>A real currency for a real platform</h2>
          <p style={styles.paragraph}>
            Kana Coins are the platform&apos;s currency for kids who show up, create, and contribute.
            Every published submission, completed mission, and challenge entry can earn coins —
            and those coins unlock real things inside the platform.
          </p>
          <p style={styles.paragraph}>
            They aren&apos;t play money, but they aren&apos;t for trading either. Kids earn them by
            participating and spend them on badges, profile upgrades, and votes for causes that
            matter. The whole loop happens inside The Flying Bus, by design.
          </p>
          <p style={styles.paragraph}>
            Behind the scenes, Kana Coins live on Thirdweb infrastructure — but kids never have
            to think about that. No wallets to manage, no addresses to copy, no technical setup.
            It just works.
          </p>
        </div>
      </section>

      {/* ── How to earn ─────────────────────────────────────── */}
      <section style={styles.altSection}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>How to earn</p>
          <h2 style={styles.sectionTitle}>Earned through contribution</h2>
          <div style={styles.grid4}>
            {EARN.map(item => (
              <div key={item.title} style={styles.card}>
                <p style={styles.cardTitle}>{item.title}</p>
                <p style={styles.cardDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How to spend ────────────────────────────────────── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>How to spend</p>
          <h2 style={styles.sectionTitle}>Spent on things kids actually want</h2>
          <div style={styles.grid4}>
            {SPEND.map(item => (
              <div key={item.title} style={styles.card}>
                <p style={styles.cardTitle}>{item.title}</p>
                <p style={styles.cardDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What they are NOT ───────────────────────────────── */}
      <section style={styles.altSection}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>What they aren&apos;t</p>
          <h2 style={styles.sectionTitle}>The things Kana Coins deliberately are not</h2>
          <div style={styles.notGrid}>
            {NOT.map(item => (
              <div key={item.title} style={styles.notCard}>
                <p style={styles.notTitle}>{item.title}</p>
                <p style={styles.notDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For parents and partners ────────────────────────── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>For parents and partners</p>
          <h2 style={styles.sectionTitle}>The honest, plain-language version</h2>
          <p style={styles.paragraph}>
            Kana Coins are built on Thirdweb, which means they are real digital tokens recorded
            transparently on infrastructure designed for accountability. But the design choice
            from day one has been to keep all of that invisible to kids. We don&apos;t teach kids
            crypto vocabulary or push wallet ownership during onboarding. A deeper technical
            page for parents and partners is on its way.
          </p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaInner}>
          <h2 style={styles.ctaHeading}>Start earning your first coins</h2>
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
  altSection: {
    background:   'var(--color-surface)',
    borderTop:    '1px solid var(--color-border)',
    borderBottom: '1px solid var(--color-border)',
    padding:      'var(--space-12) var(--space-6)',
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
    maxWidth:   '28ch',
  },
  paragraph: {
    fontSize:   'var(--text-base)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
    maxWidth:   '60ch',
  },

  // ── Grids ───────────────────────────────────────────────────────
  grid4: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap:                 'var(--space-4)',
  },
  card: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
    background:    'var(--color-background)',
    border:        '1px solid var(--color-border)',
    borderRadius:  'var(--radius-xl)',
    padding:       'var(--space-5) var(--space-6)',
  },
  cardTitle: {
    fontSize:   'var(--text-base)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-primary)',
    margin:     0,
  },
  cardDesc: {
    fontSize:   'var(--text-sm)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
  },

  // ── "What they aren't" grid ─────────────────────────────────────
  notGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap:                 'var(--space-3)',
  },
  notCard: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
    background:    'var(--color-background)',
    border:        '1px solid var(--color-border)',
    borderRadius:  'var(--radius-lg)',
    padding:       'var(--space-4) var(--space-5)',
  },
  notTitle: {
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    margin:     0,
  },
  notDesc: {
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
