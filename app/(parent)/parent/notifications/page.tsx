import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MarkAllRead } from './MarkAllRead'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Notifications' }

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  read_at: string | null
  created_at: string
  reference_id: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default async function ParentNotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawNotifs } = await supabase
    .from('notifications')
    .select('id, type, title, body, read_at, created_at, reference_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = (rawNotifs ?? []) as Notification[]

  const unread = notifications.filter(n => !n.read_at)
  const read   = notifications.filter(n =>  n.read_at)
  const unreadIds = unread.map(n => n.id)

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Notifications</h1>
          {unread.length > 0 && (
            <span style={styles.unreadCount}>{unread.length} unread</span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>No notifications yet.</p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <div style={styles.group}>
                <p style={styles.groupLabel}>New</p>
                <ul style={styles.list}>
                  {unread.map(n => (
                    <li key={n.id}>
                      <NotificationCard n={n} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {read.length > 0 && (
              <div style={styles.group}>
                {unread.length > 0 && <p style={styles.groupLabel}>Earlier</p>}
                <ul style={styles.list}>
                  {read.map(n => (
                    <li key={n.id}>
                      <NotificationCard n={n} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

      </div>

      <MarkAllRead ids={unreadIds} />
    </div>
  )
}

function NotificationCard({ n }: { n: Notification }) {
  const isApproval = n.type === 'parent_approval_needed'

  return (
    <div style={{ ...styles.card, borderLeft: n.read_at ? 'none' : '3px solid var(--color-primary)' }}>
      <div style={styles.cardTop}>
        <p style={styles.cardTitle}>{n.title}</p>
        <span style={styles.cardDate}>{formatDate(n.created_at)}</span>
      </div>
      {n.body && <p style={styles.cardBody}>{n.body}</p>}
      {isApproval && (
        <Link href="/parent/approvals" style={styles.actionLink}>
          Review in Approvals →
        </Link>
      )}
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-background)',
    padding: 'var(--space-8) var(--space-6)',
  },
  container: {
    maxWidth: 'var(--container-sm)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  pageTitle: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  unreadCount: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-primary)',
    background: 'var(--color-primary-surface)',
    borderRadius: 'var(--radius-full)',
    padding: '2px var(--space-2)',
  },
  empty: {
    padding: 'var(--space-16)',
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  group: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  groupLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
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
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--space-4)',
  },
  cardTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    flex: 1,
  },
  cardDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    flexShrink: 0,
  },
  cardBody: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
  },
  actionLink: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-primary)',
    textDecoration: 'none',
  },
} as const
