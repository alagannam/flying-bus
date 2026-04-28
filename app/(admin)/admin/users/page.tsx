import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

// All reads go through service-role — users table has no broad admin SELECT policy.

export const metadata: Metadata = { title: 'Users' }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const STATUS_TABS = [
  { value: 'active',    label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'all',       label: 'All' },
] as const

type StatusTab = typeof STATUS_TABS[number]['value']

type UserRow = {
  id: string
  email: string
  account_type: string
  account_status: string
  created_at: string
}

type YouthProfile = { user_id: string; display_name: string; username: string }

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const { status: rawStatus = 'active', type: typeFilter } = await searchParams

  const statusFilter: StatusTab =
    STATUS_TABS.some(t => t.value === rawStatus)
      ? (rawStatus as StatusTab)
      : 'active'

  const service = createServiceClient()

  // Build query with optional filters.
  let query = service
    .from('users')
    .select('id, email, account_type, account_status, created_at')
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('account_status', statusFilter)
  }
  if (typeFilter && typeFilter !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq('account_type', typeFilter as any)
  }

  const { data: rawUsers } = await query
  const users = (rawUsers ?? []) as UserRow[]

  // Batch-fetch youth display names for youth-type rows.
  const youthIds = users.filter(u => u.account_type === 'youth').map(u => u.id)
  const { data: rawProfiles } = youthIds.length > 0
    ? await service
        .from('youth_profiles')
        .select('user_id, display_name, username')
        .in('user_id', youthIds)
    : { data: [] }

  const profileMap = new Map(
    ((rawProfiles ?? []) as YouthProfile[]).map(p => [p.user_id, p])
  )

  return (
    <div style={styles.page}>

      {/* ── Top bar ───────────────────────────────────────── */}
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.heading}>Users</h1>
          <p style={styles.sub}>All accounts registered on the platform.</p>
        </div>
        <span style={styles.countBadge}>{users.length} shown</span>
      </div>

      {/* ── Status filter tabs ────────────────────────────── */}
      <div style={styles.tabs}>
        {STATUS_TABS.map(tab => (
          <a
            key={tab.value}
            href={`/admin/users?status=${tab.value}${typeFilter ? `&type=${typeFilter}` : ''}`}
            style={statusFilter === tab.value
              ? { ...styles.tab, ...styles.tabActive }
              : styles.tab
            }
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* ── List or empty state ───────────────────────────── */}
      {users.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyHeading}>No users found</p>
          <p style={styles.emptyText}>
            No {statusFilter !== 'all' ? statusFilter : ''} accounts match this filter.
          </p>
        </div>
      ) : (
        <ul style={styles.list}>
          {users.map(user => {
            const profile = profileMap.get(user.id)
            return (
              <li key={user.id}>
                <a href={`/admin/users/${user.id}`} style={styles.card}>
                  <div style={styles.cardMain}>
                    <span style={styles.cardEmail}>{user.email}</span>
                    {profile && (
                      <span style={styles.cardName}>
                        {profile.display_name} · @{profile.username}
                      </span>
                    )}
                  </div>
                  <div style={styles.cardRight}>
                    <span style={{ ...styles.pill, ...typeColors(user.account_type) }}>
                      {user.account_type}
                    </span>
                    <span style={{ ...styles.pill, ...statusColors(user.account_status) }}>
                      {user.account_status}
                    </span>
                    <span style={styles.date}>{formatDate(user.created_at)}</span>
                    <span style={styles.arrow}>→</span>
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      )}

    </div>
  )
}

function typeColors(type: string): React.CSSProperties {
  switch (type) {
    case 'youth':     return { background: 'var(--color-primary-surface)', color: 'var(--color-primary)' }
    case 'parent':    return { background: 'var(--color-accent-surface)',   color: 'var(--color-accent)' }
    case 'editor':    return { background: 'var(--color-info-surface)',     color: 'var(--color-info)' }
    case 'moderator': return { background: 'var(--color-warning-surface)', color: 'var(--color-warning)' }
    case 'admin':     return { background: 'var(--color-error-surface)',   color: 'var(--color-error)' }
    default:          return { background: 'var(--color-surface-raised)',  color: 'var(--color-text-muted)' }
  }
}

function statusColors(status: string): React.CSSProperties {
  switch (status) {
    case 'active':    return { background: 'var(--color-success-surface)', color: 'var(--color-success)' }
    case 'suspended': return { background: 'var(--color-error-surface)',   color: 'var(--color-error)' }
    case 'frozen':    return { background: 'var(--color-warning-surface)', color: 'var(--color-warning)' }
    default:          return { background: 'var(--color-surface-raised)',  color: 'var(--color-text-muted)' }
  }
}

const styles = {
  page: {
    maxWidth: 'var(--container-lg)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 'var(--space-4)',
  },
  heading: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  sub: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    marginTop: 'var(--space-1)',
  },
  countBadge: {
    padding: 'var(--space-1) var(--space-3)',
    background: 'var(--color-surface-raised)',
    color: 'var(--color-text-muted)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  tabs: {
    display: 'flex',
    gap: 'var(--space-1)',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: 'var(--space-2)',
  },
  tab: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
  },
  tabActive: {
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  empty: {
    padding: 'var(--space-16)',
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
  },
  emptyHeading: {
    fontSize: 'var(--text-lg)',
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
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-4)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-4) var(--space-5)',
    textDecoration: 'none',
  },
  cardMain: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
    minWidth: 0,
    flex: 1,
  },
  cardEmail: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cardName: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    flexShrink: 0,
    flexWrap: 'wrap' as const,
    justifyContent: 'flex-end',
  },
  pill: {
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
  },
  date: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap' as const,
  },
  arrow: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-muted)',
  },
} as const
