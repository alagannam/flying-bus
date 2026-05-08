import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Clubs' }

const AGE_BAND_LABELS: Record<string, string> = {
  '8-10':  'Ages 8–10',
  '11-13': 'Ages 11–13',
  '14-18': 'Ages 14–18',
}

type ClubRow = {
  id: string
  name: string
  slug: string
  description: string
  age_bands: string[]
}

export default async function ClubsPage() {
  const supabase = await createClient()

  const { data: rawClubs } = await supabase
    .from('clubs')
    .select('id, name, slug, description, age_bands')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const clubs = (rawClubs ?? []) as ClubRow[]

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.heading}>
          <h1 style={styles.title}>Clubs</h1>
          <p style={styles.subtitle}>
            Join a club, submit your work, and create alongside kids from around the world.
          </p>
        </div>

        {clubs.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>No clubs available yet. Check back soon.</p>
          </div>
        ) : (
          <ul style={styles.list}>
            {clubs.map(club => (
              <li key={club.id}>
                <Link href={`/clubs/${club.slug}`} style={styles.card}>
                  <div style={styles.cardMain}>
                    {(club.age_bands ?? []).length > 0 && (
                      <div style={styles.ageBands}>
                        {(club.age_bands ?? []).map(band => (
                          <span key={band} style={styles.ageBadge}>
                            {AGE_BAND_LABELS[band] ?? band}
                          </span>
                        ))}
                      </div>
                    )}
                    <span style={styles.cardName}>{club.name}</span>
                    {club.description && (
                      <span style={styles.cardDesc}>{club.description}</span>
                    )}
                  </div>
                  <span style={styles.arrow}>→</span>
                </Link>
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
    padding: 'var(--space-10) var(--space-6)',
  },
  container: {
    maxWidth: 'var(--container-md)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-8)',
  },
  heading: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
  },
  title: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
  },
  subtitle: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    maxWidth: '52ch',
  },
  empty: {
    padding: 'var(--space-12)',
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-4)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-5) var(--space-6)',
    textDecoration: 'none',
  },
  cardMain: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
    minWidth: 0,
    flex: 1,
  },
  ageBands: {
    display: 'flex',
    gap: 'var(--space-2)',
    flexWrap: 'wrap' as const,
  },
  ageBadge: {
    padding: '2px var(--space-2)',
    background: 'var(--color-primary-surface)',
    color: 'var(--color-primary)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
  },
  cardName: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
  },
  cardDesc: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  arrow: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-muted)',
    flexShrink: 0,
  },
} as const
