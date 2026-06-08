import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Single source of truth for the impact-bar column set. Both the public
 * /impact page and the youth dashboard render the same ImpactJourneyBar,
 * so they share this helper rather than duplicating the select-list and
 * the type cast around the (not-yet-regenerated) Database['impact_campaigns']
 * types.
 *
 * "Active campaign" = the first row with is_active = true, ordered by
 * sort_order ascending — same convention as the admin page and the existing
 * public list query.
 */
export type ActiveImpactCampaign = {
  id:             string
  slug:           string
  title:          string
  goal_cents:     number
  raised_cents:   number
  recipient_name: string | null
  gear_summary:   string | null
}

export async function fetchActiveImpactCampaign(
  supabase: SupabaseClient<Database>,
): Promise<ActiveImpactCampaign | null> {
  // types/database.ts has not yet been regenerated to include goal_cents,
  // raised_cents, recipient_name, gear_summary. Cast through `any` until the
  // next generation pass — same pattern used for audit_events writes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('impact_campaigns')
    .select('id, slug, title, goal_cents, raised_cents, recipient_name, gear_summary')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  return {
    id:             String(data.id),
    slug:           String(data.slug),
    title:          String(data.title),
    goal_cents:     Number(data.goal_cents ?? 0),
    raised_cents:   Number(data.raised_cents ?? 0),
    recipient_name: data.recipient_name ?? null,
    gear_summary:   data.gear_summary ?? null,
  }
}
