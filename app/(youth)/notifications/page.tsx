import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MarkAllRead } from './MarkAllRead'

export const metadata: Metadata = { title: 'Notifications' }

// Never serve a cached RSC payload for this page — user-scoped data must
// always be fetched fresh so switching accounts doesn't show stale content.
export const dynamic = 'force-dynamic'

type NotificationType =
  | 'submission_published'
  | 'submission_rejected'
  | 'parent_approval_needed'
  | 'parent_approved'
  | 'parent_rejected'
  | 'coins_earned'
  | 'general'

const TYPE_LABELS: Record<NotificationType, string> = {
  submission_published:    'Published',
  submission_rejected:     'Not approved',
  parent_approval_needed:  'Awaiting parent',
  parent_approved:         'Parent approved',
  parent_rejected:         'Parent declined',
  coins_earned:            'Coins earned',
  general:                 'Notice',
}

const TYPE_COLORS: Record<NotificationType, { bg: string; color: string }> = {
  submission_published:    { bg: 'var(--color-success-surface)',  color: 'var(--color-success)' },
  submission_rejected:     { bg: 'var(--color-error-surface)',    color: 'var(--color-error)' },
  parent_approval_needed:  { bg: 'var(--color-warning-surface)',  color: 'var(--color-warning)' },
  parent_approved:         { bg: 'var(--color-success-surface)',  color: 'var(--color-success)' },
  parent_rejected:         { bg: 'var(--color-error-surface)',    color: 'var(--color-error)' },
  coins_earned:            { bg: 'var(--color-kana-surface)',     color: 'var(--color-kana)' },
  general:                 { bg: 'var(--color-surface-raised)',   color: 'var(--color-text-secondary)' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

type Notification = {
  id: string
  type: NotificationType
  title: string
  body: string | null
  read_at: string | null
  reference_id: string | null
  created_at: string
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawRows } = await supabase
    .from('notifications')
    .select('id, type, title, body, read_at, reference_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = (rawRows ?? []) as Notification[]

  const unread    = notifications.filter(n => !n.read_at)
  const read      = notifications.filter(n => !!n.read_at)
  const unreadIds = unread.map(n => n.id)

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.topBar}>
          <h1 style={styles.heading}>Notifications</h1>
          {unread.length > 0 && (
            <span style={styles.unreadCount}>{unread.length} unread</span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyHeading}>All caught up</p>
            <p style={styles.emptyText}>No notifications yet.</p>
          </div>
        ) : (
          <>
            {/* ── Unread ─────────────────────────────────── */}
            {unread.length > 0 && (
              <section>
                <h2 style={styles.sectionLabel}>Unread</h2>
                <ul style={styles.list}>
                  {unread.map(n => (
                    <NotificationItem key={n.id} n={n} />
                  ))}
                </ul>
              </section>
            )}

            {/* ── Read ───────────────────────────────────── */}
            {read.length > 0 && (
              <section>
                <h2 style={styles.sectionLabel}>
                  {unread.length > 0 ? 'Earlier' : 'All notifications'}
                </h2>
                <ul style={styles.list}>
                  {read.map(n => (
                    <NotificationItem key={n.id} n={n} muted />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

      </div>

      {/* Fires once on mount — marks all unread rows as read in the background */}
      <MarkAllRead ids={unreadIds} />
    </div>
  )
}

function NotificationItem({ n, muted = false }: { n: Notification; muted?: boolean }) {
  const typeKey = (n.type in TYPE_LABELS ? n.type : 'general') as NotificationType
  const badge   = TYPE_COLORS[typeKey]

  return (
    <li style={{ ...styles.item, background: muted ? 'var(--color-surface-raised)' : 'var(--color-surface)' }}>
      {!muted && <div style={styles.unreadDot} />}
      <div style={styles.itemBody}>
        <div style={styles.itemTop}>
          <span style={{ ...styles.typeBadge, background: badge.bg, color: badge.color }}>
            {TYPE_LABELS[typeKey]}
          </span>
          <span style={styles.date}>{formatDate(n.created_at)}</span>
        </div>
        <p style={styles.title}>{n.title}</p>
        {n.body && <p style={styles.body}>{n.body}</p>}
        {n.reference_id && (
          <a href={`/my-submissions/${n.reference_id}`} style={styles.viewLink}>
            View submission →
          </a>
        )}
      </div>
    </li>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-background)',
    padding: 'var(--space-8) var(--space-6)',
  },
  container: {
    maxWidth: 'var(--container-md)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-8)',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
  },
  heading: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  unreadCount: {
    padding: 'var(--space-1) var(--space-3)',
    background: 'var(--color-primary-surface)',
    color: 'var(--color-primary)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
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
  sectionLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 'var(--space-3)',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-3)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-4)',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--color-primary)',
    flexShrink: 0,
    marginTop: 6,
  },
  itemBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
    minWidth: 0,
  },
  itemTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-3)',
  },
  typeBadge: {
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
  },
  date: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap' as const,
  },
  title: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-snug)',
  },
  body: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
  },
  viewLink: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-medium)',
  },
} as const
