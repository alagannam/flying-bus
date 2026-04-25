import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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

export default async function LeaderboardsPage() {
  const supabase = await createClient()

  // Optional auth — no redirect, public page. User null means anonymous visitor.
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch top 50 and own profile in parallel.
  // Own profile only fetched when logged in; anon client with user session means
  // the youth_profiles_select_own RLS policy applies, so they can read their
  // own row even when is_profile_public = false.
  const [rowsResult, mineResult] = await Promise.all([
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
  ])

  const rows = (rowsResult.data ?? []) as LeaderboardRow[]
  const mine = mineResult.data as MyProfile | null

  // Determine viewer rank only when their profile is public.
  // If private, they are not on the leaderboard and no rank is shown.
  let viewerRank: number | null = null
  let viewerInTop50 = false

  if (mine?.is_profile_public) {
    const topIdx = rows.findIndex(r => r.user_id === mine.user_id)

    if (topIdx >= 0) {
      viewerRank = topIdx + 1
      viewerInTop50 = true
    } else {
      // Compute rank using two parallel HEAD queries rather than a nested OR
      // expression, to avoid relying on PostgREST nested logical operator syntax.
      // Rank = (profiles with higher score) + (profiles tied in score but with an
      // alphabetically earlier username) + 1. This matches the list ordering exactly.
      const [higherResult, tiedAheadResult] = await Promise.all([
        supabase
          .from('youth_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_profile_public', true)
          .gt('creator_score', mine.creator_score),
        supabase
          .from('youth_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_profile_public', true)
          .eq('creator_score', mine.creator_score)
          .lt('username', mine.username),
      ])
      viewerRank = (higherResult.count ?? 0) + (tiedAheadResult.count ?? 0) + 1
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={styles.header}>
          <h1 style={styles.heading}>Leaderboards</h1>
          <p style={styles.sub}>Top creators by score</p>
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
} as const
