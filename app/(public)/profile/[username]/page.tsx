import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── Public profile privacy contract ──────────────────────────
// This page is only reachable for profiles where is_profile_public = true.
// The query filters on that column, so a private or non-existent username
// both result in notFound() — the caller cannot distinguish the two cases.
// age_band is never selected, never passed to any component, never rendered.

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

type PublicProfile = {
  user_id: string
  display_name: string
  username: string
  bio: string | null
  creator_level: number
  creator_score: number
  joined_at: string
}

type EarnedBadge = {
  badge_slug: string
  awarded_at: string
  badge_definitions: {
    name: string
    icon_emoji: string
    description: string
  } | null
}

type RecentSub = {
  id: string
  title: string
  published_at: string | null
}

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('youth_profiles')
    .select('display_name')
    .eq('username', username)
    .eq('is_profile_public', true)
    .maybeSingle()
  const row = data as { display_name?: string } | null
  return { title: row?.display_name ?? 'Profile' }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  // is_profile_public = true is an explicit filter, not just a display
  // concern. A private profile and a non-existent profile both return
  // notFound() here — no information leaked about which it is.
  const { data: rawProfile } = await supabase
    .from('youth_profiles')
    .select('user_id, display_name, username, bio, creator_level, creator_score, joined_at')
    .eq('username', username)
    .eq('is_profile_public', true)
    .maybeSingle()

  if (!rawProfile) notFound()

  const profile = rawProfile as PublicProfile

  const [badgesResult, subsResult] = await Promise.all([
    supabase
      .from('youth_badges')
      .select('badge_slug, awarded_at, badge_definitions(name, icon_emoji, description)')
      .eq('user_id', profile.user_id)
      .order('awarded_at', { ascending: false }),

    supabase
      .from('submissions')
      .select('id, title, published_at')
      .eq('youth_user_id', profile.user_id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(10),
  ])

  const badges = (badgesResult.data ?? []) as EarnedBadge[]
  const subs   = (subsResult.data   ?? []) as RecentSub[]

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Profile header ─────────────────────────────────── */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div style={styles.identity}>
              <h1 style={styles.displayName}>{profile.display_name}</h1>
              <p style={styles.username}>@{profile.username}</p>
            </div>
            <span style={styles.levelBadge}>Level {profile.creator_level}</span>
          </div>

          {profile.bio && (
            <p style={styles.bio}>{profile.bio}</p>
          )}

          <p style={styles.joinedAt}>Member since {formatDate(profile.joined_at)}</p>
        </div>

        {/* ── Creator score ──────────────────────────────────── */}
        <div style={styles.scoreRow}>
          <span style={styles.scoreValue}>
            {profile.creator_score.toLocaleString()}
          </span>
          <span style={styles.scoreLabel}>Creator score</span>
        </div>

        {/* ── Badges ─────────────────────────────────────────── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Badges</h2>
          {badges.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyText}>No badges earned yet.</p>
            </div>
          ) : (
            <div style={styles.badgeGrid}>
              {badges.map(b => (
                <div key={b.badge_slug} style={styles.badgeCard}>
                  <span style={styles.badgeEmoji}>
                    {b.badge_definitions?.icon_emoji ?? '🏅'}
                  </span>
                  <div>
                    <p style={styles.badgeName}>
                      {b.badge_definitions?.name ?? b.badge_slug}
                    </p>
                    {b.badge_definitions?.description && (
                      <p style={styles.badgeDesc}>{b.badge_definitions.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Published work ─────────────────────────────────── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Published work</h2>

          {subs.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyText}>Nothing published yet.</p>
            </div>
          ) : (
            <ul style={styles.subList}>
              {subs.map(s => (
                <li key={s.id}>
                  <Link href={`/submissions/${s.id}`} style={styles.subCard}>
                    <div style={styles.subMain}>
                      <span style={styles.subTitle}>{s.title}</span>
                      {s.published_at && (
                        <span style={styles.subDate}>{formatDate(s.published_at)}</span>
                      )}
                    </div>
                    <span style={styles.subArrow}>→</span>
                  </Link>
                </li>
              ))}
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
    maxWidth: 'var(--container-sm)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-8)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--space-4)',
    flexWrap: 'wrap' as const,
  },
  identity: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
  },
  displayName: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
  },
  username: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  levelBadge: {
    padding: 'var(--space-1) var(--space-3)',
    background: 'var(--color-primary-surface)',
    color: 'var(--color-primary)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  bio: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
  },
  joinedAt: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--space-3)',
    padding: 'var(--space-5) var(--space-6)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
  },
  scoreValue: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    fontVariantNumeric: 'tabular-nums',
  },
  scoreLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
  },
  badgeGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  badgeCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-3)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-3) var(--space-4)',
  },
  badgeEmoji: { fontSize: 'var(--text-xl)', flexShrink: 0, lineHeight: 1, marginTop: 2 },
  badgeName: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
  },
  badgeDesc: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    marginTop: 'var(--space-1)',
  },
  empty: {
    padding: 'var(--space-8)',
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  subList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  subCard: {
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
  subMain: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
    flex: 1,
    minWidth: 0,
  },
  subTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  subDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  subArrow: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-muted)',
    flexShrink: 0,
  },
} as const
