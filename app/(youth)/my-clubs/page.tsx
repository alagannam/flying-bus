import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My Clubs' }

type MembershipRow = {
  club_id: string
  clubs: {
    id:          string
    name:        string
    slug:        string
    description: string
    is_active:   boolean
  } | null
}

export default async function MyClubsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Anon client + club_memberships_select_own RLS scopes this to
  // the authenticated user. The embedded clubs(...) join is filtered
  // in JS — clubs RLS only returns active rows, so an inactive club
  // membership returns null for the joined row.
  const { data: rawMemberships } = await supabase
    .from('club_memberships')
    .select('club_id, clubs(id, name, slug, description, is_active)')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const memberships = (rawMemberships ?? []) as unknown as MembershipRow[]
  const clubs = memberships
    .map(m => m.clubs)
    .filter((c): c is NonNullable<MembershipRow['clubs']> => c !== null && c.is_active)

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.topRow}>
          <h1 style={styles.heading}>My Clubs</h1>
          {clubs.length > 0 && (
            <span style={styles.count}>
              {clubs.length === 1 ? '1 club' : `${clubs.length} clubs`}
            </span>
          )}
        </div>

        {clubs.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyHeading}>You haven&apos;t joined any clubs yet</p>
            <p style={styles.emptyText}>
              <Link href="/clubs" style={styles.emptyLink}>Browse clubs →</Link>
            </p>
          </div>
        ) : (
          <ul style={styles.list}>
            {clubs.map(club => (
              <li key={club.id}>
                <Link href={`/clubs/${club.slug}`} style={styles.card}>
                  <span style={styles.cardName}>{club.name}</span>
                  {club.description && (
                    <span style={styles.cardDesc}>{club.description}</span>
                  )}
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
    minHeight:  '100vh',
    background: 'var(--color-background)',
    padding:    'var(--space-8) var(--space-6)',
  },
  container: {
    maxWidth:      'var(--container-md)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-6)',
  },
  topRow: {
    display:    'flex',
    alignItems: 'baseline',
    gap:        'var(--space-3)',
    flexWrap:   'wrap' as const,
  },
  heading: {
    fontSize:   'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    margin:     0,
  },
  count: {
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color:      'var(--color-text-muted)',
  },
  empty: {
    padding:      'var(--space-12)',
    textAlign:    'center' as const,
    background:   'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border:       '1px solid var(--color-border)',
  },
  emptyHeading: {
    fontSize:     'var(--text-base)',
    fontWeight:   'var(--font-semibold)',
    color:        'var(--color-text)',
    marginBottom: 'var(--space-2)',
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
    margin:   0,
  },
  emptyLink: {
    color:          'var(--color-primary)',
    fontWeight:     'var(--font-medium)',
    textDecoration: 'none',
  },
  list: {
    listStyle:     'none',
    padding:       0,
    margin:        0,
    display:       'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap:           'var(--space-3)',
  },
  card: {
    display:        'flex',
    flexDirection:  'column' as const,
    gap:            'var(--space-2)',
    background:     'var(--color-surface)',
    border:         '1px solid var(--color-border)',
    borderRadius:   'var(--radius-xl)',
    padding:        'var(--space-5) var(--space-6)',
    textDecoration: 'none',
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
} as const
