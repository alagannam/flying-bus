import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ParentApprovalActions } from './ParentApprovalActions'

export const metadata: Metadata = { title: 'Review Submission' }

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default async function ParentApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS policy "submissions_select_parent" ensures this only returns rows
  // for children linked to this parent — notFound() handles anything else.
  const { data: rawSub } = await supabase
    .from('submissions')
    .select('id, title, body, status, youth_user_id, club_id, submitted_at, parent_reviewed_at, parent_review_note')
    .eq('id', id)
    .single()

  if (!rawSub) notFound()

  type SubRow = {
    id: string
    title: string
    body: string
    status: string
    youth_user_id: string
    club_id: string | null
    submitted_at: string | null
    parent_reviewed_at: string | null
    parent_review_note: string | null
  }

  const sub = rawSub as SubRow

  const [profileResult, clubResult] = await Promise.all([
    supabase
      .from('youth_profiles')
      .select('display_name')
      .eq('user_id', sub.youth_user_id)
      .single(),
    sub.club_id
      ? supabase.from('clubs').select('name').eq('id', sub.club_id).single()
      : Promise.resolve({ data: null }),
  ])

  const displayName = (profileResult.data as { display_name: string } | null)?.display_name ?? 'Your child'
  const clubName    = (clubResult.data as { name: string } | null)?.name ?? null

  const isPending  = sub.status === 'pending_parent_approval'
  const isApproved = sub.status === 'pending_review' || sub.status === 'published'
  const isDeclined = sub.status === 'rejected'

  const bodyParagraphs = sub.body.split('\n').filter(Boolean)

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <Link href="/parent/approvals" style={styles.back}>← Back to approvals</Link>

        {/* ── Submission header ──────────────────────────────── */}
        <div style={styles.header}>
          <h1 style={styles.title}>{sub.title}</h1>
          <div style={styles.meta}>
            <span>{displayName}</span>
            {clubName && <><span style={styles.metaDot}>·</span><span>{clubName}</span></>}
            {sub.submitted_at && (
              <><span style={styles.metaDot}>·</span><span>Submitted {formatDate(sub.submitted_at)}</span></>
            )}
          </div>
        </div>

        {/* ── Outcome banner (already actioned) ─────────────── */}
        {isApproved && (
          <div style={{ ...styles.banner, ...styles.bannerApproved }}>
            <strong>You approved this submission.</strong>
            {sub.parent_reviewed_at && (
              <span> It was sent to the editors on {formatDate(sub.parent_reviewed_at)}.</span>
            )}
          </div>
        )}

        {isDeclined && (
          <div style={{ ...styles.banner, ...styles.bannerDeclined }}>
            <strong>You declined this submission.</strong>
            {sub.parent_review_note && (
              <p style={styles.bannerNote}>Your note: &ldquo;{sub.parent_review_note}&rdquo;</p>
            )}
          </div>
        )}

        {/* ── Submission body ────────────────────────────────── */}
        <div style={styles.bodyCard}>
          {bodyParagraphs.map((para, i) => (
            <p key={i} style={styles.para}>{para}</p>
          ))}
        </div>

        {/* ── Approval actions (only while pending) ─────────── */}
        {isPending && <ParentApprovalActions submissionId={sub.id} />}

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
    gap: 'var(--space-6)',
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
  title: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-snug)',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 'var(--space-2)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  metaDot: { color: 'var(--color-border-strong)' },
  banner: {
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-4) var(--space-5)',
    fontSize: 'var(--text-sm)',
    lineHeight: 'var(--leading-relaxed)',
  },
  bannerApproved: {
    background: 'var(--color-success-surface)',
    color: 'var(--color-success)',
    border: '1px solid var(--color-success)',
  },
  bannerDeclined: {
    background: 'var(--color-error-surface)',
    color: 'var(--color-error)',
    border: '1px solid var(--color-error)',
  },
  bannerNote: {
    marginTop: 'var(--space-2)',
    fontStyle: 'italic',
  },
  bodyCard: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  para: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-relaxed)',
    margin: 0,
  },
} as const
