'use client'

import { useState, useTransition } from 'react'
import { updateGuardianPermissions } from './actions'

type Props = {
  childUserId: string
  childFirstName: string
  publishRequiresApproval: boolean
  spendingRequiresApproval: boolean
}

export function GuardianPermissionsForm({
  childUserId,
  childFirstName,
  publishRequiresApproval: initialPublish,
  spendingRequiresApproval: initialSpending,
}: Props) {
  const [publish, setPublish]   = useState(initialPublish)
  const [spending, setSpending] = useState(initialSpending)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleChange() {
    setSaved(false)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateGuardianPermissions(childUserId, publish, spending)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>

      <label style={styles.toggleRow}>
        <input
          type="checkbox"
          checked={publish}
          onChange={e => { setPublish(e.target.checked); handleChange() }}
          style={styles.checkbox}
          disabled={isPending}
        />
        <span style={styles.toggleText}>
          <strong>Submissions require your approval</strong>
          <span style={styles.hint}>
            Before {childFirstName}&apos;s work is sent to editors, you&apos;ll review it first.
          </span>
        </span>
      </label>

      <label style={styles.toggleRow}>
        <input
          type="checkbox"
          checked={spending}
          onChange={e => { setSpending(e.target.checked); handleChange() }}
          style={styles.checkbox}
          disabled={isPending}
        />
        <span style={styles.toggleText}>
          <strong>Coin spending requires your approval</strong>
          <span style={styles.hint}>
            {childFirstName} must get your OK before spending Kana Coins.
          </span>
        </span>
      </label>

      {error && (
        <p role="alert" style={styles.error}>{error}</p>
      )}
      {saved && (
        <p role="status" style={styles.success}>Settings saved.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={isPending
          ? { ...styles.btn, opacity: 0.6, cursor: 'not-allowed' }
          : styles.btn
        }
      >
        {isPending ? 'Saving…' : 'Save settings'}
      </button>

    </form>
  )
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-3)',
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: 2,
    width: 16,
    height: 16,
    flexShrink: 0,
    cursor: 'pointer',
    accentColor: 'var(--color-primary)',
  },
  toggleText: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-snug)',
  },
  hint: {
    display: 'block',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    fontWeight: 400,
  },
  error: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-error)',
    background: 'var(--color-error-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    margin: 0,
  },
  success: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-success)',
    background: 'var(--color-success-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    margin: 0,
  },
  btn: {
    alignSelf: 'flex-start' as const,
    padding: 'var(--space-2) var(--space-5)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    fontWeight: 'var(--font-semibold)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
  },
} as const
