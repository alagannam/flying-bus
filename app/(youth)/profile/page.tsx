import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'My Profile' }

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

type Profile = {
  display_name: string
  username: string
  bio: string | null
  creator_level: number
  creator_score: number
  coins_balance: number
  participation_score: number
  streak_current: number
  streak_longest: number
  is_profile_public: boolean
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

export default async function MyProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, badgesResult, subsResult] = await Promise.all([
    supabase
      .from('youth_profiles')
      .select('display_name, username, bio, creator_level, creator_score, coins_balance, participation_score, streak_current, streak_longest, is_profile_public, joined_at')
      .eq('user_id', user.id)
      .single(),

    supabase
      .from('youth_badges')
      .select('badge_slug, awarded_at, badge_definitions(name, icon_emoji, description)')
      .eq('user_id', user.id)
      .order('awarded_at', { ascending: false }),

    supabase
      .from('submissions')
      .select('id, title, published_at')
      .eq('youth_user_id', user.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5),
  ])

  if (!profileResult.data) redirect('/login')

  const profile = profileResult.data as Profile
  const badges  = (badgesResult.data  ?? []) as EarnedBadge[]
  const subs    = (subsResult.data    ?? []) as RecentSub[]

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
            <div style={styles.headerActions}>
              <span style={styles.levelBadge}>Level {profile.creator_level}</span>
              <Link href="/profile/edit" style={styles.editLink}>Edit profile</Link>
            </div>
          </div>

          {profile.bio && (
            <p style={styles.bio}>{profile.bio}</p>
          )}

          <p style={styles.joinedAt}>Member since {formatDate(profile.joined_at)}</p>
        </div>

        {/* ── Visibility notice ──────────────────────────────── */}
        {!profile.is_profile_public && (
          <div style={styles.privateBanner}>
            <p style={styles.privateBannerText}>
              <strong>Your profile isn&apos;t public yet.</strong> It will go live automatically when your first submission is published.
            </p>
          </div>
        )}

        {/* ── Private stats ──────────────────────────────────── */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statEmoji}>🪙</span>
            <p style={styles.statValue}>{profile.coins_balance.toLocaleString()}</p>
            <p style={styles.statLabel}>Kana Coins</p>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statEmoji}>⭐</span>
            <p style={styles.statValue}>{profile.creator_score.toLocaleString()}</p>
            <p style={styles.statLabel}>Creator score</p>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statEmoji}>📊</span>
            <p style={styles.statValue}>{profile.participation_score.toLocaleString()}</p>
            <p style={styles.statLabel}>Participation</p>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statEmoji}>🔥</span>
            <p style={styles.statValue}>{profile.streak_current}</p>
            <p style={styles.statLabel}>
              Day streak
              {profile.streak_longest > 0 && (
                <span style={styles.statSub}> · best {profile.streak_longest}</span>
              )}
            </p>
          </div>
        </div>

        {/* ── Badges ─────────────────────────────────────────── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Badges</h2>
          {badges.length > 0 ? (
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
          ) : (
            <div style={styles.empty}>
              <p style={styles.emptyText}>
                No badges yet —{' '}
                <Link href="/shop" style={styles.emptyShopLink}>
                  visit the shop
                </Link>
                {' '}to earn your first
              </p>
            </div>
          )}
        </div>

        {/* ── Published work ─────────────────────────────────── */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Published work</h2>
            <Link href="/my-submissions" style={styles.sectionLink}>See all →</Link>
          </div>

          {subs.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyText}>Nothing published yet.</p>
            </div>
          ) : (
            <ul style={styles.subList}>
              {subs.map(s => (
                <li key={s.id}>
                  <Link href={`/submissions/${s.id}`} style={styles.subCard}>
                    <span style={styles.subTitle}>{s.title}</span>
                    {s.published_at && (
                      <span style={styles.subDate}>
                        {new Date(s.published_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    )}
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
    padding: 'var(--space-8) var(--space-6)',
  },
  container: {
    maxWidth: 'var(--container-md)',
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
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-snug)',
  },
  username: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    flexShrink: 0,
  },
  levelBadge: {
    padding: 'var(--space-1) var(--space-3)',
    background: 'var(--color-primary-surface)',
    color: 'var(--color-primary)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
  },
  editLink: {
    padding: 'var(--space-2) var(--space-4)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
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
  privateBanner: {
    background: 'var(--color-surface-raised)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-4)',
  },
  privateBannerText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 'var(--space-3)',
  },
  statCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-4) var(--space-5)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
  },
  statEmoji: { fontSize: 'var(--text-xl)', lineHeight: 1 },
  statValue: {
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 1,
    marginTop: 'var(--space-2)',
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  statSub: {
    color: 'var(--color-text-muted)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
  },
  sectionLink: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: 'var(--font-medium)',
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
  emptyShopLink: {
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-medium)',
    textDecoration: 'none',
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
  subTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1,
    minWidth: 0,
  },
  subDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    flexShrink: 0,
  },
} as const
