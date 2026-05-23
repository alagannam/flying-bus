import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Audit Log' }

const PAGE_LIMIT = 100

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date} ${time}`
}

function eventLabel(eventType: string) {
  return eventType.replace(/_/g, ' ')
}

function shortId(id: string) {
  return id.slice(0, 8) + '…'
}

type AuditRow = {
  id:            string
  event_type:    string
  actor_user_id: string | null
  target_type:   string | null
  target_id:     string | null
  payload:       Record<string, unknown> | null
  created_at:    string
}

export default async function AdminAuditLogPage() {
  const service = createServiceClient()

  // Latest 100. The page is read-only and shows only what's been written
  // by future event-writer retrofits — empty initially.
  const { data: rawEvents } = await service
    .from('audit_events')
    .select('id, event_type, actor_user_id, target_type, target_id, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE_LIMIT)

  const events = (rawEvents ?? []) as AuditRow[]

  // Enrich actor emails — distinct actor_user_id values, filtering nulls.
  const actorIds = [...new Set(
    events.map(e => e.actor_user_id).filter((v): v is string => v !== null)
  )]

  const { data: rawUsers } = actorIds.length > 0
    ? await service.from('users').select('id, email').in('id', actorIds)
    : { data: [] }

  type UserRow = { id: string; email: string }
  const emailMap = new Map(((rawUsers ?? []) as UserRow[]).map(u => [u.id, u.email]))

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Page header ───────────────────────────────────── */}
        <div style={styles.pageHeader}>
          <h1 style={styles.heading}>Audit Log</h1>
          <p style={styles.sub}>
            Read-only timeline of platform events. Events appear here as actions are wired up to write to audit_events.
          </p>
        </div>

        {/* ── Events table ──────────────────────────────────── */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <p style={styles.sectionTitle}>Events</p>
            <span style={styles.sectionCount}>
              {events.length === PAGE_LIMIT ? `latest ${PAGE_LIMIT}` : `${events.length} total`}
            </span>
          </div>

          {events.length === 0 ? (
            <p style={styles.empty}>No audit events yet.</p>
          ) : (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Event</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Actor</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Target</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Payload</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>When</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => {
                    const actorEmail = event.actor_user_id
                      ? (emailMap.get(event.actor_user_id) ?? '—')
                      : null
                    const targetLabel = event.target_type && event.target_id
                      ? `${event.target_type} ${shortId(event.target_id)}`
                      : null
                    const payloadText = event.payload != null
                      ? JSON.stringify(event.payload)
                      : null

                    return (
                      <tr key={event.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 'var(--font-medium)', textTransform: 'capitalize' as const }}>
                          {eventLabel(event.event_type)}
                        </td>
                        <td style={styles.td}>
                          {actorEmail
                            ? <span>{actorEmail}</span>
                            : <span style={styles.system}>System</span>
                          }
                        </td>
                        <td style={{ ...styles.td, ...styles.mono }}>
                          {targetLabel ?? <span style={styles.muted}>—</span>}
                        </td>
                        <td style={{ ...styles.td, ...styles.mono, ...styles.payload }}>
                          {payloadText ?? <span style={styles.muted}>—</span>}
                        </td>
                        <td style={{ ...styles.td, ...styles.muted }}>
                          {formatDateTime(event.created_at)}
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
  thLeft: { textAlign: 'left' as const },
  tr: {
    borderBottom: '1px solid var(--color-border)',
  },
  td: {
    padding:       'var(--space-3) var(--space-4)',
    color:         'var(--color-text)',
    verticalAlign: 'top' as const,
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
  payload: {
    maxWidth:      400,
    overflow:      'hidden',
    textOverflow:  'ellipsis',
    whiteSpace:    'nowrap' as const,
  },
  system: {
    fontSize:      'var(--text-xs)',
    fontWeight:    'var(--font-semibold)',
    color:         'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
} as const
