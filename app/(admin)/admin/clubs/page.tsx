import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Clubs' }

const AGE_BAND_LABELS: Record<string, string> = {
  '8-10':  'Ages 8–10',
  '11-13': 'Ages 11–13',
  '14-18': 'Ages 14–18',
}

type ClubRow = {
  id:         string
  name:       string
  slug:       string
  age_bands:  string[] | null
  is_active:  boolean
  sort_order: number
}

export default async function AdminClubsPage() {
  const service = createServiceClient()

  // Service-role read — clubs has a public SELECT policy for active rows
  // only, so the anon client would hide inactive clubs that admins need
  // to see. Service-role returns all rows regardless of is_active.
  const { data: rawClubs } = await service
    .from('clubs')
    .select('id, name, slug, age_bands, is_active, sort_order, created_at')
    .order('sort_order',  { ascending: true })
    .order('created_at',  { ascending: false })

  const clubs       = (rawClubs ?? []) as ClubRow[]
  const activeCount = clubs.filter(c => c.is_active).length
  const totalCount  = clubs.length

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Page header ───────────────────────────────────── */}
        <div style={styles.pageHeader}>
          <h1 style={styles.heading}>Clubs</h1>
          <p style={styles.sub}>Read-only view of all clubs, active and inactive.</p>
        </div>

        {/* ── Clubs table ───────────────────────────────────── */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <p style={styles.sectionTitle}>All clubs</p>
            <span style={styles.sectionCount}>{activeCount} active</span>
            <span style={styles.sectionCount}>{totalCount} total</span>
          </div>

          {clubs.length === 0 ? (
            <p style={styles.empty}>No clubs yet.</p>
          ) : (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Name</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Slug</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Age bands</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Status</th>
                    <th style={{ ...styles.th, ...styles.thRight }}>Sort order</th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map(club => (
                    <tr
                      key={club.id}
                      style={club.is_active ? styles.tr : { ...styles.tr, opacity: 0.5 }}
                    >
                      <td style={{ ...styles.td, fontWeight: 'var(--font-medium)' }}>
                        {club.name}
                      </td>
                      <td style={{ ...styles.td, ...styles.mono }}>
                        {club.slug}
                      </td>
                      <td style={styles.td}>
                        {(club.age_bands ?? []).length > 0 ? (
                          <div style={styles.ageBands}>
                            {(club.age_bands ?? []).map(band => (
                              <span key={band} style={styles.ageBadge}>
                                {AGE_BAND_LABELS[band] ?? band}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={styles.muted}>—</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.pill,
                          background: club.is_active
                            ? 'var(--color-success-surface)'
                            : 'var(--color-surface)',
                          color: club.is_active
                            ? 'var(--color-success)'
                            : 'var(--color-text-muted)',
                        }}>
                          {club.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ ...styles.td, ...styles.tdRight }}>
                        {club.sort_order}
                      </td>
                    </tr>
                  ))}
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

  // ── Age band pills ────────────────────────────────────────────────
  ageBands: {
    display:  'flex',
    gap:      'var(--space-2)',
    flexWrap: 'wrap' as const,
  },
  ageBadge: {
    padding:      '2px var(--space-2)',
    background:   'var(--color-primary-surface)',
    color:        'var(--color-primary)',
    borderRadius: 'var(--radius-sm)',
    fontSize:     'var(--text-xs)',
    fontWeight:   'var(--font-semibold)',
    whiteSpace:   'nowrap' as const,
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
