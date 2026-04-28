import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Leaderboards' }

type LeaderboardRow = {
  user_id: string
  display_name: string
  username: string
  creator_level: number
  creator_score: number
}

type MyProfile = {
  user_id: string
  creator_score: number
  username: string
  is_profile_public: boolean
}

type ClubRow      = { id: string; name: string; slug: string }
type MembershipRow = { club_id: string; user_id: string }
type MemberScore  = { user_id: string; creator_score: number }

type ClubStanding = {
  id: string
  name: string
  slug: string
  totalScore: number
  memberCount: number
}

export default async function LeaderboardsPage() {
  const supabase = await createClient()
  const service  = createServiceClient()

  // Optional auth — no redirect, public page. User null means anonymous visitor.
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch individual top-50, own profile, active clubs, and active memberships
  // all in parallel. Club queries use the service client so every active member
  // contributes to their club's score regardless of is_profile_public.
  const [rowsResult, mineResult, clubsResult, membershipsResult] = await Promise.all([
    supabase
      .from('youth_profiles')
      .select('user_id, display_name, username, creator_level, creator_score')
      .eq('is_profile_public', true)
      .order('creator_score', { ascending: false })
      .order('username', { ascending: true })
      .limit(50),
    user
      ? supabase
          .from('youth_profiles')
          .select('user_id, creator_score, username, is_profile_public')
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    service
      .from('clubs')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    service
      .from('club_memberships')
      .select('club_id, user_id')
      .eq('is_active', true),
  ])

  const rows = (rowsResult.data ?? []) as LeaderboardRow[]
  const mine = mineResult.data as MyProfile | null

  const clubs       = (clubsResult.data       ?? []) as ClubRow[]
  const memberships = (membershipsResult.data  ?? []) as MembershipRow[]

  // ── Viewer rank + club member scores in parallel ───────────────
  // If viewer is public but outside top 50, we compute their rank via
  // two HEAD queries. Simultaneously, if there are club memberships,
  // we fetch creator_scores for all active members so we can aggregate
  // per-club totals. Both paths are optional; we run them together.

  const memberUserIds = [...new Set(memberships.map(m => m.user_id))]

  // Determine viewer rank only when their profile is public.
  // If private, they are not on the leaderboard and no rank is shown.
  let viewerRank: number | null = null
  let viewerInTop50 = false
  let memberScores: MemberScore[] = []

  const needsRankQuery = mine?.is_profile_public
  const topIdx = needsRankQuery ? rows.findIndex(r => r.user_id === mine!.user_id) : -1

  if (needsRankQuery && topIdx >= 0) {
    viewerRank = topIdx + 1
    viewerInTop50 = true
  }

  // Run rank queries and member-score fetch in parallel.
  // Compute rank using two parallel HEAD queries rather than a nested OR
  // expression, to avoid relying on PostgREST nested logical operator syntax.
  // Rank = (profiles with higher score) + (profiles tied in score but with an
  // alphabetically earlier username) + 1. This matches the list ordering exactly.
  const rankNeeded = needsRankQuery && topIdx < 0

  const [higherResult, tiedAheadResult, scoresResult] = await Promise.all([
    rankNeeded
      ? supabase
          .from('youth_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_profile_public', true)
          .gt('creator_score', mine!.creator_score)
      : Promise.resolve({ count: null }),
    rankNeeded
      ? supabase
          .from('youth_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_profile_public', true)
          .eq('creator_score', mine!.creator_score)
          .lt('username', mine!.username)
      : Promise.resolve({ count: null }),
    memberUserIds.length > 0
      ? service
          .from('youth_profiles')
          .select('user_id, creator_score')
          .in('user_id', memberUserIds)
      : Promise.resolve({ data: [] }),
  ])

  if (rankNeeded) {
    viewerRank = (higherResult.count ?? 0) + (tiedAheadResult.count ?? 0) + 1
  }

  memberScores = (scoresResult.data ?? []) as MemberScore[]

  // ── Aggregate club standings ───────────────────────────────────
  // Sum creator_scores for all active members per club.
  // Private profiles are included (we use service client) because the
  // aggregate hides individual scores — only the club total is shown.

  const scoreMap = new Map(memberScores.map(p => [p.user_id, p.creator_score]))

  const clubStandings: ClubStanding[] = clubs
    .map(club => {
      const clubMembers = memberships.filter(m => m.club_id === club.id)
      const totalScore  = clubMembers.reduce(
        (sum, m) => sum + (scoreMap.get(m.user_id) ?? 0), 0
      )
      return { ...club, totalScore, memberCount: clubMembers.length }
    })
    .filter(c => c.memberCount > 0)          // hide empty clubs
    .sort((a, b) => b.totalScore - a.totalScore)

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={styles.header}>
          <h1 style={styles.heading}>Leaderboards</h1>
          <p style={styles.sub}>Top creators and club standings</p>
        </div>

        {/* ── List ──────────────────────────────────────────── */}
        {rows.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyHeading}>No creators yet</p>
            <p style={styles.emptyText}>
              Have a submission published to appear on the leaderboard.
            </p>
          </div>
        ) : (
          <ol style={styles.list}>
            {rows.map((row, i) => {
              const rank = i + 1
              const isViewer = row.user_id === mine?.user_id
              return (
                <li
                  key={row.user_id}
                  style={isViewer
                    ? { ...styles.item, ...styles.itemViewer }
                    : styles.item
                  }
                >
                  <span style={rank <= 3
                    ? { ...styles.rank, ...styles.rankTop }
                    : styles.rank
                  }>
                    {rank}
                  </span>

                  <div style={styles.identity}>
                    <Link href={`/profile/${row.username}`} style={styles.displayName}>
                      {row.display_name}
                    </Link>
                    <span style={styles.username}>@{row.username}</span>
                  </div>

                  <div style={styles.right}>
                    <span style={isViewer
                      ? { ...styles.levelBadge, ...styles.levelBadgeViewer }
                      : styles.levelBadge
                    }>
                      Level {row.creator_level}
                    </span>
                    <span style={styles.score}>
                      {row.creator_score.toLocaleString()} pts
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        {/* ── Viewer rank footer ─────────────────────────────── */}
        {/* Shown only when the logged-in user is public but outside the top 50 */}
        {viewerRank !== null && !viewerInTop50 && (
          <div style={styles.myRankCard}>
            <div>
              <p style={styles.myRankLabel}>Your rank</p>
              <p style={styles.myRankHint}>
                Keep submitting to climb the leaderboard.
              </p>
            </div>
            <span style={styles.myRankNumber}>#{viewerRank}</span>
          </div>
        )}

        {/* ── Club standings ─────────────────────────────────── */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionHeading}>Club standings</h2>
          <p style={styles.sectionSub}>
            Ranked by total creator score across all active members.
          </p>
        </div>

        {clubStandings.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyHeading}>No club activity yet</p>
            <p style={styles.emptyText}>
              Club standings appear once members start earning creator scores.
            </p>
          </div>
        ) : (
          <ol style={styles.list}>
            {clubStandings.map((club, i) => {
              const rank = i + 1
              return (
                <li key={club.id} style={styles.item}>
                  <span style={rank <= 3
                    ? { ...styles.rank, ...styles.rankTop }
                    : styles.rank
                  }>
                    {rank}
                  </span>

                  <div style={styles.identity}>
                    <Link href={`/clubs/${club.slug}`} style={styles.displayName}>
                      {club.name}
                    </Link>
                    <span style={styles.username}>
                      {club.memberCount === 1
                        ? '1 active member'
                        : `${club.memberCount} active members`}
                    </span>
                  </div>

                  <div style={styles.right}>
                    <span style={styles.score}>
                      {club.totalScore.toLocaleString()} pts
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-background)',
    padding: 'var(--space-10) var(--space-6)',
  },
  container: {
    maxWidth: 'var(--container-md)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-8)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  heading: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
  },
  sub: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  empty: {
    padding: 'var(--space-16)',
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
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-4) var(--space-5)',
  },
  itemViewer: {
    background: 'var(--color-primary-surface)',
    borderColor: 'var(--color-primary)',
  },
  rank: {
    width: 32,
    flexShrink: 0,
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text-muted)',
    textAlign: 'right' as const,
    fontVariantNumeric: 'tabular-nums',
  },
  rankTop: {
    color: 'var(--color-accent)',
  },
  identity: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
  },
  displayName: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  username: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  right: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: 'var(--space-1)',
    flexShrink: 0,
  },
  levelBadge: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-primary)',
    background: 'var(--color-primary-surface)',
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-sm)',
  },
  levelBadgeViewer: {
    background: 'var(--color-surface)',
  },
  score: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    fontVariantNumeric: 'tabular-nums',
  },
  myRankCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
    background: 'var(--color-primary-surface)',
    border: '1px solid var(--color-primary)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-4) var(--space-5)',
  },
  myRankLabel: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-primary)',
  },
  myRankHint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
    marginTop: 'var(--space-1)',
  },
  myRankNumber: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-primary)',
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  },
  sectionHeader: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--color-border)',
  },
  sectionHeading: {
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  sectionSub: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
} as const
