import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Review Queue' }

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const AGE_BAND_LABELS: Record<string, string> = {
  '8-10':  'Ages 8–10',
  '11-13': 'Ages 11–13',
  '14-18': 'Ages 14–18',
}

type PendingSubmission = {
  id: string
  title: string
  youth_user_id: string
  club_id: string | null
  age_band: string
  submitted_at: string
}

export default async function ReviewQueuePage() {
  const supabase = await createClient()

  // Fetch pending submissions — oldest first (most urgent)
  const { data: rawRows } = await supabase
    .from('submissions')
    .select('id, title, youth_user_id, club_id, age_band, submitted_at')
    .eq('status', 'pending_review')
    .order('submitted_at', { ascending: true })

  const submissions = (rawRows ?? []) as PendingSubmission[]

  // Batch-fetch youth profiles and clubs to avoid N+1 queries
  const userIds  = [...new Set(submissions.map(s => s.youth_user_id))]
  const clubIds  = [...new Set(submissions.map(s => s.club_id).filter(Boolean))] as string[]

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

      <div style={styles.topBar}>
        <div>
          <h1 style={styles.heading}>Review Queue</h1>
          <p style={styles.sub}>Submissions waiting for an editor decision, oldest first.</p>
        </div>
        {submissions.length > 0 && (
          <span style={styles.count}>{submissions.length} pending</span>
        )}
      </div>

      {submissions.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyHeading}>Queue is clear</p>
          <p style={styles.emptyText}>No submissions are waiting for review right now.</p>
        </div>
      ) : (
        <ul style={styles.list}>
          {submissions.map(s => (
            <li key={s.id}>
              <a href={`/admin/review-queue/${s.id}`} style={styles.card}>
                <div style={styles.cardMain}>
                  <span style={styles.cardTitle}>{s.title}</span>
                  <div style={styles.cardMeta}>
                    <span>{profileMap.get(s.youth_user_id) ?? 'Unknown'}</span>
                    {s.club_id && clubMap.has(s.club_id) && (
                      <><span style={styles.dot}>·</span><span>{clubMap.get(s.club_id)}</span></>
                    )}
                    <span style={styles.dot}>·</span>
                    <span>{AGE_BAND_LABELS[s.age_band] ?? s.age_band}</span>
                  </div>
                </div>
                <div style={styles.cardRight}>
                  <span style={styles.timeAgo}>{timeAgo(s.submitted_at)}</span>
                  <span style={styles.arrow}>→</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

    </div>
  )
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
    gap: 'var(--space-2)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    flexWrap: 'wrap' as const,
  },
  dot: { color: 'var(--color-border-strong)' },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    flexShrink: 0,
  },
  timeAgo: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap' as const,
  },
  arrow: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-muted)',
  },
} as const
