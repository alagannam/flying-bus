import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrivacyToggle } from './PrivacyToggle'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Settings' }

type ProfileRow = {
  username:          string
  is_profile_public: boolean
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfile } = await supabase
    .from('youth_profiles')
    .select('username, is_profile_public')
    .eq('user_id', user.id)
    .single()

  if (!rawProfile) redirect('/login')

  const profile = rawProfile as ProfileRow

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <h1 style={styles.heading}>Settings</h1>

        {/* ── Account ─────────────────────────────────────────── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Account</h2>

          <div style={styles.card}>
            <div style={styles.field}>
              <p style={styles.fieldLabel}>Email</p>
              <p style={styles.fieldValue}>{user.email}</p>
            </div>

            <div style={styles.divider} />

            <div style={styles.field}>
              <p style={styles.fieldLabel}>Username</p>
              <p style={styles.fieldValue}>@{profile.username}</p>
              <p style={styles.fieldHint}>Usernames cannot be changed after signup.</p>
            </div>

            <div style={styles.divider} />

            <Link href="/profile/edit" style={styles.editLink}>
              Edit display name and bio →
            </Link>
          </div>
        </div>

        {/* ── Privacy ─────────────────────────────────────────── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Privacy</h2>

          <div style={styles.card}>
            <PrivacyToggle
              defaultChecked={profile.is_profile_public}
              username={profile.username}
            />
          </div>
        </div>

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
    gap:           'var(--space-8)',
  },
  heading: {
    fontSize:   'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
  },

  // ── Sections ──────────────────────────────────────────────────────
  section: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-4)',
  },
  sectionTitle: {
    fontSize:   'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin:     0,
  },
  card: {
    background:    'var(--color-surface)',
    border:        '1px solid var(--color-border)',
    borderRadius:  'var(--radius-xl)',
    padding:       'var(--space-5) var(--space-6)',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-4)',
  },

  // ── Account fields ────────────────────────────────────────────────
  field: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-1)',
  },
  fieldLabel: {
    fontSize:   'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text-muted)',
    margin:     0,
  },
  fieldValue: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text)',
    margin:   0,
  },
  fieldHint: {
    fontSize: 'var(--text-xs)',
    color:    'var(--color-text-muted)',
    margin:   0,
  },
  divider: {
    height:     1,
    background: 'var(--color-border)',
    marginInline: 'calc(var(--space-6) * -1)',
  },
  editLink: {
    fontSize:       'var(--text-sm)',
    fontWeight:     'var(--font-medium)',
    color:          'var(--color-primary)',
    textDecoration: 'none',
  },
} as const
