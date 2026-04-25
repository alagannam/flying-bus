import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Approvals' }

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

type PendingSubmission = {
  id: string
  title: string
  youth_user_id: string
  club_id: string | null
  submitted_at: string | null
}

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS policy "submissions_select_parent" filters this automatically to only
  // return pending_parent_approval rows for youth linked to this parent.
  const { data: rawRows } = await supabase
    .from('submissions')
    .select('id, title, youth_user_id, club_id, submitted_at')
    .eq('status', 'pending_parent_approval')
    .order('submitted_at', { ascending: true })

  const submissions = (rawRows ?? []) as PendingSubmission[]

  // Batch-fetch youth profiles and clubs
  const userIds = [...new Set(submissions.map(s => s.youth_user_id))]
  const clubIds = [...new Set(submissions.map(s => s.club_id).filter(Boolean))] as string[]

  const [profilesResult, clubsResult] = await Promise.all([
    userIds.length > 0
      ? supabase.from('youth_profiles').select('user_id, display_name').in('user_id', userIds)
      : Promise.resolve({ data: [] }),
    clubIds.length > 0
      ? supabase.from('clubs').select('id, name').in('id', clubIds)
      : Promise.resolve({ data: [] }),
  ])

  type ProfileRow = { user_id: string; display_name: string }
  type ClubRow    = { id: string; name: string }

  const profileMap = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map(p => [p.user_id, p.display_name])
  )
  const clubMap = new Map(
    ((clubsResult.data ?? []) as ClubRow[]).map(c => [c.id, c.name])
  )

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.topBar}>
          <div>
            <h1 style={styles.heading}>Approvals</h1>
            <p style={styles.sub}>
              Review your child&apos;s submissions before they go to the editors.
            </p>
          </div>
          {submissions.length > 0 && (
            <span style={styles.count}>{submissions.length} waiting</span>
          )}
        </div>

        {submissions.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyHeading}>Nothing to review</p>
            <p style={styles.emptyText}>
              You&apos;ll be notified when your child submits something for your approval.
            </p>
          </div>
        ) : (
          <ul style={styles.list}>
            {submissions.map(s => (
              <li key={s.id}>
                <a href={`/parent/approvals/${s.id}`} style={styles.card}>
                  <div style={styles.cardMain}>
                    <span style={styles.cardTitle}>{s.title}</span>
                    <div style={styles.cardMeta}>
                      <span>{profileMap.get(s.youth_user_id) ?? 'Your child'}</span>
                      {s.club_id && clubMap.has(s.club_id) && (
                        <><span style={styles.metaDot}>·</span><span>{clubMap.get(s.club_id)}</span></>
                      )}
                      {s.submitted_at && (
                        <><span style={styles.metaDot}>·</span><span>Submitted {formatDate(s.submitted_at)}</span></>
                      )}
                    </div>
                  </div>
                  <span style={styles.arrow}>→</span>
                </a>
              </li>
            ))}
          </ul>
        )}

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
  count: {
    padding: 'var(--space-1) var(--space-3)',
    background: 'var(--color-warning-surface)',
    color: 'var(--color-warning)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
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
  cardTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 'var(--space-2)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  metaDot: { color: 'var(--color-border-strong)' },
  arrow: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-muted)',
    flexShrink: 0,
  },
} as const
