import { createServiceClient } from '@/lib/supabase/server'

/**
 * Derived weekly participation streak.
 *
 * Replaces the displayed `youth_profiles.streak_current` (daily streak) with a
 * weekly bucket computed from actual `submissions` rows.
 *
 * Week boundary: Monday 00:00 → Sunday 23:59:59 in America/Los_Angeles.
 * Bucket key: ISO date of the Monday of the LA-week containing submitted_at.
 *
 * Rules:
 *   - Past weeks count if they contain >= 1 submission with status='published'.
 *   - Current week counts as soon as it contains >= 1 submission whose status is
 *     pending_parent_approval | pending_review | published (i.e. the kid acted;
 *     it may still be awaiting parent/review). 'draft' and 'rejected' never
 *     count — a draft was never submitted, and a rejected post was turned away.
 *   - Streak = consecutive counting weeks ending at this week (if it counts)
 *     or at last week (if current week not yet satisfied — "alive but at risk").
 *   - If neither this week nor last week counts → streak = 0.
 *
 * Read-only. Uses the service client and selects ONLY submitted_at + status
 * for the youth — never names or any other field.
 */
export type WeeklyStreakResult = {
  weeks:  number
  atRisk: boolean
}

const LA = 'America/Los_Angeles'

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
}

// Pull the LA wall-clock Y/M/D and weekday for a given instant. Intl handles
// DST — we never do timezone math ourselves.
function getLAYearMonthDayWeekday(d: Date): {
  year: number; month: number; day: number; weekday: number
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LA,
    year:    'numeric',
    month:   '2-digit',
    day:     '2-digit',
    weekday: 'short',
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return {
    year:    Number(get('year')),
    month:   Number(get('month')),
    day:     Number(get('day')),
    weekday: WEEKDAY_TO_INDEX[get('weekday')] ?? 0,
  }
}

// Key = ISO date (YYYY-MM-DD) of the Monday of the LA-week containing `d`.
// We build a UTC-anchored Date from the LA Y/M/D and use plain integer date
// math to step back to Monday — safe because we never read time-of-day from
// this anchor.
function laWeekStartKey(d: Date): string {
  const p = getLAYearMonthDayWeekday(d)
  const anchor = new Date(Date.UTC(p.year, p.month - 1, p.day))
  anchor.setUTCDate(anchor.getUTCDate() - (p.weekday - 1))
  return isoYmd(anchor)
}

function isoYmd(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function previousWeekKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - 7)
  return isoYmd(dt)
}

type SubRow = { submitted_at: string | null; status: string }
type Bucket = { hasPublished: boolean; hasCurrentEligible: boolean }

const CURRENT_ELIGIBLE = new Set([
  'pending_parent_approval',
  'pending_review',
  'published',
])

export async function computeWeeklyStreak(userId: string): Promise<WeeklyStreakResult> {
  const service = createServiceClient()

  const { data } = await service
    .from('submissions')
    .select('submitted_at, status')
    .eq('youth_user_id', userId)
    .not('submitted_at', 'is', null)

  const rows = (data ?? []) as SubRow[]
  if (rows.length === 0) return { weeks: 0, atRisk: false }

  const buckets = new Map<string, Bucket>()
  for (const r of rows) {
    if (!r.submitted_at) continue
    const key = laWeekStartKey(new Date(r.submitted_at))
    const b = buckets.get(key) ?? { hasPublished: false, hasCurrentEligible: false }
    if (r.status === 'published') b.hasPublished = true
    if (CURRENT_ELIGIBLE.has(r.status)) b.hasCurrentEligible = true
    buckets.set(key, b)
  }

  const thisWeek = laWeekStartKey(new Date())
  const currentSatisfied = buckets.get(thisWeek)?.hasCurrentEligible === true

  let weeks = 0
  let cursor: string

  if (currentSatisfied) {
    weeks  = 1
    cursor = previousWeekKey(thisWeek)
  } else {
    cursor = previousWeekKey(thisWeek)
  }

  // Walk backwards through consecutive PAST weeks. Past weeks use the published
  // rule — a kid who only ever posted drafts doesn't have a real streak.
  while (buckets.get(cursor)?.hasPublished) {
    weeks += 1
    cursor = previousWeekKey(cursor)
  }

  const atRisk = weeks >= 1 && !currentSatisfied
  return { weeks, atRisk }
}
