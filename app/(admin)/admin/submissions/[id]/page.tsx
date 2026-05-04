import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReviewActions } from './ReviewActions'

const AGE_BAND_LABELS: Record<string, string> = {
  '8-10':  'Ages 8–10',
  '11-13': 'Ages 11–13',
  '14-18': 'Ages 14–18',
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
  status: string
  club_id: string | null
  age_band: string
  submitted_at: string | null
  youth_user_id: string
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
  return { title: row?.title ? `Review: ${row.title}` : 'Review Submission' }
}

export default async function ReviewDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: rawSub } = await supabase
    .from('submissions')
    .select('id, title, body, status, club_id, age_band, submitted_at, youth_user_id, reviewed_at, review_note, published_at, coins_awarded')
    .eq('id', id)
    .maybeSingle()

  if (!rawSub) notFound()

  const sub = rawSub as Submission

  // Fetch author profile and club in parallel
  const [profileResult, clubResult] = await Promise.all([
    supabase
      .from('youth_profiles')
      .select('display_name, username, age_band')
      .eq('user_id', sub.youth_user_id)
      .maybeSingle(),
    sub.club_id
      ? supabase.from('clubs').select('name').eq('id', sub.club_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  type ProfileRow = { display_name: string; username: string; age_band: string }
  const profile  = profileResult.data as ProfileRow | null
  const clubName = (clubResult.data as { name?: string } | null)?.name ?? null

  const isPending   = sub.status === 'pending_review'
  const isPublished = sub.status === 'published'

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <Link href="/admin/submissions" style={styles.back}>
          ← Review Queue
        </Link>

        {/* ── Submission header ──────────────────────────── */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>{sub.title}</h1>
            {!isPending && (
              <span style={{
                ...styles.statusBadge,
                background: isPublished ? 'var(--color-success-surface)' : 'var(--color-error-surface)',
                color:      isPublished ? 'var(--color-success)'         : 'var(--color-error)',
              }}>
                {isPublished ? 'Published' : 'Not approved'}
              </span>
            )}
          </div>

          <div style={styles.meta}>
            {profile && (
              <span>
                {profile.display_name}{' '}
                <span style={styles.username}>@{profile.username}</span>
              </span>
            )}
            {clubName && (
              <><span style={styles.metaDot}>·</span><span>{clubName}</span></>
            )}
            <span style={styles.metaDot}>·</span>
            <span>{AGE_BAND_LABELS[sub.age_band] ?? sub.age_band}</span>
            {sub.submitted_at && (
              <><span style={styles.metaDot}>·</span><span>Submitted {formatDate(sub.submitted_at)}</span></>
            )}
          </div>
        </div>

        {/* ── Already reviewed banner ────────────────────── */}
        {!isPending && (
          <div style={{
            ...styles.reviewedBanner,
            background: isPublished ? 'var(--color-success-surface)' : 'var(--color-surface-raised)',
            borderColor: isPublished ? 'var(--color-success)' : 'var(--color-border-strong)',
          }}>
            <p style={styles.reviewedTitle}>
              {isPublished
                ? `Published on ${formatDate(sub.published_at)} — ${sub.coins_awarded} Kana Coins awarded`
                : `Not approved on ${formatDate(sub.reviewed_at)}`}
            </p>
            {sub.review_note && (
              <p style={styles.reviewedNote}>{sub.review_note}</p>
            )}
          </div>
        )}

        {/* ── Submission body ────────────────────────────── */}
        <div style={styles.bodyCard}>
          {sub.body.split('\n').map((para, i) =>
            para.trim() ? <p key={i} style={styles.para}>{para}</p> : null
          )}
        </div>

        {/* ── Review actions (pending only) ──────────────── */}
        {isPending && <ReviewActions submissionId={sub.id} />}

        {/* ── Return link if already done ───────────────── */}
        {!isPending && (
          <Link href="/admin/submissions" style={styles.returnLink}>
            ← Back to queue
          </Link>
        )}

      </div>
    </div>
  )
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
  statusBadge: {
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    marginTop: 'var(--space-1)',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 'var(--space-2)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
  username: { color: 'var(--color-text-muted)' },
  metaDot: { color: 'var(--color-border-strong)' },
  reviewedBanner: {
    borderRadius: 'var(--radius-lg)',
    border: '1px solid',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  reviewedTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
  },
  reviewedNote: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
  },
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
  returnLink: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    alignSelf: 'flex-start' as const,
  },
} as const
