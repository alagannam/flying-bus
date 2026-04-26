'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateProfile } from './actions'

type Props = {
  currentDisplayName: string
  currentBio: string | null
  username: string
}

export function EditProfileForm({ currentDisplayName, currentBio, username }: Props) {
  const [displayName, setDisplayName] = useState(currentDisplayName)
  const [bio, setBio]                 = useState(currentBio ?? '')
  const [error, setError]             = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.set('display_name', displayName)
    formData.set('bio', bio)

    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result?.error) setError(result.error)
      // On success the server action calls redirect('/profile') — no
      // client-side navigation needed here.
    })
  }

  const displayNameLeft = 40 - displayName.length
  const bioLeft         = 200 - bio.length

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>

      {error && (
        <div role="alert" style={styles.error}>{error}</div>
      )}

      {/* Username — read-only display, never part of form submission */}
      <div style={styles.field}>
        <p style={styles.label}>Username</p>
        <p style={styles.usernameValue}>@{username}</p>
        <p style={styles.hint}>Usernames cannot be changed after signup.</p>
      </div>

      {/* Display name */}
      <div style={styles.field}>
        <div style={styles.labelRow}>
          <label htmlFor="display_name" style={styles.label}>Display name</label>
          <span style={displayNameLeft < 6
            ? { ...styles.counter, ...styles.counterWarn }
            : styles.counter
          }>
            {displayNameLeft}
          </span>
        </div>
        <input
          id="display_name"
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          maxLength={40}
          required
          disabled={isPending}
          autoComplete="off"
          style={styles.input}
        />
        <p style={styles.hint}>The name shown on your profile and submissions.</p>
      </div>

      {/* Bio */}
      <div style={styles.field}>
        <div style={styles.labelRow}>
          <label htmlFor="bio" style={styles.label}>
            Bio <span style={styles.optional}>(optional)</span>
          </label>
          <span style={bioLeft < 20
            ? { ...styles.counter, ...styles.counterWarn }
            : styles.counter
          }>
            {bioLeft}
          </span>
        </div>
        <textarea
          id="bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={200}
          rows={3}
          disabled={isPending}
          placeholder="Tell other creators a bit about yourself…"
          style={styles.textarea}
        />
      </div>

      <div style={styles.actions}>
        <button
          type="submit"
          disabled={isPending}
          style={isPending
            ? { ...styles.saveBtn, opacity: 0.6, cursor: 'not-allowed' }
            : styles.saveBtn
          }
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
        <Link href="/profile" style={styles.cancelLink}>Cancel</Link>
      </div>

    </form>
  )
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  error: {
    background: 'var(--color-error-surface)',
    color: 'var(--color-error)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    fontSize: 'var(--text-sm)',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 'var(--space-2)',
  },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    margin: 0,
  },
  optional: {
    fontWeight: 'var(--font-normal)',
    color: 'var(--color-text-muted)',
  },
  counter: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    flexShrink: 0,
  },
  counterWarn: { color: 'var(--color-warning)' },
  usernameValue: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-secondary)',
    margin: 0,
  },
  hint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
  input: {
    height: 40,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    padding: '0 var(--space-3)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    background: 'var(--color-surface)',
    outline: 'none',
    width: '100%',
  },
  textarea: {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    padding: 'var(--space-3)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    background: 'var(--color-surface)',
    width: '100%',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    lineHeight: 'var(--leading-relaxed)',
    outline: 'none',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  saveBtn: {
    padding: 'var(--space-3) var(--space-6)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    fontWeight: 'var(--font-semibold)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
  },
  cancelLink: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    fontWeight: 'var(--font-medium)',
  },
} as const
