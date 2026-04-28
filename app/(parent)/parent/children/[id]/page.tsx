import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Child Profile' }
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function statusLabel(status: string) {
  switch (status) {
    case 'draft':                   return 'Draft'
    case 'pending_parent_approval': return 'Awaiting your approval'
    case 'pending_review':          return 'Under review'
    case 'published':               return 'Published'
    case 'rejected':                return 'Returned'
    default:                        return status
  }
}

function statusColors(status: string): React.CSSProperties {
  switch (status) {
    case 'published':               return { background: 'var(--color-success-surface)', color: 'var(--color-success)' }
    case 'pending_parent_approval': return { background: 'var(--color-warning-surface)', color: 'var(--color-warning)' }
    case 'pending_review':          return { background: 'var(--color-info-surface)',    color: 'var(--color-info)' }
    case 'rejected':                return { background: 'var(--color-error-surface)',   color: 'var(--color-error)' }
    default:                        return { background: 'var(--color-surface-raised)',  color: 'var(--color-text-muted)' }
  }
}

type GuardianLinkRow = {
  id: string
  publish_requires_approval: boolean
  spending_requires_approval: boolean
}

type YouthProfile = {
  display_name: string
  username: string
  creator_score: number
  coins_balance: number
  streak_current: number
  streak_longest: number
  creator_level: number
  age_band: string
  joined_at: string
}

type BadgeRow      = { id: string; badge_slug: string; awarded_at: string }
type SubmissionRow = {
  id: string; title: string; status: string
  submitted_at: string | null; published_at: string | null
}

