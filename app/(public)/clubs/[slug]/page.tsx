import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JoinButton } from './JoinButton'

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

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
  mission: string
  age_bands: string[]
}

type SubRow = {
  id: string
  title: string
  youth_user_id: string
  published_at: string | null
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('clubs')
    .select('name')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  const row = data as { name?: string } | null
  return { title: row?.name ?? 'Club' }
}

export default async function ClubPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: rawClub } = await supabase
    .from('clubs')
    .select('id, name, slug, description, mission, age_bands')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!rawClub) notFound()
  const club = rawClub as ClubRow

  // Membership awareness — only meaningful for signed-in users.
  // anon getUser() returns null safely; the membership query is
  // skipped entirely when there's no session.
  const { data: { user } } = await supabase.auth.getUser()
  let isMember = false
  if (user) {
    const { data: membershipRow } = await supabase
      .from('club_memberships')
      .select('club_id')
      .eq('user_id', user.id)
      .eq('club_id', club.id)
      .eq('is_active', true)
      .maybeSingle()
    isMember = !!membershipRow
  }

  const { data: rawSubs } = await supabase
    .from('submissions')
    .select('id, title, youth_user_id, published_at')
    .eq('club_id', club.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const submissions = (rawSubs ?? []) as SubRow[]

  // Batch-fetch author display names
  const userIds = [...new Set(submissions.map(s => s.youth_user_id))]
  const { data: rawProfiles } = userIds.length > 0
    ? await supabase
        .from('youth_profiles')
        .select('user_id, display_name, username')
        .in('user_id', userIds)
    : { data: [] }

  type ProfileRow = { user_id: string; display_name: string; username: string }
  const profileMap = new Map(
    ((rawProfiles ?? []) as ProfileRow[]).map(p => [p.user_id, p])
  )

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <Link href="/clubs" style={styles.back}>← All Clubs</Link>

        {/* ── Club header ──────────────────────────────────── */}
        <div style={styles.header}>
          <div style={styles.ageBands}>
            {(club.age_bands ?? []).map(band => (
              <span key={band} style={styles.ageBadge}>
                {AGE_BAND_LABELS[band] ?? band}
              </span>
            ))}
          </div>
          <h1 style={styles.name}>{club.name}</h1>
          <p style={styles.description}>{club.description}</p>
          {club.mission && (
            <p style={styles.mission}>{club.mission}</p>
          )}
          {user && (
            <JoinButton clubId={club.id} isMember={isMember} />
          )}
        </div>

        {/* ── Published submissions ─────────────────────────── */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Published work</h2>
            {submissions.length > 0 && (
              <span style={styles.count}>{submissions.length}</span>
            )}
          </div>

          {submissions.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyText}>No published submissions yet. Check back soon.</p>
            </div>
          ) : (
            <ul style={styles.list}>
              {submissions.map(s => {
                const author = profileMap.get(s.youth_user_id)
                return (
                  <li key={s.id}>
                    <Link href={`/submissions/${s.id}`} style={styles.card}>
                      <div style={styles.cardMain}>
                        <span style={styles.cardTitle}>{s.title}</span>
                        <div style={styles.cardMeta}>
                          {author && (
                            <span>{author.display_name}</span>
                          )}
                          {s.published_at && (
                            <>
                              {author && <span style={styles.dot}>·</span>}
                              <span>{formatDate(s.published_at)}</span>
                            </>
                          )}
                        </div>
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
  name: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
  },
  description: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
  },
  mission: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
    lineHeight: 'var(--leading-relaxed)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
  },
  count: {
    padding: '2px var(--space-2)',
    background: 'var(--color-surface-raised)',
    color: 'var(--color-text-muted)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
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
  },
  dot: { color: 'var(--color-border-strong)' },
  arrow: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-muted)',
    flexShrink: 0,
  },
} as const
