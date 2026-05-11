import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My Children' }

type GuardianLink = { child_user_id: string }
type YouthProfile = { user_id: string; display_name: string; username: string }

export default async function ChildrenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Anon client — guardian_links_select_parent RLS scopes this to the
  // authenticated parent's own links. No service client needed here.
  const { data: rawLinks } = await supabase
    .from('guardian_links')
    .select('child_user_id')
    .eq('parent_user_id', user.id)
    .eq('status', 'active')

  const links    = (rawLinks ?? []) as GuardianLink[]
  const childIds = links.map(l => l.child_user_id)

  if (childIds.length === 0) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.heading}>My Children</h1>
          <div style={styles.empty}>
            <p style={styles.emptyHeading}>No linked children yet</p>
            <p style={styles.emptyText}>
              Once your child accepts a guardian link you&apos;ll see them here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Service client — youth_profiles has no parent SELECT RLS policy.
  // Scoped to the child IDs already confirmed by the guardian_links query above.
  const { data: rawProfiles } = await createServiceClient()
    .from('youth_profiles')
    .select('user_id, display_name, username')
    .in('user_id', childIds)

  const profiles   = (rawProfiles ?? []) as YouthProfile[]
  const profileMap = new Map(profiles.map(p => [p.user_id, p]))

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.topRow}>
          <h1 style={styles.heading}>My Children</h1>
          <span style={styles.count}>
            {childIds.length === 1 ? '1 linked child' : `${childIds.length} linked children`}
          </span>
        </div>

        <ul style={styles.list}>
          {childIds.map(childId => {
            const profile = profileMap.get(childId)
            if (!profile) return null
            return (
              <li key={childId}>
                <Link href={`/parent/children/${childId}`} style={styles.card}>
                  <div style={styles.cardLeft}>
                    <span style={styles.displayName}>{profile.display_name}</span>
                    <span style={styles.username}>@{profile.username}</span>
                  </div>
                  <span style={styles.arrow}>→</span>
                </Link>
              </li>
            )
          })}
        </ul>

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
    maxWidth:      'var(--container-sm)',
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
    color:      'var(--color-text-muted)',
    fontWeight: 'var(--font-medium)',
  },
  list: {
    listStyle:     'none',
    padding:       0,
    margin:        0,
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
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
  cardLeft: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-1)',
    minWidth:      0,
  },
  displayName: {
    fontSize:   'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
  },
  username: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
  },
  arrow: {
    fontSize:   'var(--text-base)',
    color:      'var(--color-text-muted)',
    flexShrink: 0,
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
} as const
