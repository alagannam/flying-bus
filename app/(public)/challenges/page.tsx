import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Challenges' }

const AGE_BAND_LABELS: Record<string, string> = {
  '8-10':  'Ages 8–10',
  '11-13': 'Ages 11–13',
  '14-18': 'Ages 14–18',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
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

export default async function ChallengesPage() {
  const supabase = await createClient()

  const { data: rawChallenges } = await supabase
    .from('challenges')
    .select('id, slug, title, description, category, age_bands, starts_at, ends_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const challenges = (rawChallenges ?? []) as ChallengeRow[]

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.heading}>
          <h1 style={styles.title}>Challenges</h1>
          <p style={styles.subtitle}>
            Weekly and seasonal challenges in creativity, debate, kindness, design, and problem-solving.
          </p>
        </div>

        {challenges.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>No active challenges right now. Check back soon.</p>
          </div>
        ) : (
          <ul style={styles.list}>
            {challenges.map(challenge => {
              const range = dateRange(challenge.starts_at, challenge.ends_at)
              return (
                <li key={challenge.id}>
                  <Link href={`/challenges/${challenge.slug}`} style={styles.card}>
                    <div style={styles.cardMain}>
                      <div style={styles.cardTop}>
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
                      <span style={styles.cardName}>{challenge.title}</span>
                      {challenge.description && (
                        <span style={styles.cardDesc}>{challenge.description}</span>
                      )}
                      {range && (
                        <span style={styles.dateRange}>{range}</span>
                      )}
                    </div>
                    <span style={styles.arrow}>→</span>
                  </Link>
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
  heading: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-3)',
  },
  title: {
    fontSize:   'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
  },
  subtitle: {
    fontSize:   'var(--text-base)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    maxWidth:   '52ch',
  },
  empty: {
    padding:      'var(--space-12)',
    textAlign:    'center' as const,
    background:   'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border:       '1px solid var(--color-border)',
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
  },
  list: {
    listStyle:     'none',
    padding:       0,
    margin:        0,
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-3)',
  },
  card: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    gap:            'var(--space-4)',
    background:     'var(--color-surface)',
    borderRadius:   'var(--radius-xl)',
    border:         '1px solid var(--color-border)',
    padding:        'var(--space-5) var(--space-6)',
    textDecoration: 'none',
  },
  cardMain: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
    minWidth:      0,
    flex:          1,
  },
  cardTop: {
    display:    'flex',
    alignItems: 'center',
    gap:        'var(--space-2)',
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
  cardName: {
    fontSize:   'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
  },
  cardDesc: {
    fontSize:            'var(--text-sm)',
    color:               'var(--color-text-secondary)',
    lineHeight:          'var(--leading-relaxed)',
    display:             '-webkit-box',
    WebkitLineClamp:     2,
    WebkitBoxOrient:     'vertical' as const,
    overflow:            'hidden',
  },
  dateRange: {
    fontSize: 'var(--text-xs)',
    color:    'var(--color-text-muted)',
  },
  arrow: {
    fontSize:  'var(--text-base)',
    color:     'var(--color-text-muted)',
    flexShrink: 0,
  },
} as const
