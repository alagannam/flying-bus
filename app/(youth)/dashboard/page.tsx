import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Dashboard' }

type SubmissionStatus =
  | 'draft'
  | 'pending_parent_approval'
  | 'pending_review'
  | 'published'
  | 'rejected'

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft:                   'Draft',
  pending_parent_approval: 'Awaiting parent',
  pending_review:          'In review',
  published:               'Published',
  rejected:                'Not approved',
}

const STATUS_COLORS: Record<SubmissionStatus, { bg: string; color: string }> = {
  draft:                   { bg: 'var(--color-surface-raised)',  color: 'var(--color-text-secondary)' },
  pending_parent_approval: { bg: 'var(--color-warning-surface)', color: 'var(--color-warning)' },
  pending_review:          { bg: 'var(--color-warning-surface)', color: 'var(--color-warning)' },
  published:               { bg: 'var(--color-success-surface)', color: 'var(--color-success)' },
  rejected:                { bg: 'var(--color-error-surface)',   color: 'var(--color-error)' },
}

const AGE_BAND_LABELS: Record<string, string> = {
  '8-10':  'Ages 8–10',
  '11-13': 'Ages 11–13',
  '14-18': 'Ages 14–18',
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function submissionDateLabel(s: {
  status: SubmissionStatus
  created_at: string
  submitted_at: string | null
  published_at: string | null
}) {
  if (s.published_at) return `Published ${formatDate(s.published_at)}`
  if (s.submitted_at) return `Submitted ${formatDate(s.submitted_at)}`
  return `Saved ${formatDate(s.created_at)}`
}

type Profile = {
  display_name: string
  username: string
  coins_balance: number
  creator_level: number
  age_band: string
  joined_at: string
}

type RecentSub = {
  id: string
  title: string
  status: SubmissionStatus
  created_at: string
  submitted_at: string | null
  published_at: string | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, subsResult, unreadResult] = await Promise.all([
    supabase
      .from('youth_profiles')
      .select('display_name, username, coins_balance, creator_level, age_band, joined_at')
      .eq('user_id', user.id)
      .single(),

    supabase
      .from('submissions')
      .select('id, title, status, created_at, submitted_at, published_at')
      .eq('youth_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null),
  ])

  if (!profileResult.data) redirect('/login')

  const profile      = profileResult.data as Profile
  const recentSubs   = (subsResult.data ?? []) as RecentSub[]
  const unreadCount  = unreadResult.count ?? 0

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Welcome ───────────────────────────────────────── */}
        <div style={styles.welcomeRow}>
          <div>
            <h1 style={styles.welcomeHeading}>
              Welcome back, {profile.display_name}
            </h1>
            <p style={styles.welcomeSub}>
              @{profile.username}
              <span style={styles.metaDot}>·</span>
              {AGE_BAND_LABELS[profile.age_band] ?? profile.age_band}
              <span style={styles.metaDot}>·</span>
              Joined {formatDate(profile.joined_at)}
            </p>
          </div>
          <span style={styles.levelBadge}>Level {profile.creator_level}</span>
        </div>

        <div style={styles.cards}>

          {/* ── Kana Coins ────────────────────────────────────── */}
          <div style={styles.coinsCard}>
            <span style={styles.coinsIcon}>🪙</span>
            <div>
              <p style={styles.coinsBalance}>{profile.coins_balance.toLocaleString()}</p>
              <p style={styles.coinsLabel}>Kana Coins</p>
            </div>
          </div>

          {/* ── Notifications ────────────────────────────────── */}
          <Link href="/notifications" style={styles.notifCard}>
            <div style={styles.notifLeft}>
              <p style={styles.notifCount}>
                {unreadCount > 0 ? unreadCount : '—'}
              </p>
              <p style={styles.notifLabel}>
                {unreadCount === 1 ? 'unread notification' : 'unread notifications'}
              </p>
            </div>
            <span style={styles.notifArrow}>→</span>
          </Link>

        </div>

        {/* ── Recent submissions ────────────────────────────── */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Your submissions</h2>
            <Link href="/my-submissions" style={styles.sectionLink}>See all →</Link>
          </div>

          {recentSubs.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyHeading}>Nothing submitted yet</p>
              <p style={styles.emptyText}>
                When you&apos;re ready,{' '}
                <Link href="/studio/new" style={styles.emptyLink}>create your first submission</Link>.
              </p>
            </div>
          ) : (
            <ul style={styles.subList}>
              {recentSubs.map(s => {
                const statusKey = (s.status in STATUS_LABELS ? s.status : 'draft') as SubmissionStatus
                const badge = STATUS_COLORS[statusKey]
                return (
                  <li key={s.id}>
                    <Link href={`/my-submissions/${s.id}`} style={styles.subCard}>
                      <div style={styles.subMain}>
                        <span style={styles.subTitle}>{s.title}</span>
                        <span style={styles.subDate}>{submissionDateLabel(s)}</span>
                      </div>
                      <span style={{
                        ...styles.statusBadge,
                        background: badge.bg,
                        color: badge.color,
                      }}>
                        {STATUS_LABELS[statusKey]}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ── Quick links ───────────────────────────────────── */}
        <div style={styles.quickLinks}>
          <Link href="/studio/new" style={styles.quickPrimary}>+ New submission</Link>
          <Link href="/clubs" style={styles.quickSecondary}>Browse clubs</Link>
          <Link href="/challenges" style={styles.quickSecondary}>Challenges</Link>
        </div>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-background)',
    padding: 'var(--space-8) var(--space-6)',
  },
  container: {
    maxWidth: 'var(--container-lg)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-8)',
  },
  welcomeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--space-4)',
    flexWrap: 'wrap' as const,
  },
  welcomeHeading: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-snug)',
  },
  welcomeSub: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    marginTop: 'var(--space-1)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    flexWrap: 'wrap' as const,
  },
  metaDot: { color: 'var(--color-border-strong)' },
  levelBadge: {
    padding: 'var(--space-1) var(--space-3)',
    background: 'var(--color-primary-surface)',
    color: 'var(--color-primary)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'var(--space-4)',
  },
  coinsCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    background: 'var(--color-kana-surface)',
    border: '1px solid var(--color-kana-light)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-5) var(--space-6)',
  },
  coinsIcon: { fontSize: 'var(--text-2xl)', flexShrink: 0 },
  coinsBalance: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 1,
  },
  coinsLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    marginTop: 'var(--space-1)',
  },
  notifCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-5) var(--space-6)',
    textDecoration: 'none',
  },
  notifLeft: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-1)' },
  notifCount: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 1,
  },
  notifLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  notifArrow: {
    fontSize: 'var(--text-lg)',
    color: 'var(--color-text-muted)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
  },
  sectionLink: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: 'var(--font-medium)',
  },
  empty: {
    padding: 'var(--space-12)',
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
  },
  emptyHeading: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    marginBottom: 'var(--space-2)',
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
  emptyLink: {
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-medium)',
  },
  subList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  subCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-4)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-4) var(--space-5)',
    textDecoration: 'none',
  },
  subMain: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
    minWidth: 0,
    flex: 1,
  },
  subTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  subDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  statusBadge: {
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  quickLinks: {
    display: 'flex',
    gap: 'var(--space-3)',
    flexWrap: 'wrap' as const,
  },
  quickPrimary: {
    padding: 'var(--space-3) var(--space-5)',
    background: 'var(--color-primary)',
    color: '#fff',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    textDecoration: 'none',
  },
  quickSecondary: {
    padding: 'var(--space-3) var(--space-5)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    textDecoration: 'none',
  },
} as const
