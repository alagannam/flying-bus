import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fetchActiveImpactCampaign } from '@/lib/impact'
import { ImpactJourneyBar } from '@/components/ui/ImpactJourneyBar'

export const dynamic = 'force-dynamic'
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

// Level thresholds mirror the increment_creator_score RPC in migration 009
// (Level 1→2: 50, 2→3: 150, 3→4: 300, 4→5: 500). Keep these in sync if the
// DB function ever changes — they're the single source of truth for level math.
const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 50,
  2: 150,
  3: 300,
  4: 500,
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

// Calendar-day difference between now and endsAt.
// null if endsAt is null or already past.
function daysRemaining(endsAt: string | null): string | null {
  if (!endsAt) return null
  const end = new Date(endsAt)
  const now = new Date()
  if (end.getTime() < now.getTime()) return null

  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((endDay.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24))

  if (days <= 0) return 'Ends today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

function pointsToNextLevel(currentLevel: number, score: number): number {
  const next = LEVEL_THRESHOLDS[currentLevel]
  if (next == null) return 0
  return Math.max(0, next - score)
}

type Profile = {
  display_name: string
  creator_level: number
  coins_balance: number
  creator_score: number
  streak_current: number
}

type RecentSub = {
  id: string
  title: string
  status: SubmissionStatus
  created_at: string
  submitted_at: string | null
  published_at: string | null
}

type RecentNotif = {
  id: string
  title: string
  body: string | null
  created_at: string
}

type ActiveChallenge = {
  id: string
  slug: string
  title: string
  description: string | null
  category: string | null
  starts_at: string | null
  ends_at: string | null
}

type MembershipRow = {
  club_id: string
  clubs: {
    id:          string
    name:        string
    slug:        string
    description: string
    is_active:   boolean
  } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const service  = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, subsResult, notifsResult, challengeResult, membershipsResult, activeCampaign] = await Promise.all([
    supabase
      .from('youth_profiles')
      .select('display_name, creator_level, coins_balance, creator_score, streak_current')
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
      .select('id, title, body, created_at')
      .eq('user_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(3),

    service
      .from('challenges')
      .select('id, slug, title, description, category, starts_at, ends_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('club_memberships')
      .select('club_id, clubs(id, name, slug, description, is_active)')
      .eq('user_id', user.id)
      .eq('is_active', true),

    fetchActiveImpactCampaign(supabase),
  ])

  if (!profileResult.data) redirect('/login')

  const profile         = profileResult.data as Profile
  const recentSubs      = (subsResult.data   ?? []) as RecentSub[]
  const recentNotifs    = (notifsResult.data ?? []) as RecentNotif[]
  const activeChallenge = (challengeResult.data ?? null) as ActiveChallenge | null

  const memberships = (membershipsResult.data ?? []) as unknown as MembershipRow[]
  const myClubs = memberships
    .map(m => m.clubs)
    .filter((c): c is NonNullable<MembershipRow['clubs']> => c !== null && c.is_active)
  const visibleClubs = myClubs.slice(0, 5)
  const extraClubsCount = Math.max(0, myClubs.length - 5)

  const daysLeft    = activeChallenge ? daysRemaining(activeChallenge.ends_at) : null
  const pointsToNext = pointsToNextLevel(profile.creator_level, profile.creator_score)

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Greeting ──────────────────────────────────────── */}
        <div style={styles.greeting}>
          <div>
            <h1 style={styles.greetingName}>
              Welcome back, {profile.display_name}
            </h1>
            {profile.streak_current > 1 && (
              <p style={styles.streakLine}>
                🔥 {profile.streak_current}-day streak — keep it going!
              </p>
            )}
          </div>
          <span style={styles.levelBadge}>Level {profile.creator_level}</span>
        </div>

        {/* ── Active challenge ──────────────────────────────── */}
        {activeChallenge ? (
          <div style={styles.challengeCard}>
            {activeChallenge.category && (
              <p style={styles.challengeCategory}>
                {activeChallenge.category.replace(/-/g, ' ')}
              </p>
            )}
            <p style={styles.challengeTitle}>{activeChallenge.title}</p>
            {activeChallenge.description && (
              <p style={styles.challengeDesc}>{activeChallenge.description}</p>
            )}
            {daysLeft && (
              <span style={styles.daysBadge}>{daysLeft}</span>
            )}
            <div style={styles.challengeCtaRow}>
              <Link
                href={`/studio/new?challenge_id=${activeChallenge.id}&challenge_slug=${activeChallenge.slug}`}
                style={styles.challengePrimary}
              >
                Enter this challenge →
              </Link>
              <Link href="/challenges" style={styles.challengeSecondary}>
                See all challenges
              </Link>
            </div>
          </div>
        ) : (
          <div style={styles.challengeEmpty}>
            <p style={styles.emptyText}>No active challenge right now — check back soon</p>
          </div>
        )}

        {/* ── Stats strip ───────────────────────────────────── */}
        <div style={styles.statsStrip}>
          <div style={styles.statCard}>
            <span style={styles.statEmoji}>🪙</span>
            <p style={styles.statValue}>{profile.coins_balance.toLocaleString()}</p>
            <p style={styles.statLabel}>Kana Coins</p>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statEmoji}>⭐</span>
            <p style={styles.statValue}>{profile.creator_score.toLocaleString()}</p>
            <p style={styles.statLabel}>Creator score</p>
            {pointsToNext > 0 && (
              <p style={styles.statSubLabel}>
                {pointsToNext} to Level {profile.creator_level + 1}
              </p>
            )}
          </div>
          <div style={styles.statCard}>
            <span style={styles.statEmoji}>🔥</span>
            <p style={styles.statValue}>{profile.streak_current}</p>
            <p style={styles.statLabel}>Day streak</p>
          </div>
        </div>

        {/* ── Impact journey ────────────────────────────────── */}
        {activeCampaign && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Impact journey</h2>
              <Link href="/impact" style={styles.sectionLink}>See impact →</Link>
            </div>
            <ImpactJourneyBar
              title={activeCampaign.title}
              goal_cents={activeCampaign.goal_cents}
              raised_cents={activeCampaign.raised_cents}
              recipient_name={activeCampaign.recipient_name}
              gear_summary={activeCampaign.gear_summary}
            />
          </div>
        )}

        {/* ── My Clubs ──────────────────────────────────────── */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>My Clubs</h2>
            <Link href="/my-clubs" style={styles.sectionLink}>See all →</Link>
          </div>

          {myClubs.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyText}>
                You haven&apos;t joined any clubs yet.{' '}
                <Link href="/clubs" style={styles.emptyLink}>Browse clubs →</Link>
              </p>
            </div>
          ) : (
            <div style={styles.clubsScroll}>
              {visibleClubs.map(club => (
                <Link key={club.id} href={`/clubs/${club.slug}`} style={styles.clubPill}>
                  {club.name}
                </Link>
              ))}
              {extraClubsCount > 0 && (
                <Link href="/my-clubs" style={styles.moreClubsPill}>
                  +{extraClubsCount} more
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Recent notifications ──────────────────────────── */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Notifications</h2>
            <Link href="/notifications" style={styles.sectionLink}>See all →</Link>
          </div>

          {recentNotifs.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyText}>No unread notifications.</p>
            </div>
          ) : (
            <ul style={styles.notifList}>
              {recentNotifs.map(n => (
                <li key={n.id}>
                  <Link href="/notifications" style={styles.notifCard}>
                    <div style={styles.notifMain}>
                      <span style={styles.notifTitle}>{n.title}</span>
                      {n.body && (
                        <span style={styles.notifBody}>{n.body}</span>
                      )}
                    </div>
                    <span style={styles.notifDate}>{formatDate(n.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Recent submissions ────────────────────────────── */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Your submissions</h2>
            <Link href="/my-submissions" style={styles.sectionLink}>See all →</Link>
          </div>

          {recentSubs.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyText}>
                Nothing submitted yet.{' '}
                <Link href="/studio/new" style={styles.emptyLink}>
                  Create your first submission →
                </Link>
              </p>
            </div>
          ) : (
            <ul style={styles.subList}>
              {recentSubs.map(s => {
                const statusKey = (s.status in STATUS_LABELS ? s.status : 'draft') as SubmissionStatus
                const badge = STATUS_COLORS[statusKey]
                const inner = (
                  <>
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
                  </>
                )

                return (
                  <li key={s.id}>
                    {s.status === 'published' ? (
                      <Link href={`/submissions/${s.id}`} style={styles.subCard}>
                        {inner}
                      </Link>
                    ) : (
                      <div style={styles.subCardStatic}>
                        {inner}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ── Quick actions ─────────────────────────────────── */}
        <div style={styles.quickLinks}>
          <Link href="/studio/new" style={styles.quickPrimary}>+ New submission</Link>
          <Link href="/shop" style={styles.quickSecondary}>Shop</Link>
          <Link href="/challenges" style={styles.quickSecondary}>Challenges</Link>
        </div>

      </div>
    </div>
  )
}

const subCardBase = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--space-4)',
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  padding: 'var(--space-4) var(--space-5)',
} as const

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

  // ── Greeting ────────────────────────────────────────────────
  greeting: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--space-4)',
    flexWrap: 'wrap' as const,
  },
  greetingName: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-snug)',
  },
  streakLine: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    marginTop: 'var(--space-1)',
  },
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

  // ── Active challenge ────────────────────────────────────────
  challengeCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderLeft: '3px solid var(--color-primary)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-5) var(--space-6)',
  },
  challengeCategory: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: 0,
  },
  challengeTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    margin: 0,
  },
  challengeDesc: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin: 0,
  },
  daysBadge: {
    alignSelf: 'flex-start' as const,
    padding: '2px var(--space-2)',
    background: 'var(--color-warning-surface)',
    color: 'var(--color-warning)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
  },
  challengeCtaRow: {
    display: 'flex',
    gap: 'var(--space-3)',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    marginTop: 'var(--space-2)',
  },
  challengePrimary: {
    padding: 'var(--space-2) var(--space-4)',
    background: 'var(--color-primary)',
    color: '#fff',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    textDecoration: 'none',
  },
  challengeSecondary: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    fontWeight: 'var(--font-medium)',
  },
  challengeEmpty: {
    background: 'var(--color-surface)',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-5) var(--space-6)',
    textAlign: 'center' as const,
  },

  // ── Stats strip ─────────────────────────────────────────────
  statsStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 'var(--space-3)',
  },
  statCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-4) var(--space-5)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
  },
  statEmoji: { fontSize: 'var(--text-xl)', lineHeight: 1 },
  statValue: {
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 1,
    marginTop: 'var(--space-2)',
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  statSubLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-semibold)',
    marginTop: 'var(--space-1)',
  },

  // ── My Clubs pills ─────────────────────────────────────────
  clubsScroll: {
    display: 'flex',
    flexWrap: 'nowrap' as const,
    overflowX: 'auto' as const,
    gap: 'var(--space-2)',
    paddingBottom: 'var(--space-2)',
  },
  clubPill: {
    flexShrink: 0,
    background: 'var(--color-primary-surface)',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-primary)',
    borderRadius: 'var(--radius-full)',
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
  },
  moreClubsPill: {
    flexShrink: 0,
    background: 'var(--color-surface)',
    color: 'var(--color-text-muted)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-full)',
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
  },

  // ── Sections ─────────────────────────────────────────────────
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
    padding: 'var(--space-8)',
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  emptyLink: {
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-medium)',
    textDecoration: 'none',
  },

  // ── Notifications ────────────────────────────────────────────
  notifList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  notifCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--space-4)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    borderLeft: '3px solid var(--color-primary)',
    padding: 'var(--space-4) var(--space-5)',
    textDecoration: 'none',
  },
  notifMain: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
    minWidth: 0,
    flex: 1,
  },
  notifTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  notifBody: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  notifDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    flexShrink: 0,
  },

  // ── Submissions ──────────────────────────────────────────────
  subList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  subCard: {
    ...subCardBase,
    textDecoration: 'none',
  },
  subCardStatic: {
    ...subCardBase,
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
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },

  // ── Quick actions ────────────────────────────────────────────
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
