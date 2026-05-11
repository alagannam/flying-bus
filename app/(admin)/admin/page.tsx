import type { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Admin Dashboard' }

const NAV_SECTIONS = [
  { label: 'Submissions',  href: '/admin/submissions',  desc: 'Review queue and all submissions'         },
  { label: 'Flags',        href: '/admin/flags',        desc: 'Content reports filed by youth users'     },
  { label: 'Coins',        href: '/admin/coins',        desc: 'Shop inventory and spend requests'        },
  { label: 'Users',        href: '/admin/users',        desc: 'All accounts and account types'           },
  { label: 'Clubs',        href: '/admin/clubs',        desc: 'Manage clubs and membership'              },
  { label: 'Challenges',   href: '/admin/challenges',   desc: 'Challenge Arena configuration'            },
  { label: 'Featured',     href: '/admin/featured',     desc: 'Curated featured content'                 },
  { label: 'Impact',       href: '/admin/impact',       desc: 'Campaigns and impact voting'              },
  { label: 'Kana Channel', href: '/admin/kana-channel', desc: 'Video layer curation'                     },
  { label: 'Roles',        href: '/admin/roles',        desc: 'Editor and moderator role assignments'    },
  { label: 'Sponsors',     href: '/admin/sponsors',     desc: 'Sponsor and partner management'           },
  { label: 'Audit Log',    href: '/admin/audit-log',    desc: 'System event history'                     },
  { label: 'Settings',     href: '/admin/settings',     desc: 'Platform configuration'                   },
]

export default async function AdminDashboardPage() {
  const service = createServiceClient()

  const [
    { count: pendingReview  },
    { count: openFlags      },
    { count: pendingCoins   },
    { count: totalYouth     },
  ] = await Promise.all([
    service.from('submissions')       .select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    service.from('content_reports')   .select('*', { count: 'exact', head: true }).eq('status', 'open'),
    service.from('coin_spend_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('youth_profiles')    .select('*', { count: 'exact', head: true }),
  ])

  const badgeMap: Record<string, number> = {
    '/admin/submissions': pendingReview  ?? 0,
    '/admin/flags':       openFlags      ?? 0,
    '/admin/coins':       pendingCoins   ?? 0,
  }

  const stats = [
    { label: 'Pending review',        value: pendingReview  ?? 0, accent: (pendingReview  ?? 0) > 0 },
    { label: 'Open flags',            value: openFlags      ?? 0, accent: (openFlags      ?? 0) > 0 },
    { label: 'Pending coin requests', value: pendingCoins   ?? 0, accent: (pendingCoins   ?? 0) > 0 },
    { label: 'Youth members',         value: totalYouth     ?? 0, accent: false },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.pageHeader}>
          <h1 style={styles.heading}>Overview</h1>
          <p style={styles.sub}>Live counts — refreshes on each page load.</p>
        </div>

        {/* ── Stat cards ───────────────────────────────────── */}
        <div style={styles.statsGrid}>
          {stats.map(s => (
            <div key={s.label} style={styles.statCard}>
              <p style={{
                ...styles.statValue,
                color: s.accent ? 'var(--color-warning)' : 'var(--color-text)',
              }}>
                {s.value.toLocaleString()}
              </p>
              <p style={styles.statLabel}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Nav grid ─────────────────────────────────────── */}
        <div style={styles.navGrid}>
          {NAV_SECTIONS.map(section => {
            const count = badgeMap[section.href]
            return (
              <Link key={section.href} href={section.href} style={styles.navCard}>
                <div style={styles.navCardTop}>
                  <span style={styles.navLabel}>{section.label}</span>
                  {count != null && count > 0 && (
                    <span style={styles.badge}>{count.toLocaleString()}</span>
                  )}
                </div>
                <span style={styles.navDesc}>{section.desc}</span>
              </Link>
            )
          })}
        </div>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight:  '100vh',
    background: 'var(--color-background)',
    padding:    'var(--space-8) var(--space-6)',
  },
  container: {
    maxWidth:      'var(--container-xl)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-10)',
  },

  // ── Header ──────────────────────────────────────────────────────────
  pageHeader: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
  },
  heading: {
    fontSize:   'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
  },
  sub: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
    margin:   0,
  },

  // ── Stats ────────────────────────────────────────────────────────────
  statsGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap:                 'var(--space-4)',
  },
  statCard: {
    background:    'var(--color-surface)',
    border:        '1px solid var(--color-border)',
    borderRadius:  'var(--radius-xl)',
    padding:       'var(--space-5) var(--space-6)',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-1)',
  },
  statValue: {
    fontSize:           'var(--text-3xl)',
    fontWeight:         'var(--font-bold)',
    fontVariantNumeric: 'tabular-nums',
    lineHeight:         1,
    margin:             0,
  },
  statLabel: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
    margin:   0,
  },

  // ── Nav grid ─────────────────────────────────────────────────────────
  navGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap:                 'var(--space-3)',
  },
  navCard: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
    background:    'var(--color-surface)',
    border:        '1px solid var(--color-border)',
    borderRadius:  'var(--radius-lg)',
    padding:       'var(--space-4) var(--space-5)',
    textDecoration:'none',
  },
  navCardTop: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    gap:            'var(--space-2)',
  },
  navLabel: {
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
  },
  badge: {
    padding:      '1px var(--space-2)',
    background:   'var(--color-warning-surface)',
    color:        'var(--color-warning)',
    borderRadius: 'var(--radius-full)',
    fontSize:     'var(--text-xs)',
    fontWeight:   'var(--font-bold)',
    flexShrink:   0,
  },
  navDesc: {
    fontSize: 'var(--text-xs)',
    color:    'var(--color-text-muted)',
  },
} as const
