'use client'

import { useState, useTransition } from 'react'
import { updatePrivacy } from './actions'

type Props = {
  defaultChecked: boolean
  username: string
}

export function PrivacyToggle({ defaultChecked, username }: Props) {
  const [checked, setChecked]   = useState(defaultChecked)
  const [saved,   setSaved]     = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setChecked(e.target.checked)
    setSaved(false)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    setError(null)

    const formData = new FormData()
    formData.set('is_profile_public', checked ? 'true' : 'false')

    startTransition(async () => {
      const result = await updatePrivacy(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>

      <label style={styles.row}>
        <div style={styles.labelGroup}>
          <span style={styles.labelText}>Public profile</span>
          <span style={styles.labelDesc}>
            {checked
              ? `Your profile is visible to anyone at /profile/${username}.`
              : 'Your profile is private — only you can see it.'
            }
          </span>
        </div>
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={isPending}
          style={styles.checkbox}
        />
      </label>

      {error  && <p role="alert" style={styles.error}>{error}</p>}
      {saved  && <p style={styles.success}>Saved.</p>}

      <div style={styles.actions}>
        <button
          type="submit"
          disabled={isPending}
          style={isPending ? { ...styles.btn, opacity: 0.6, cursor: 'not-allowed' } : styles.btn}
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

    </form>
  )
}

const styles = {
  form: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-4)',
  },
  row: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            'var(--space-6)',
    cursor:         'pointer',
  },
  labelGroup: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-1)',
  },
  labelText: {
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
  },
  labelDesc: {
    fontSize: 'var(--text-xs)',
    color:    'var(--color-text-muted)',
  },
  checkbox: {
    width:     18,
    height:    18,
    flexShrink: 0,
    marginTop:  2,
    cursor:    'pointer',
    accentColor: 'var(--color-primary)',
  },
  error: {
    fontSize:     'var(--text-sm)',
    color:        'var(--color-error)',
    background:   'var(--color-error-surface)',
    borderRadius: 'var(--radius-md)',
    padding:      'var(--space-3) var(--space-4)',
    margin:       0,
  },
  success: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-success)',
    margin:   0,
  },
  actions: {
    display: 'flex',
  },
  btn: {
    padding:      'var(--space-2) var(--space-5)',
    borderRadius: 'var(--radius-full)',
    border:       'none',
    background:   'var(--color-primary)',
    color:        'var(--color-text-inverse)',
    fontWeight:   'var(--font-semibold)',
    fontSize:     'var(--text-sm)',
    cursor:       'pointer',
  },
} as const
