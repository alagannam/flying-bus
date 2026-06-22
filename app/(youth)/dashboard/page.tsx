import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fetchActiveImpactCampaign } from '@/lib/impact'
import { ImpactJourneyBar } from '@/components/ui/ImpactJourneyBar'
import { computeWeeklyStreak } from '@/lib/streak'

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

// Deadline countdown derived server-side from endsAt.
//
// Returns null if endsAt is null. Otherwise returns either a "closed" state
// (when endsAt is in the past — shown instead of a countdown per spec) or a
// "Closes <weekday> · 2d 14h" style label. The page is dynamic = force-dynamic
// so the value is fresh on each request; we don't tick on the client.
type CountdownState =
  | { closed: true;  message: string }
  | { closed: false; label:   string }

function formatCountdown(endsAt: string | null): CountdownState | null {
  if (!endsAt) return null

  const end = new Date(endsAt)
  const now = new Date()
  if (end.getTime() <= now.getTime()) {
    return { closed: true, message: 'This mission has closed' }
  }

  const ms     = end.getTime() - now.getTime()
  const minute = 60_000
  const hour   = 60 * minute
  const day    = 24 * hour
  const days   = Math.floor(ms / day)
  const hours  = Math.floor((ms % day)  / hour)
  const mins   = Math.floor((ms % hour) / minute)

  const weekday = end.toLocaleDateString('en-US', { weekday: 'short' })

  let suffix: string
  if (days >= 1)       suffix = `${days}d ${hours}h`
  else if (hours >= 1) suffix = `${hours}h ${mins}m`
  else                 suffix = `${Math.max(1, mins)}m`

  return { closed: false, label: `Closes ${weekday} · ${suffix}` }
}

// Safety: this label is the ONLY surface for participation. We render a count
// and a tone-appropriate string — never names, never a list. 0 reads as a CTA
// rather than a discouraging "0 kids".
function participationLabel(n: number): string {
  if (n <= 0)  return 'Be the first to enter'
  if (n === 1) return '1 kid has entered'
  return `${n.toLocaleString('en-US')} kids have entered`
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

  const [profileResult, subsResult, notifsResult, challengeResult, membershipsResult, activeCampaign, streak] = await Promise.all([
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

    computeWeeklyStreak(user.id),
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

  const countdown    = activeChallenge ? formatCountdown(activeChallenge.ends_at) : null
  const pointsToNext = pointsToNextLevel(profile.creator_level, profile.creator_score)

  // Service-role count — RLS limits the anon/youth view to own + published rows
  // and would undercount. head:true returns only the integer, never row data,
  // so this stays a number-only surface (no names ever rendered).
  //
  // Allow-list rather than not-equal: a 'rejected' submission was turned away,
  // so it shouldn't inflate "kids who entered". An explicit list also prevents
  // future submission_status values from silently counting.
  let participantCount = 0
  if (activeChallenge) {
    const { count } = await service
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_id', activeChallenge.id)
      .in('status', ['pending_parent_approval', 'pending_review', 'published'])
    participantCount = count ?? 0
  }

  // The at-risk nudge is tied to the live mission's deadline, not Sunday — kids
  // think in missions, not calendar weeks. If there's no live, open mission to
  // anchor the deadline, fall back to a generic "this week" phrasing.
  function deadlineWeekday(endsAt: string | null): string | null {
    if (!endsAt) return null
    const end = new Date(endsAt)
    if (end.getTime() <= Date.now()) return null
    return end.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Los_Angeles' })
  }
  const nudgeDeadline = activeChallenge ? deadlineWeekday(activeChallenge.ends_at) : null
  const streakNudge = nudgeDeadline
    ? `Post by ${nudgeDeadline} to keep your ${streak.weeks}-week streak.`
    : `Post this week to keep your ${streak.weeks}-week streak.`

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Greeting ──────────────────────────────────────── */}
        <div style={styles.greeting}>
          <div>
            <h1 style={styles.greetingName}>
              Welcome back, {profile.display_name}
            </h1>

            {streak.weeks >= 1 && !streak.atRisk && (
              <p style={styles.streakLine}>
                <FlameIcon />
                <span style={styles.streakStrong}>
                  {streak.weeks}-week streak
                </span>
                <span style={styles.streakMuted}> — keep it going!</span>
              </p>
            )}

            {streak.weeks >= 1 && streak.atRisk && (
              <p style={styles.streakLine}>
                <FlameIcon />
                <span style={styles.streakStrong}>
                  {streak.weeks}-week streak alive
                </span>
                <span style={styles.streakMuted}> — {streakNudge}</span>
              </p>
            )}

            {streak.weeks === 0 && (
              <p style={styles.streakLine}>
                <FlameIcon dim />
                <span style={styles.streakMuted}>Start your streak this week.</span>
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

            {countdown?.closed ? (
              <p style={styles.challengeClosed}>{countdown.message}</p>
            ) : (
              <div style={styles.challengeMeta}>
                {countdown && (
                  <span style={styles.metaItem}>
                    <ClockIcon />
                    <span>{countdown.label}</span>
                  </span>
                )}
                <span style={styles.metaItem}>
                  <PeopleIcon />
                  <span>{participationLabel(participantCount)}</span>
                </span>
              </div>
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
            <p style={styles.statValue}>{streak.weeks}</p>
            <p style={styles.statLabel}>Week streak</p>
            {streak.atRisk && (
              <p style={styles.statSubLabel}>At risk this week</p>
            )}
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

// Icons are inline SVGs (no new dep). Stroke uses the brand accent violet.
const META_ACCENT = '#7C3AED'

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={META_ACCENT} strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={META_ACCENT} strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <path d="M17 11a3 3 0 1 0 0-6" />
      <path d="M21 20c0-2.6-2-4.5-4.5-4.9" />
    </svg>
  )
}

function FlameIcon({ dim = false }: { dim?: boolean } = {}) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"
      fill={dim ? '#C9C7DC' : META_ACCENT} aria-hidden="true">
      <path d="M13.5 2c0 3-2.5 4-2.5 7 0 1.5 1 2.5 2 2.5s1.5-.5 2-1.5c.5 1.5 2 2.5 2 5 0 3.5-2.5 6-5 6s-5-2.5-5-6c0-3 2-5 2-8 1 1 2 1.5 2.5 1 .5-.5.5-2-.5-3 1 0 2 .5 2.5-3z" />
    </svg>
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: 'var(--text-sm)',
    color: '#6B6A8A',
    marginTop: 'var(--space-1)',
    flexWrap: 'wrap' as const,
  },
  streakStrong: {
    fontWeight: 'var(--font-bold)',
    color: '#312E81',
  },
  streakMuted: {
    color: '#6B6A8A',
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
  challengeMeta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 'var(--space-4)',
    marginTop: 'var(--space-1)',
    alignItems: 'center',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    color: '#312E81',
  },
  challengeClosed: {
    marginTop: 'var(--space-1)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: '#6B6A8A',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: 0,
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