export default async function ChildDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: childId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Verify an active guardian link exists for this parent → child pair.
  // Any other parent who guesses the child's UUID gets notFound().
  const { data: rawLink } = await service
    .from('guardian_links')
    .select('id, publish_requires_approval, spending_requires_approval')
    .eq('parent_user_id', user.id)
    .eq('child_user_id', childId)
    .eq('status', 'active')
    .maybeSingle()

  if (!rawLink) notFound()
  const link = rawLink as GuardianLinkRow

  const [profileResult, badgesResult, subsResult] = await Promise.all([
    service
      .from('youth_profiles')
      .select('display_name, username, creator_score, coins_balance, streak_current, streak_longest, creator_level, age_band, joined_at')
      .eq('user_id', childId)
      .maybeSingle(),
    service
      .from('youth_badges')
      .select('id, badge_slug, awarded_at')
      .eq('user_id', childId)
      .order('awarded_at', { ascending: false }),
    service
      .from('submissions')
      .select('id, title, status, submitted_at, published_at')
      .eq('youth_user_id', childId)
      .order('submitted_at', { ascending: false }),
  ])

  if (!profileResult.data) notFound()

  const profile = profileResult.data as YouthProfile
  const badges  = (badgesResult.data ?? []) as BadgeRow[]
  const subs    = (subsResult.data ?? []) as SubmissionRow[]

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <Link href="/parent/dashboard" style={styles.back}>
          ← Dashboard
        </Link>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.displayName}>{profile.display_name}</h1>
            <p style={styles.username}>@{profile.username}</p>
          </div>
          <div style={styles.headerMeta}>
            <span style={styles.ageBandPill}>{profile.age_band}</span>
            <span style={styles.joined}>Joined {formatDate(profile.joined_at)}</span>
          </div>
        </div>

        {/* ── Stats card ─────────────────────────────────────── */}
        <div style={styles.card}>
          <p style={styles.cardHeading}>Stats</p>
          <div style={styles.statsGrid}>
            <div style={styles.stat}>
              <span style={styles.statValue}>{profile.creator_level}</span>
              <span style={styles.statLabel}>Level</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>{profile.creator_score.toLocaleString()}</span>
              <span style={styles.statLabel}>Creator score</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>{profile.coins_balance.toLocaleString()}</span>
              <span style={styles.statLabel}>Kana Coins</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>{profile.streak_current}</span>
              <span style={styles.statLabel}>Current streak</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>{profile.streak_longest}</span>
              <span style={styles.statLabel}>Longest streak</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>{badges.length}</span>
              <span style={styles.statLabel}>Badges</span>
            </div>
          </div>
        </div>

        {/* ── Oversight settings summary ──────────────────────── */}
        <div style={styles.card}>
          <div style={styles.cardTopRow}>
            <p style={styles.cardHeading}>Your oversight settings</p>
            <Link href="/parent/settings" style={styles.editLink}>Edit →</Link>
          </div>
          <dl style={styles.dl}>
            <div style={styles.dlRow}>
              <dt style={styles.dt}>Submissions require your approval</dt>
              <dd style={{ ...styles.dd, ...(link.publish_requires_approval ? styles.ddYes : styles.ddNo) }}>
                {link.publish_requires_approval ? 'Yes' : 'No'}
              </dd>
            </div>
            <div style={styles.dlRow}>
              <dt style={styles.dt}>Coin spending requires your approval</dt>
              <dd style={{ ...styles.dd, ...(link.spending_requires_approval ? styles.ddYes : styles.ddNo) }}>
                {link.spending_requires_approval ? 'Yes' : 'No'}
              </dd>
            </div>
          </dl>
        </div>

        {/* ── Badges ─────────────────────────────────────────── */}
        {badges.length > 0 && (
          <div style={styles.card}>
            <p style={styles.cardHeading}>Badges ({badges.length})</p>
            <ul style={styles.badgeList}>
              {badges.map(b => (
                <li key={b.id} style={styles.badgeItem}>
                  <span style={styles.badgeSlug}>
                    {b.badge_slug.replace(/_/g, ' ')}
                  </span>
                  <span style={styles.badgeDate}>{formatDate(b.awarded_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── All submissions ─────────────────────────────────── */}
        <div style={styles.card}>
          <p style={styles.cardHeading}>
            All submissions ({subs.length})
          </p>
          {subs.length === 0 ? (
            <p style={styles.noSubs}>No submissions yet.</p>
          ) : (
            <ul style={styles.subsList}>
              {subs.map(s => (
                <li key={s.id} style={styles.subItem}>
                  <span style={styles.subTitle}>{s.title}</span>
                  <div style={styles.subRight}>
                    {s.submitted_at && (
                      <span style={styles.subDate}>{formatDate(s.submitted_at)}</span>
                    )}
                    <span style={{ ...styles.statusPill, ...statusColors(s.status) }}>
                      {statusLabel(s.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
    maxWidth: 'var(--container-md)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  back: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    alignSelf: 'flex-start' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--space-4)',
    flexWrap: 'wrap' as const,
  },
  displayName: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    margin: 0,
  },
  username: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    margin: 'var(--space-1) 0 0',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    flexShrink: 0,
  },
  ageBandPill: {
    padding: 'var(--space-1) var(--space-3)',
    background: 'var(--color-primary-surface)',
    color: 'var(--color-primary)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
  },
  joined: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  cardHeading: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: 0,
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  editLink: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-medium)',
    textDecoration: 'none',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-4)',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
    alignItems: 'center',
    textAlign: 'center' as const,
    padding: 'var(--space-3)',
    background: 'var(--color-background)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
  },
  statValue: {
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  statLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  dl: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
  },
  dlRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 'var(--space-4)',
    alignItems: 'baseline',
  },
  dt: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
  dd: {
    margin: 0,
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    textAlign: 'right' as const,
  },
  ddYes: { color: 'var(--color-success)' },
  ddNo:  { color: 'var(--color-text-muted)' },
  badgeList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  badgeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-2) var(--space-3)',
    background: 'var(--color-background)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
  },
  badgeSlug: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    fontWeight: 'var(--font-medium)',
    textTransform: 'capitalize' as const,
  },
  badgeDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap' as const,
  },
  noSubs: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
  subsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  subItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--color-background)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
  },
  subTitle: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    fontWeight: 'var(--font-medium)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1,
  },
  subRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    flexShrink: 0,
  },
  subDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap' as const,
  },
  statusPill: {
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
  },
} as const
