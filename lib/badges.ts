import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type BadgeCriteriaType =
  | 'submissions_published'
  | 'creator_score'
  | 'streak_current'
  | 'coins_balance'
  | 'manual'

type BadgeDef = {
  slug: string
  criteria_type: string
  threshold: number | null
}

// Checks which badges the user has earned for the given criteria types and
// inserts any that are newly qualified. Fully idempotent — the UNIQUE
// (user_id, badge_slug) constraint means duplicate awards are silently skipped.
//
// Call sites:
//   approveSubmission → ['submissions_published', 'creator_score', 'coins_balance']
//   createAndSubmit   → ['streak_current']
//
// Must be called with a service-role client. Badge inserts bypass RLS.
// Does not award 'manual' badges — those are admin-only.

export async function checkAndAwardBadges(
  userId: string,
  supabase: SupabaseClient<Database>,
  criteriaTypes: BadgeCriteriaType[],
): Promise<void> {
  // Fetch only the badge definitions relevant to this event, excluding manual.
  const { data: rawDefs } = await supabase
    .from('badge_definitions')
    .select('slug, criteria_type, threshold')
    .in('criteria_type', criteriaTypes)
    .not('threshold', 'is', null)

  const defs = (rawDefs ?? []) as BadgeDef[]
  if (defs.length === 0) return

  // Determine which stat groups we actually need to fetch.
  const needsProfile = criteriaTypes.some(t =>
    t === 'creator_score' || t === 'coins_balance' || t === 'streak_current'
  )
  const needsSubCount = criteriaTypes.includes('submissions_published')

  let profileStats: {
    creator_score: number
    coins_balance: number
    streak_current: number
  } | null = null
  let subCount = 0

  // Single profile read covers creator_score, coins_balance, and streak_current.
  // Runs after all score/coin updates have committed so values are fresh.
  if (needsProfile) {
    const { data } = await supabase
      .from('youth_profiles')
      .select('creator_score, coins_balance, streak_current')
      .eq('user_id', userId)
      .single()
    profileStats = data as typeof profileStats
  }

  if (needsSubCount) {
    const { count } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('youth_user_id', userId)
      .eq('status', 'published')
    subCount = count ?? 0
  }

  function statFor(type: string): number {
    switch (type) {
      case 'creator_score':         return profileStats?.creator_score  ?? 0
      case 'coins_balance':         return profileStats?.coins_balance   ?? 0
      case 'streak_current':        return profileStats?.streak_current  ?? 0
      case 'submissions_published': return subCount
      default:                      return 0
    }
  }

  const earned = defs.filter(
    d => d.threshold !== null && statFor(d.criteria_type) >= d.threshold
  )
  if (earned.length === 0) return

  // Insert earned badges. ON CONFLICT DO NOTHING via ignoreDuplicates — the
  // UNIQUE (user_id, badge_slug) constraint is the authoritative safety net.
  await supabase
    .from('youth_badges')
    .upsert(
      earned.map(d => ({ user_id: userId, badge_slug: d.slug })),
      { onConflict: 'user_id,badge_slug', ignoreDuplicates: true },
    )
}
