import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Parent Dashboard' }

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function statusLabel(status: string) {
  switch (status) {
    case 'draft':                   return 'Draft'
    case 'pending_parent_approval': return 'Awaiting your approval'
    case 'pending_review':          return 'Under review'
    case 'published':               return 'Published'
    case 'rejected':                return 'Returned'
    default:                        return status
  }
}

function statusColors(status: string): React.CSSProperties {
  switch (status) {
    case 'published':               return { background: 'var(--color-success-surface)', color: 'var(--color-success)' }
    case 'pending_parent_approval': return { background: 'var(--color-warning-surface)', color: 'var(--color-warning)' }
    case 'pending_review':          return { background: 'var(--color-info-surface)',    color: 'var(--color-info)' }
    case 'rejected':                return { background: 'var(--color-error-surface)',   color: 'var(--color-error)' }
    default:                        return { background: 'var(--color-surface-raised)',  color: 'var(--color-text-muted)' }
  }
}

type GuardianLink  = { id: string; child_user_id: string }
type YouthProfile  = {
  user_id: string; display_name: string; username: string
  creator_score: number; coins_balance: number; streak_current: number
}
type SubmissionRow = {
  id: string; title: string; status: string
  submitted_at: string | null; youth_user_id: string
}

export default async function ParentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Anon client — RLS ensures parent sees only their own links.
  const { data: rawLinks } = await supabase
    .from('guardian_links')
    .select('id, child_user_id')
    .eq('parent_user_id', user.id)
    .eq('status', 'active')

  const links    = (rawLinks ?? []) as GuardianLink[]
  const childIds = links.map(l => l.child_user_id)

  if (childIds.length === 0) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.topBar}>
            <h1 style={styles.heading}>Dashboard</h1>
          </div>
          <div style={styles.empty}>
            <p style={styles.emptyHeading}>No linked children yet</p>
            <p style={styles.emptyText}>
              Once your child accepts a guardian link you&apos;ll see their activity here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const service = createServiceClient()

  // Profiles and badges in parallel; then one query per child for latest 3 submissions.
  const [profilesResult, badgesResult] = await Promise.all([
    service
      .from('youth_profiles')
      .select('user_id, display_name, username, creator_score, coins_balance, streak_current')
      .in('user_id', childIds),
    service
      .from('youth_badges')
      .select('user_id')
      .in('user_id', childIds),
  ])

  const subsResults = await Promise.all(
    childIds.map(id =>
      service
        .from('submissions')
        .select('id, title, status, submitted_at, youth_user_id')
        .eq('youth_user_id', id)
        .order('submitted_at', { ascending: false })
        .limit(3)
    )
  )

  const profileMap = new Map(
    ((profilesResult.data ?? []) as YouthProfile[]).map(p => [p.user_id, p])
  )

  const badgeCountMap = new Map<string, number>()
  ;((badgesResult.data ?? []) as { user_id: string }[]).forEach(b => {
    badgeCountMap.set(b.user_id, (badgeCountMap.get(b.user_id) ?? 0) + 1)
  })

  const subsByChild = new Map<string, SubmissionRow[]>(
    childIds.map((id, i) => [id, (subsResults[i]?.data ?? []) as SubmissionRow[]])
  )

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.topBar}>
          <div>
            <h1 style={styles.heading}>Dashboard</h1>
            <p style={styles.sub}>
              {childIds.length === 1 ? '1 linked child' : `${childIds.length} linked children`}
            </p>
          </div>
          <Link href="/parent/approvals" style={styles.approvalsLink}>
            View approvals →
          </Link>
        </div>

        <div style={styles.childGrid}>
          {childIds.map(childId => {
            const profile = profileMap.get(childId)
            const badges  = badgeCountMap.get(childId) ?? 0
            const subs    = subsByChild.get(childId) ?? []

            return (
              <div key={childId} style={styles.childCard}>

                {/* Child header */}
                <div style={styles.childHeader}>
                  <div>
                    <p style={styles.childName}>{profile?.display_name ?? 'Your child'}</p>
                    {profile?.username && (
                      <p style={styles.childUsername}>@{profile.username}</p>
                    )}
                  </div>
                  <Link href={`/parent/children/${childId}`} style={styles.detailLink}>
                    Full profile →
                  </Link>
                </div>

                {/* Stats */}
                {profile && (
                  <div style={styles.statsRow}>
                    <div style={styles.stat}>
                      <span style={styles.statValue}>{profile.creator_score.toLocaleString()}</span>
                      <span style={styles.statLabel}>Creator score</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statValue}>{profile.coins_balance.toLocaleString()}</span>
                      <span style={styles.statLabel}>Kana Coins</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statValue}>{profile.streak_current}</span>
                      <span style={styles.statLabel}>Day streak</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statValue}>{badges}</span>
                      <span style={styles.statLabel}>Badges</span>
                    </div>
                  </div>
                )}

                {/* Recent submissions */}
                <div style={styles.subsSection}>
                  <p style={styles.subsSectionLabel}>Recent submissions</p>
                  {subs.length === 0 ? (
                    <p style={styles.noSubs}>No submissions yet.</p>
                  ) : (
                    <ul style={styles.subsList}>
                      {subs.map(s => (
                        <li key={s.id} style={styles.subItem}>
                          <span style={styles.subTitle}>{s.title}</span>
                          <div style={styles.subRight}>
                            {s.submitted_at && (
                              <span style={styles.subDate}>{formatDate(s.submitted_at)}</span>
                            )}
                            <span style={{ ...styles.statusPill, ...statusColors(s.status) }}>
                              {statusLabel(s.status)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            )
          })}
        </div>

      </div>
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
  approvalsLink: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-medium)',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
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
  childGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  childCard: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-5)',
  },
  childHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--space-4)',
  },
  childName: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    margin: 0,
  },
  childUsername: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    margin: 'var(--space-1) 0 0',
  },
  detailLink: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-medium)',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-3)',
    padding: 'var(--space-4)',
    background: 'var(--color-background)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
    alignItems: 'center',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  statLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  subsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
  },
  subsSectionLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: 0,
  },
  noSubs: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
  subsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  subItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--color-background)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
  },
  subTitle: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    fontWeight: 'var(--font-medium)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1,
  },
  subRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    flexShrink: 0,
  },
  subDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap' as const,
  },
  statusPill: {
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
  },
} as const
