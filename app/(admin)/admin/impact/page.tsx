import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Impact' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// Same shape and rules as the public /impact page and admin /admin/challenges:
// both dates → "Mar 1, 2026 – Mar 31, 2026"
// only starts_at → "Starts Mar 1, 2026"
// only ends_at   → "Ends Mar 31, 2026"
// neither       → null (renders an em-dash)
function dateRange(starts_at: string | null, ends_at: string | null): string | null {
  if (!starts_at && !ends_at) return null
  if (starts_at && ends_at) return `${formatDate(starts_at)} – ${formatDate(ends_at)}`
  if (starts_at) return `Starts ${formatDate(starts_at)}`
  return `Ends ${formatDate(ends_at!)}`
}

type CampaignRow = {
  id:           string
  slug:         string
  title:        string
  goal_summary: string | null
  starts_at:    string | null
  ends_at:      string | null
  is_active:    boolean
  sort_order:   number
}

export default async function AdminImpactPage() {
  const service = createServiceClient()

  // Service-role read — impact_campaigns has a public SELECT policy scoped
  // to is_active = true, so the anon client would hide inactive rows that
  // admins need to see. Service-role returns the full set.
  const { data: rawCampaigns } = await service
    .from('impact_campaigns')
    .select('id, slug, title, goal_summary, starts_at, ends_at, is_active, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const campaigns   = (rawCampaigns ?? []) as CampaignRow[]
  const activeCount = campaigns.filter(c => c.is_active).length
  const totalCount  = campaigns.length

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Page header ───────────────────────────────────── */}
        <div style={styles.pageHeader}>
          <h1 style={styles.heading}>Impact</h1>
          <p style={styles.sub}>Read-only view of all impact campaigns, active and inactive.</p>
        </div>

        {/* ── Campaigns table ───────────────────────────────── */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <p style={styles.sectionTitle}>All campaigns</p>
            <span style={styles.sectionCount}>{activeCount} active</span>
            <span style={styles.sectionCount}>{totalCount} total</span>
          </div>

          {campaigns.length === 0 ? (
            <p style={styles.empty}>No campaigns yet.</p>
          ) : (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Title</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Slug</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Goal</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Dates</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Status</th>
                    <th style={{ ...styles.th, ...styles.thRight }}>Sort order</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(campaign => {
                    const range = dateRange(campaign.starts_at, campaign.ends_at)
                    return (
                      <tr
                        key={campaign.id}
                        style={campaign.is_active ? styles.tr : { ...styles.tr, opacity: 0.5 }}
                      >
                        <td style={{ ...styles.td, fontWeight: 'var(--font-medium)' }}>
                          {campaign.title}
                        </td>
                        <td style={{ ...styles.td, ...styles.mono }}>
                          {campaign.slug}
                        </td>
                        <td style={styles.td}>
                          {campaign.goal_summary ?? <span style={styles.muted}>—</span>}
                        </td>
                        <td style={styles.td}>
                          {range ?? <span style={styles.muted}>—</span>}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.pill,
                            background: campaign.is_active
                              ? 'var(--color-success-surface)'
                              : 'var(--color-surface)',
                            color: campaign.is_active
                              ? 'var(--color-success)'
                              : 'var(--color-text-muted)',
                          }}>
                            {campaign.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ ...styles.td, ...styles.tdRight }}>
                          {campaign.sort_order}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

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

  // ── Header ────────────────────────────────────────────────────────
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

  // ── Section ───────────────────────────────────────────────────────
  section: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-4)',
  },
  sectionHeader: {
    display:       'flex',
    alignItems:    'center',
    gap:           'var(--space-3)',
    borderBottom:  '1px solid var(--color-border)',
    paddingBottom: 'var(--space-3)',
  },
  sectionTitle: {
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
    margin:     0,
  },
  sectionCount: {
    fontSize:     'var(--text-xs)',
    fontWeight:   'var(--font-medium)',
    color:        'var(--color-text-muted)',
    background:   'var(--color-surface)',
    border:       '1px solid var(--color-border)',
    borderRadius: 'var(--radius-full)',
    padding:      '1px var(--space-2)',
  },
  empty: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
    padding:  'var(--space-6) 0',
    margin:   0,
  },

  // ── Table ─────────────────────────────────────────────────────────
  tableScroll: {
    overflowX:    'auto' as const,
    borderRadius: 'var(--radius-lg)',
    border:       '1px solid var(--color-border)',
  },
  table: {
    width:          '100%',
    borderCollapse: 'collapse' as const,
    background:     'var(--color-surface)',
    fontSize:       'var(--text-sm)',
  },
  th: {
    padding:       'var(--space-3) var(--space-4)',
    fontSize:      'var(--text-xs)',
    fontWeight:    'var(--font-semibold)',
    color:         'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    background:    'var(--color-surface)',
    borderBottom:  '1px solid var(--color-border)',
    whiteSpace:    'nowrap' as const,
  },
  thLeft:  { textAlign: 'left'  as const },
  thRight: { textAlign: 'right' as const },
  tr: {
    borderBottom: '1px solid var(--color-border)',
  },
  td: {
    padding:       'var(--space-3) var(--space-4)',
    color:         'var(--color-text)',
    verticalAlign: 'middle' as const,
  },
  tdRight: {
    textAlign:          'right' as const,
    fontVariantNumeric: 'tabular-nums',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize:   'var(--text-xs)',
    color:      'var(--color-text-secondary)',
  },
  muted: {
    color:    'var(--color-text-muted)',
    fontSize: 'var(--text-xs)',
  },

  // ── Status pill ───────────────────────────────────────────────────
  pill: {
    display:      'inline-block',
    padding:      '2px var(--space-2)',
    borderRadius: 'var(--radius-full)',
    fontSize:     'var(--text-xs)',
    fontWeight:   'var(--font-semibold)',
    whiteSpace:   'nowrap' as const,
  },
} as const
