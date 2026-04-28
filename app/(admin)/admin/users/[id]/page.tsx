import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { UserStatusActions } from './UserStatusActions'

// All reads go through service-role — users table has no broad admin SELECT policy.

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

type UserRow = {
  id: string
  email: string
  account_type: string
  account_status: string
  created_at: string
}

type YouthProfile = {
  display_name: string
  username: string
  creator_score: number
  coins_balance: number
  streak_current: number
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'User' }
}

export default async function UserDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const service = createServiceClient()

  const { data: rawUser } = await service
    .from('users')
    .select('id, email, account_type, account_status, created_at')
    .eq('id', id)
    .maybeSingle()

  if (!rawUser) notFound()

  const user = rawUser as UserRow
  const isYouth  = user.account_type === 'youth'
  const isParent = user.account_type === 'parent'

  // Fetch youth profile + guardian link counts in parallel.
  const [profileResult, parentLinksResult, childLinksResult] = await Promise.all([
    isYouth
      ? service
          .from('youth_profiles')
          .select('display_name, username, creator_score, coins_balance, streak_current')
          .eq('user_id', id)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    // Parent → count their linked children
    isParent
      ? service
          .from('guardian_links')
          .select('id', { count: 'exact', head: true })
          .eq('parent_user_id', id)
          .eq('status', 'active')
      : Promise.resolve({ count: null }),

    // Youth → count their linked parents
    isYouth
      ? service
          .from('guardian_links')
          .select('id', { count: 'exact', head: true })
          .eq('child_user_id', id)
          .eq('status', 'active')
      : Promise.resolve({ count: null }),
  ])

  const profile     = profileResult.data as YouthProfile | null
  const parentLinks = (parentLinksResult as { count: number | null }).count ?? 0
  const childLinks  = (childLinksResult  as { count: number | null }).count ?? 0

  // Only show status actions for states the UI can manage.
  const canManageStatus =
    user.account_status === 'active' || user.account_status === 'suspended'

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <Link href="/admin/users" style={styles.back}>
          ← Users
        </Link>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h1 style={styles.email}>{user.email}</h1>
            <div style={styles.badges}>
              <span style={{ ...styles.typeBadge, ...typeColors(user.account_type) }}>
                {user.account_type}
              </span>
              <span style={{ ...styles.statusBadge, ...statusColors(user.account_status) }}>
                {user.account_status}
              </span>
            </div>
          </div>
          <p style={styles.joined}>Joined {formatDate(user.created_at)}</p>
        </div>

        {/* ── Youth profile card ─────────────────────────────── */}
        {isYouth && profile && (
          <div style={styles.card}>
            <p style={styles.cardHeading}>Profile</p>
            <dl style={styles.dl}>
              <div style={styles.dlRow}>
                <dt style={styles.dt}>Display name</dt>
                <dd style={styles.dd}>{profile.display_name}</dd>
              </div>
              <div style={styles.dlRow}>
                <dt style={styles.dt}>Username</dt>
                <dd style={styles.dd}>@{profile.username}</dd>
              </div>
              <div style={styles.dlRow}>
                <dt style={styles.dt}>Creator score</dt>
                <dd style={styles.dd}>{profile.creator_score.toLocaleString()}</dd>
              </div>
              <div style={styles.dlRow}>
                <dt style={styles.dt}>Kana Coins</dt>
                <dd style={styles.dd}>{profile.coins_balance.toLocaleString()}</dd>
              </div>
              <div style={styles.dlRow}>
                <dt style={styles.dt}>Current streak</dt>
                <dd style={styles.dd}>{profile.streak_current} days</dd>
              </div>
            </dl>
            <Link
              href={`/profile/${profile.username}`}
              style={styles.profileLink}
              target="_blank"
              rel="noopener"
            >
              View public profile ↗
            </Link>
          </div>
        )}

        {/* ── Guardian links card ────────────────────────────── */}
        {(isYouth || isParent) && (
          <div style={styles.card}>
            <p style={styles.cardHeading}>Guardian links</p>
            {isParent && (
              <p style={styles.linkCount}>
                <strong>{parentLinks}</strong>{' '}
                {parentLinks === 1 ? 'linked child' : 'linked children'}
              </p>
            )}
            {isYouth && (
              <p style={styles.linkCount}>
                <strong>{childLinks}</strong>{' '}
                {childLinks === 1 ? 'linked parent' : 'linked parents'}
              </p>
            )}
          </div>
        )}

        {/* ── Status management ──────────────────────────────── */}
        {canManageStatus && (
          <UserStatusActions
            targetUserId={user.id}
            currentStatus={user.account_status}
          />
        )}

        {/* ── Non-manageable status notice ──────────────────── */}
        {!canManageStatus && (
          <div style={styles.notice}>
            <p style={styles.noticeText}>
              This account has status <strong>{user.account_status}</strong> and
              cannot be managed through this interface.
            </p>
          </div>
        )}

      </div>
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
    background: 'var(--color-background)',
    minHeight: '100vh',
    padding: 'var(--space-6) var(--space-6) var(--space-16)',
  },
  container: {
    maxWidth: 'var(--container-md)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-8)',
  },
  back: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    alignSelf: 'flex-start' as const,
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
    flexWrap: 'wrap' as const,
  },
  email: {
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
    flex: 1,
    wordBreak: 'break-all' as const,
  },
  badges: {
    display: 'flex',
    gap: 'var(--space-2)',
    flexShrink: 0,
    flexWrap: 'wrap' as const,
  },
  typeBadge: {
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
  },
  statusBadge: {
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
  },
  joined: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  cardHeading: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: 0,
  },
  dl: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
  },
  dlRow: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr',
    gap: 'var(--space-4)',
    alignItems: 'baseline',
  },
  dt: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-muted)',
  },
  dd: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    margin: 0,
  },
  profileLink: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: 'var(--font-medium)',
    alignSelf: 'flex-start' as const,
  },
  linkCount: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    margin: 0,
  },
  notice: {
    background: 'var(--color-surface-raised)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-4)',
  },
  noticeText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    margin: 0,
    lineHeight: 'var(--leading-relaxed)',
  },
} as const
