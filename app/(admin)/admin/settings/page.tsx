import { Fragment } from 'react'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Settings' }

type ConfigRow = {
  key:   string
  value: string
}

// Group key family from the first two underscore-separated segments
// (e.g. coin_earn_text_submission -> "coin_earn"). One-segment keys
// keep the full key as their own group.
function groupKey(key: string): string {
  const parts = key.split('_')
  if (parts.length >= 2) return `${parts[0]}_${parts[1]}`
  return key
}

function groupLabel(name: string): string {
  return name
    .split('_')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

type Group = { name: string; rows: ConfigRow[] }

function groupRows(rows: ConfigRow[]): Group[] {
  const groups: Group[] = []
  for (const row of rows) {
    const gk = groupKey(row.key)
    const last = groups[groups.length - 1]
    if (!last || last.name !== gk) {
      groups.push({ name: gk, rows: [row] })
    } else {
      last.rows.push(row)
    }
  }
  return groups
}

export default async function AdminSettingsPage() {
  const service = createServiceClient()

  // platform_config has an authenticated SELECT policy. Service-role is used
  // for consistency with other admin reads and to bypass the auth-only filter
  // when called from a Server Component cookie session.
  const { data: rawConfig } = await service
    .from('platform_config')
    .select('key, value')
    .order('key', { ascending: true })

  const rows   = (rawConfig ?? []) as ConfigRow[]
  const groups = groupRows(rows)
  const total  = rows.length

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Page header ───────────────────────────────────── */}
        <div style={styles.pageHeader}>
          <h1 style={styles.heading}>Settings</h1>
          <p style={styles.sub}>
            Read-only view of platform_config. Update values directly in Supabase if needed.
          </p>
        </div>

        {/* ── Settings table ─────────────────────────────────── */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <p style={styles.sectionTitle}>Platform configuration</p>
            <span style={styles.sectionCount}>{total} entries</span>
          </div>

          {groups.length === 0 ? (
            <p style={styles.empty}>No configuration entries.</p>
          ) : (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Key</th>
                    <th style={{ ...styles.th, ...styles.thRight }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(group => (
                    <Fragment key={group.name}>
                      <tr style={styles.groupRow}>
                        <td colSpan={2} style={styles.groupCell}>
                          {groupLabel(group.name)}
                        </td>
                      </tr>
                      {group.rows.map(row => (
                        <tr key={row.key} style={styles.tr}>
                          <td style={{ ...styles.td, ...styles.mono }}>
                            {row.key}
                          </td>
                          <td style={{ ...styles.td, ...styles.tdRight, ...styles.mono }}>
                            {row.value}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
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
    color:      'var(--color-text)',
  },
  groupRow: {
    background:   'var(--color-surface-raised)',
    borderBottom: '1px solid var(--color-border)',
  },
  groupCell: {
    padding:       'var(--space-2) var(--space-4)',
    fontSize:      'var(--text-xs)',
    fontWeight:    'var(--font-semibold)',
    color:         'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
} as const
