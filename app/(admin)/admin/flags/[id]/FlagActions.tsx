'use client'

import { useState, useTransition } from 'react'
import { reviewFlag } from './actions'

type Props = { reportId: string }

export function FlagActions({ reportId }: Props) {
  const [note, setNote]         = useState('')
  const [activePending, setActivePending] = useState<'actioned' | 'dismissed' | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDecision(decision: 'actioned' | 'dismissed') {
    setError(null)
    setActivePending(decision)
    startTransition(async () => {
      const result = await reviewFlag(reportId, decision, note)
      if (result?.error) {
        setError(result.error)
        setActivePending(null)
      }
      // On success the server action calls redirect('/admin/flags') —
      // no client-side navigation needed.
    })
  }

  return (
    <div style={styles.container}>
      <p style={styles.heading}>Moderator decision</p>

      <div style={styles.field}>
        <label htmlFor="mod-note" style={styles.label}>
          Note{' '}
          <span style={styles.optional}>(optional — stored internally, not shown publicly)</span>
        </label>
        <textarea
          id="mod-note"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          disabled={isPending}
          placeholder="Internal note about this decision…"
          style={styles.textarea}
        />
      </div>

      {error && (
        <p role="alert" style={styles.error}>{error}</p>
      )}

      <div style={styles.actions}>
        <button
          type="button"
          onClick={() => handleDecision('actioned')}
          disabled={isPending}
          style={isPending
            ? { ...styles.actionedBtn, opacity: 0.6, cursor: 'not-allowed' }
            : styles.actionedBtn
          }
        >
          {isPending && activePending === 'actioned' ? 'Saving…' : 'Mark actioned'}
        </button>
        <button
          type="button"
          onClick={() => handleDecision('dismissed')}
          disabled={isPending}
          style={isPending
            ? { ...styles.dismissBtn, opacity: 0.6, cursor: 'not-allowed' }
            : styles.dismissBtn
          }
        >
          {isPending && activePending === 'dismissed' ? 'Saving…' : 'Dismiss'}
        </button>
      </div>

      <p style={styles.hint}>
        <strong>Mark actioned</strong> — you have taken a step (e.g. removed content, issued a warning via the user management page).
        {' '}<strong>Dismiss</strong> — no action required.
      </p>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-6)',
  },
  heading: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    margin: 0,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-secondary)',
  },
  optional: {
    fontWeight: 'var(--font-normal)',
    color: 'var(--color-text-muted)',
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
  error: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-error)',
    background: 'var(--color-error-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    margin: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    flexWrap: 'wrap' as const,
  },
  actionedBtn: {
    padding: 'var(--space-2) var(--space-5)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--color-error)',
    color: 'var(--color-text-inverse)',
    fontWeight: 'var(--font-semibold)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
  },
  dismissBtn: {
    padding: 'var(--space-2) var(--space-5)',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--color-border-strong)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    fontWeight: 'var(--font-medium)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
  },
  hint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    lineHeight: 'var(--leading-relaxed)',
    margin: 0,
  },
} as const
