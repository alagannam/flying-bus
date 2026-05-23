import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Roles' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// Role pill colors. Unrecognised roles fall through to a neutral pill.
function rolePill(role: string): { bg: string; fg: string } {
  switch (role) {
    case 'admin':         return { bg: 'var(--color-error-surface)',   fg: 'var(--color-error)' }
    case 'moderator':     return { bg: 'var(--color-warning-surface)', fg: 'var(--color-warning)' }
    case 'editor':
    case 'junior_editor': return { bg: 'var(--color-info-surface)',    fg: 'var(--color-info)' }
    case 'channel_host':
    case 'club_captain':  return { bg: 'var(--color-success-surface)', fg: 'var(--color-success)' }
    case 'sponsor':       return { bg: 'var(--color-primary-surface)', fg: 'var(--color-primary)' }
    default:              return { bg: 'var(--color-surface-raised)',  fg: 'var(--color-text-muted)' }
  }
}

type RoleRow = {
  id:         string
  user_id:    string
  role:       string
  scope_type: 'global' | 'club'
  scope_id:   string | null
  granted_by: string | null
  granted_at: string
}

export default async function AdminRolesPage() {
  const service = createServiceClient()

  // user_roles has only a "select_own" RLS policy. Service-role bypasses
  // it and returns every active grant. revoked_at IS NULL is the active
  // filter — historical grants stay in the table for audit but are hidden.
  const { data: rawRoles } = await service
    .from('user_roles')
    .select('id, user_id, role, scope_type, scope_id, granted_by, granted_at')
    .is('revoked_at', null)
    .order('granted_at', { ascending: false })

  const roles = (rawRoles ?? []) as RoleRow[]

  // Collect distinct IDs for the enrichment joins.
  const userIds = [...new Set(
    roles.flatMap(r => [r.user_id, r.granted_by]).filter((v): v is string => v !== null)
  )]
  const clubIds = [...new Set(
    roles.filter(r => r.scope_type === 'club' && r.scope_id)
         .map(r => r.scope_id as string)
  )]

  // Run enrichment in parallel. Skip the clubs query entirely if no
  // club-scoped roles exist — saves a round trip on the common path.
  const [usersResult, clubsResult] = await Promise.all([
    userIds.length > 0
      ? service.from('users').select('id, email').in('id', userIds)
      : Promise.resolve({ data: [] }),
    clubIds.length > 0
      ? service.from('clubs').select('id, name').in('id', clubIds)
      : Promise.resolve({ data: [] }),
  ])

  type UserRow = { id: string; email: string }
  type ClubRow = { id: string; name: string }

  const emailMap = new Map(((usersResult.data ?? []) as UserRow[]).map(u => [u.id, u.email]))
  const clubMap  = new Map(((clubsResult.data ?? []) as ClubRow[]).map(c => [c.id, c.name]))

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Page header ───────────────────────────────────── */}
        <div style={styles.pageHeader}>
          <h1 style={styles.heading}>Roles</h1>
          <p style={styles.sub}>
            Read-only view of active role grants. Revoked grants are hidden but retained for audit.
          </p>
        </div>

        {/* ── Roles table ───────────────────────────────────── */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <p style={styles.sectionTitle}>Active grants</p>
            <span style={styles.sectionCount}>{roles.length} active</span>
          </div>

          {roles.length === 0 ? (
            <p style={styles.empty}>No active role grants.</p>
          ) : (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, ...styles.thLeft }}>User</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Role</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Scope</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Granted by</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Granted</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => {
                    const userEmail    = emailMap.get(role.user_id) ?? '—'
                    const grantorEmail = role.granted_by ? (emailMap.get(role.granted_by) ?? '—') : null
                    const clubName     = role.scope_type === 'club' && role.scope_id
                      ? clubMap.get(role.scope_id) ?? '(deleted club)'
                      : null
                    const pill = rolePill(role.role)

                    return (
                      <tr key={role.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 'var(--font-medium)' }}>
                          {userEmail}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.pill,
                            background: pill.bg,
                            color:      pill.fg,
                          }}>
                            {role.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {role.scope_type === 'global'
                            ? <span style={styles.scopeGlobal}>Global</span>
                            : <span style={styles.scopeClub}>Club: {clubName}</span>
                          }
                        </td>
                        <td style={{ ...styles.td, ...styles.muted }}>
                          {grantorEmail ?? '—'}
                        </td>
                        <td style={{ ...styles.td, ...styles.muted }}>
                          {formatDate(role.granted_at)}
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
  tr: {
    borderBottom: '1px solid var(--color-border)',
  },
  td: {
    padding:       'var(--space-3) var(--space-4)',
    color:         'var(--color-text)',
    verticalAlign: 'middle' as const,
  },
  muted: {
    color:    'var(--color-text-muted)',
    fontSize: 'var(--text-xs)',
  },

  // ── Pill ──────────────────────────────────────────────────────────
  pill: {
    display:       'inline-block',
    padding:       '2px var(--space-2)',
    borderRadius:  'var(--radius-full)',
    fontSize:      'var(--text-xs)',
    fontWeight:    'var(--font-semibold)',
    whiteSpace:    'nowrap' as const,
    textTransform: 'capitalize' as const,
  },

  // ── Scope ─────────────────────────────────────────────────────────
  scopeGlobal: {
    fontSize:   'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  scopeClub: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text)',
  },
} as const
