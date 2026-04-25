import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'My Submissions' }

type SubmissionStatus =
  | 'draft'
  | 'pending_parent_approval'
  | 'pending_review'
  | 'published'
  | 'rejected'

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft:                    'Draft',
  pending_parent_approval:  'Awaiting parent',
  pending_review:           'In review',
  published:                'Published',
  rejected:                 'Not approved',
}

const STATUS_COLORS: Record<SubmissionStatus, { bg: string; color: string }> = {
  draft:                    { bg: 'var(--color-surface-raised)',   color: 'var(--color-text-secondary)' },
  pending_parent_approval:  { bg: 'var(--color-warning-surface)',  color: 'var(--color-warning)' },
  pending_review:           { bg: 'var(--color-warning-surface)',  color: 'var(--color-warning)' },
  published:                { bg: 'var(--color-success-surface)',  color: 'var(--color-success)' },
  rejected:                 { bg: 'var(--color-error-surface)',    color: 'var(--color-error)' },
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function dateLabel(s: {
  status: SubmissionStatus
  created_at: string
  submitted_at: string | null
  published_at: string | null
}) {
  if (s.published_at)  return `Published ${formatDate(s.published_at)}`
  if (s.submitted_at)  return `Submitted ${formatDate(s.submitted_at)}`
  return `Saved ${formatDate(s.created_at)}`
}

export default async function MySubmissionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawRows } = await supabase
    .from('submissions')
    .select('id, title, status, created_at, submitted_at, published_at')
    .eq('youth_user_id', user.id)
    .order('created_at', { ascending: false })

  const submissions = (rawRows ?? []) as {
    id: string
    title: string
    status: SubmissionStatus
    created_at: string
    submitted_at: string | null
    published_at: string | null
  }[]

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.top}>
          <h1 style={styles.heading}>My Submissions</h1>
          <a href="/studio/new" style={styles.newBtn}>+ New submission</a>
        </div>

        {submissions.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>You haven&apos;t submitted anything yet.</p>
            <a href="/studio/new" style={styles.emptyLink}>Create your first submission →</a>
          </div>
        ) : (
          <ul style={styles.list}>
            {submissions.map(s => {
              const badge = STATUS_COLORS[s.status]
              return (
                <li key={s.id}>
                  <a href={`/my-submissions/${s.id}`} style={styles.card}>
                    <div style={styles.cardLeft}>
                      <span style={styles.cardTitle}>{s.title}</span>
                      <span style={styles.cardDate}>{dateLabel(s)}</span>
                    </div>
                    <span style={{ ...styles.badge, background: badge.bg, color: badge.color }}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </a>
                </li>
              )
            })}
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
    gap: 'var(--space-8)',
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  heading: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  newBtn: {
    display: 'inline-block',
    padding: 'var(--space-3) var(--space-6)',
    background: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    borderRadius: 'var(--radius-full)',
    textDecoration: 'none',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  empty: {
    padding: 'var(--space-12)',
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px dashed var(--color-border)',
  },
  emptyText: {
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--space-3)',
  },
  emptyLink: {
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-medium)',
    fontSize: 'var(--text-sm)',
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
  cardLeft: {
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
  cardDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  badge: {
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
} as const
