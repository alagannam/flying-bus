import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type SubmissionStatus =
  | 'draft'
  | 'pending_parent_approval'
  | 'pending_review'
  | 'published'
  | 'rejected'

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft:                    'Draft',
  pending_parent_approval:  'Awaiting parent approval',
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

const STATUS_DESCRIPTIONS: Record<SubmissionStatus, string> = {
  draft:                   'This is a saved draft. It hasn\'t been submitted yet.',
  pending_parent_approval: 'Your submission is waiting for your parent or guardian to approve it before it goes to the editors.',
  pending_review:          'Your submission is in the review queue. Editors will read it soon.',
  published:               'Your submission is live and visible to the world. Great work!',
  rejected:                'Your submission wasn\'t approved this time. See the editor\'s note below.',
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

type Submission = {
  id: string
  title: string
  body: string
  status: SubmissionStatus
  club_id: string | null
  created_at: string
  submitted_at: string | null
  parent_reviewed_at: string | null
  parent_review_note: string | null
  reviewed_at: string | null
  review_note: string | null
  published_at: string | null
  coins_awarded: number
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('submissions')
    .select('title')
    .eq('id', id)
    .maybeSingle()
  const row = data as { title?: string } | null
  return { title: row?.title ?? 'Submission' }
}

export default async function SubmissionDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawSub } = await supabase
    .from('submissions')
    .select('id, title, body, status, club_id, created_at, submitted_at, parent_reviewed_at, parent_review_note, reviewed_at, review_note, published_at, coins_awarded')
    .eq('id', id)
    .eq('youth_user_id', user.id)   // ownership check — defence beyond RLS
    .maybeSingle()

  if (!rawSub) notFound()

  const sub = rawSub as Submission

  // Fetch club name if linked
  let clubName: string | null = null
  if (sub.club_id) {
    const { data: rawClub } = await supabase
      .from('clubs')
      .select('name')
      .eq('id', sub.club_id)
      .maybeSingle()
    clubName = (rawClub as { name?: string } | null)?.name ?? null
  }

  const badge = STATUS_COLORS[sub.status]

  // Build status timeline — only show transitions that have occurred
  type TimelineEvent = { label: string; date: string; note?: string | null }
  const timeline: TimelineEvent[] = [
    { label: 'Saved', date: sub.created_at },
  ]
  if (sub.submitted_at)
    timeline.push({ label: 'Submitted for review', date: sub.submitted_at })
  if (sub.parent_reviewed_at)
    timeline.push({
      label: sub.parent_review_note ? 'Parent review completed' : 'Approved by parent',
      date: sub.parent_reviewed_at,
      note: sub.parent_review_note,
    })
  if (sub.reviewed_at)
    timeline.push({
      label: sub.status === 'published' ? 'Approved by editor' : 'Reviewed by editor',
      date: sub.reviewed_at,
      note: sub.review_note,
    })
  if (sub.published_at)
    timeline.push({ label: 'Published', date: sub.published_at })

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <Link href="/my-submissions" style={styles.back}>← My Submissions</Link>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>{sub.title}</h1>
            <span style={{ ...styles.badge, background: badge.bg, color: badge.color }}>
              {STATUS_LABELS[sub.status]}
            </span>
          </div>

          {clubName && (
            <p style={styles.club}>Club: {clubName}</p>
          )}

          <p style={{
            ...styles.statusDesc,
            color: sub.status === 'rejected'
              ? 'var(--color-error)'
              : 'var(--color-text-secondary)',
          }}>
            {STATUS_DESCRIPTIONS[sub.status]}
          </p>
        </div>

        {/* Coins earned banner */}
        {sub.status === 'published' && sub.coins_awarded > 0 && (
          <div style={styles.coinsBanner}>
            <span style={styles.coinsEmoji}>🪙</span>
            <span>
              You earned <strong>{sub.coins_awarded} Kana Coins</strong> for this submission.
            </span>
          </div>
        )}

        {/* Body */}
        <div style={styles.bodyCard}>
          {sub.body.split('\n').map((para, i) =>
            para.trim()
              ? <p key={i} style={styles.para}>{para}</p>
              : null
          )}
        </div>

        {/* Timeline */}
        {timeline.length > 0 && (
          <div style={styles.timelineSection}>
            <h2 style={styles.timelineHeading}>Timeline</h2>
            <ul style={styles.timelineList}>
              {timeline.map((event, i) => (
                <li key={i} style={styles.timelineItem}>
                  <span style={styles.dot} />
                  <div>
                    <span style={styles.timelineLabel}>{event.label}</span>
                    <span style={styles.timelineDate}> — {formatDate(event.date)}</span>
                    {event.note && (
                      <p style={styles.timelineNote}>{event.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Draft CTA */}
        {sub.status === 'draft' && (
          <p style={styles.draftHint}>
            Ready to share?{' '}
            <a href="/studio/new" style={styles.draftLink}>Create a new submission to submit for review.</a>
          </p>
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
  header: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-3)' },
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
  },
  title: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    flex: 1,
    lineHeight: 'var(--leading-tight)',
  },
  badge: {
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    marginTop: 'var(--space-1)',
  },
  club: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
  statusDesc: {
    fontSize: 'var(--text-sm)',
    lineHeight: 'var(--leading-relaxed)',
  },
  coinsBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    background: 'var(--color-kana-surface)',
    border: '1px solid var(--color-kana-light)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-4)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
  },
  coinsEmoji: { fontSize: 'var(--text-xl)' },
  bodyCard: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-8)',
  },
  para: {
    fontSize: 'var(--text-base)',
    lineHeight: 'var(--leading-relaxed)',
    color: 'var(--color-text)',
    marginBottom: 'var(--space-4)',
  },
  timelineSection: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-4)' },
  timelineHeading: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
  },
  timelineList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-3)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--color-primary)',
    flexShrink: 0,
    marginTop: 5,
  },
  timelineLabel: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
  },
  timelineDate: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
  timelineNote: {
    marginTop: 'var(--space-2)',
    padding: 'var(--space-3)',
    background: 'var(--color-surface-raised)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
  },
  draftHint: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
  draftLink: {
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-medium)',
  },
} as const
