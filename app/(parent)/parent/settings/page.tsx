import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { GuardianPermissionsForm } from './GuardianPermissionsForm'

export const metadata: Metadata = { title: 'Parent Settings' }

type GuardianLink = {
  id: string
  child_user_id: string
  publish_requires_approval: boolean
  spending_requires_approval: boolean
}

type YouthProfile = {
  user_id: string
  display_name: string
  username: string
}

export default async function ParentSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Anon client — RLS ensures parent sees only their own links.
  const { data: rawLinks } = await supabase
    .from('guardian_links')
    .select('id, child_user_id, publish_requires_approval, spending_requires_approval')
    .eq('parent_user_id', user.id)
    .eq('status', 'active')

  const links    = (rawLinks ?? []) as GuardianLink[]
  const childIds = links.map(l => l.child_user_id)

  let profileMap = new Map<string, YouthProfile>()
  if (childIds.length > 0) {
    const service = createServiceClient()
    const { data: rawProfiles } = await service
      .from('youth_profiles')
      .select('user_id, display_name, username')
      .in('user_id', childIds)
    profileMap = new Map(
      ((rawProfiles ?? []) as YouthProfile[]).map(p => [p.user_id, p])
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.topBar}>
          <div>
            <h1 style={styles.heading}>Settings</h1>
            <p style={styles.sub}>Manage oversight settings for each linked child.</p>
          </div>
          <Link href="/parent/dashboard" style={styles.backLink}>
            ← Dashboard
          </Link>
        </div>

        {links.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyHeading}>No linked children</p>
            <p style={styles.emptyText}>
              Settings will appear here once a guardian link is active.
            </p>
          </div>
        ) : (
          <div style={styles.childList}>
            {links.map(link => {
              const profile       = profileMap.get(link.child_user_id)
              const childName     = profile?.display_name ?? 'Your child'
              const childFirstName = childName.split(' ')[0]

              return (
                <div key={link.child_user_id} style={styles.card}>

                  {/* Card header */}
                  <div style={styles.cardHeader}>
                    <div>
                      <p style={styles.childName}>{childName}</p>
                      {profile?.username && (
                        <p style={styles.childUsername}>@{profile.username}</p>
                      )}
                    </div>
                    <Link
                      href={`/parent/children/${link.child_user_id}`}
                      style={styles.profileLink}
                    >
                      View profile →
                    </Link>
                  </div>

                  <hr style={styles.divider} />

                  <GuardianPermissionsForm
                    childUserId={link.child_user_id}
                    childFirstName={childFirstName}
                    publishRequiresApproval={link.publish_requires_approval}
                    spendingRequiresApproval={link.spending_requires_approval}
                  />

                </div>
              )
            })}
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
    padding: 'var(--space-8) var(--space-6)',
  },
  container: {
    maxWidth: 'var(--container-md)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 'var(--space-4)',
    flexWrap: 'wrap' as const,
  },
  heading: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  sub: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    marginTop: 'var(--space-1)',
  },
  backLink: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    flexShrink: 0,
  },
  empty: {
    padding: 'var(--space-16)',
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
  },
  emptyHeading: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    marginBottom: 'var(--space-2)',
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
  childList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--space-4)',
  },
  childName: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    margin: 0,
  },
  childUsername: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    margin: 'var(--space-1) 0 0',
  },
  profileLink: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-medium)',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--color-border)',
    margin: 0,
  },
} as const
