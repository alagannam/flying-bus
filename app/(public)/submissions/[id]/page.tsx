import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReportButton } from './ReportButton'

export const dynamic = 'force-dynamic'

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

const AGE_BAND_LABELS: Record<string, string> = {
  '8-10':  'Ages 8–10',
  '11-13': 'Ages 11–13',
  '14-18': 'Ages 14–18',
}

type SubRow = {
  id: string
  title: string
  body: string
  age_band: string
  youth_user_id: string
  club_id: string | null
  published_at: string | null
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
    .eq('status', 'published')
    .maybeSingle()
  const row = data as { title?: string } | null
  return { title: row?.title ?? 'Submission' }
}

export default async function PublicSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Only published submissions are visible publicly
  const { data: rawSub } = await supabase
    .from('submissions')
    .select('id, title, body, age_band, youth_user_id, club_id, published_at')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (!rawSub) notFound()
  const sub = rawSub as SubRow

  // Read the viewer's session first, on its own. Calling getUser() inside
  // Promise.all alongside table queries was returning null here even when
  // the same client returned a user in the header — pulling it out fixes it.
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch author and club in parallel.
  const [profileResult, clubResult] = await Promise.all([
    supabase
      .from('youth_profiles')
      .select('display_name, username')
      .eq('user_id', sub.youth_user_id)
      .maybeSingle(),
    sub.club_id
      ? supabase.from('clubs').select('name, slug').eq('id', sub.club_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  // Viewer can report if signed in and is not the author.
  // The server action re-verifies both conditions independently.
  const viewerCanReport = !!user && user.id !== sub.youth_user_id

  type ProfileRow = { display_name: string; username: string }
  type ClubRow    = { name: string; slug: string }

  const author = profileResult.data as ProfileRow | null
  const club   = clubResult.data   as ClubRow    | null

  const paragraphs = sub.body.split('\n').filter(p => p.trim())

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Back link ─────────────────────────────────────── */}
        {club ? (
          <Link href={`/clubs/${club.slug}`} style={styles.back}>
            ← {club.name}
          </Link>
        ) : (
          <Link href="/clubs" style={styles.back}>← Clubs</Link>
        )}

        {/* ── Header ────────────────────────────────────────── */}
        <div style={styles.header}>
          <h1 style={styles.title}>{sub.title}</h1>
          <div style={styles.meta}>
            {author && (
              <span>
                {author.display_name}
                <span style={styles.username}> @{author.username}</span>
              </span>
            )}
            {club && (
              <>
                <span style={styles.dot}>·</span>
                <Link href={`/clubs/${club.slug}`} style={styles.clubLink}>
                  {club.name}
                </Link>
              </>
            )}
            <span style={styles.dot}>·</span>
            <span>{AGE_BAND_LABELS[sub.age_band] ?? sub.age_band}</span>
            {sub.published_at && (
              <>
                <span style={styles.dot}>·</span>
                <span>Published {formatDate(sub.published_at)}</span>
              </>
            )}
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────── */}
        <article style={styles.body}>
          {paragraphs.map((para, i) => (
            <p key={i} style={styles.para}>{para}</p>
          ))}
        </article>

        {/* ── Report ────────────────────────────────────────── */}
        {viewerCanReport && (
          <div style={styles.reportSection}>
            <ReportButton submissionId={sub.id} />
          </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-background)',
    padding: 'var(--space-10) var(--space-6)',
  },
  container: {
    maxWidth: 'var(--container-sm)',
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
    gap: 'var(--space-3)',
    paddingBottom: 'var(--space-6)',
    borderBottom: '1px solid var(--color-border)',
  },
  title: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 'var(--space-2)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  username: {
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
  },
  dot: { color: 'var(--color-border-strong)' },
  clubLink: {
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: 'var(--font-medium)',
  },
  body: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-5)',
  },
  para: {
    fontSize: 'var(--text-base)',
    lineHeight: 'var(--leading-relaxed)',
    color: 'var(--color-text)',
    margin: 0,
  },
  reportSection: {
    paddingTop: 'var(--space-6)',
    borderTop: '1px solid var(--color-border)',
  },
} as const
