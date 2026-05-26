import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const AGE_BAND_LABELS: Record<string, string> = {
  '8-10':  'Ages 8–10',
  '11-13': 'Ages 11–13',
  '14-18': 'Ages 14–18',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function dateRange(starts_at: string | null, ends_at: string | null): string | null {
  if (!starts_at && !ends_at) return null
  if (starts_at && ends_at) return `${formatDate(starts_at)} – ${formatDate(ends_at)}`
  if (starts_at) return `Starts ${formatDate(starts_at)}`
  return `Ends ${formatDate(ends_at!)}`
}

type ChallengeRow = {
  id:          string
  slug:        string
  title:       string
  description: string | null
  category:    string | null
  age_bands:   string[] | null
  starts_at:   string | null
  ends_at:     string | null
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('challenges')
    .select('title')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  const row = data as { title?: string } | null
  return { title: row?.title ?? 'Challenge' }
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // is_active = true is an explicit filter, not just a display concern.
  // An inactive slug and a non-existent slug both return notFound() —
  // callers cannot distinguish the two cases.
  const { data: rawChallenge } = await supabase
    .from('challenges')
    .select('id, slug, title, description, category, age_bands, starts_at, ends_at')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!rawChallenge) notFound()

  const challenge = rawChallenge as ChallengeRow
  const range = dateRange(challenge.starts_at, challenge.ends_at)

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <Link href="/challenges" style={styles.back}>← Challenges</Link>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={styles.header}>
          <div style={styles.meta}>
            {(challenge.age_bands ?? []).length > 0 && (
              <div style={styles.ageBands}>
                {(challenge.age_bands ?? []).map(band => (
                  <span key={band} style={styles.ageBadge}>
                    {AGE_BAND_LABELS[band] ?? band}
                  </span>
                ))}
              </div>
            )}
            {challenge.category && (
              <span style={styles.category}>
                {challenge.category.replace(/-/g, ' ')}
              </span>
            )}
          </div>

          <h1 style={styles.title}>{challenge.title}</h1>

          {range && <p style={styles.dateRange}>{range}</p>}
        </div>

        {/* ── Description ───────────────────────────────────── */}
        {challenge.description && (
          <p style={styles.description}>{challenge.description}</p>
        )}

        {/* ── CTA ───────────────────────────────────────────── */}
        <div style={styles.ctaRow}>
          <Link
            href={`/studio/new?challenge_id=${challenge.id}&challenge_slug=${challenge.slug}`}
            style={styles.ctaButton}
          >
            Submit your work →
          </Link>
        </div>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight:  '100vh',
    background: 'var(--color-background)',
    padding:    'var(--space-10) var(--space-6)',
  },
  container: {
    maxWidth:      'var(--container-md)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-8)',
  },
  back: {
    fontSize:       'var(--text-sm)',
    color:          'var(--color-text-secondary)',
    textDecoration: 'none',
    alignSelf:      'flex-start' as const,
  },
  header: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-3)',
  },
  meta: {
    display:    'flex',
    alignItems: 'center',
    gap:        'var(--space-3)',
    flexWrap:   'wrap' as const,
  },
  ageBands: {
    display:  'flex',
    gap:      'var(--space-2)',
    flexWrap: 'wrap' as const,
  },
  ageBadge: {
    padding:      '2px var(--space-2)',
    background:   'var(--color-primary-surface)',
    color:        'var(--color-primary)',
    borderRadius: 'var(--radius-sm)',
    fontSize:     'var(--text-xs)',
    fontWeight:   'var(--font-semibold)',
  },
  category: {
    fontSize:      'var(--text-xs)',
    fontWeight:    'var(--font-medium)',
    color:         'var(--color-text-muted)',
    textTransform: 'capitalize' as const,
  },
  title: {
    fontSize:   'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
  },
  dateRange: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
    margin:   0,
  },
  description: {
    fontSize:   'var(--text-base)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
  },
  ctaRow: {
    display:    'flex',
    paddingTop: 'var(--space-2)',
  },
  ctaButton: {
    padding:        'var(--space-3) var(--space-6)',
    background:     'var(--color-primary)',
    color:          '#fff',
    borderRadius:   'var(--radius-full)',
    fontSize:       'var(--text-sm)',
    fontWeight:     'var(--font-semibold)',
    textDecoration: 'none',
  },
} as const
