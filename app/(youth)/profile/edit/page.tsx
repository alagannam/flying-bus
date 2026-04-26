import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditProfileForm } from './EditProfileForm'

export const metadata: Metadata = { title: 'Edit Profile' }

type ProfileForEdit = {
  display_name: string
  bio: string | null
  username: string
}

export default async function EditProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfile } = await supabase
    .from('youth_profiles')
    .select('display_name, bio, username')
    .eq('user_id', user.id)
    .single()

  if (!rawProfile) redirect('/login')

  const profile = rawProfile as ProfileForEdit

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <Link href="/profile" style={styles.back}>← My Profile</Link>

        <div style={styles.header}>
          <h1 style={styles.heading}>Edit profile</h1>
          <p style={styles.sub}>Update your display name and bio.</p>
        </div>

        <div style={styles.card}>
          <EditProfileForm
            currentDisplayName={profile.display_name}
            currentBio={profile.bio}
            username={profile.username}
          />
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
    gap: 'var(--space-1)',
  },
  heading: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
  },
  sub: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-8)',
  },
} as const
