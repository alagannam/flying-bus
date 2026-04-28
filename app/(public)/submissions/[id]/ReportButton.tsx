'use client'

import { useState, useTransition } from 'react'
import { reportSubmission } from './actions'

type Props = { submissionId: string }

const REASONS = [
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'offensive',     label: 'Offensive or hateful' },
  { value: 'spam',          label: 'Spam or self-promotion' },
  { value: 'misleading',    label: 'Misleading or inaccurate' },
  { value: 'other',         label: 'Other' },
]

export function ReportButton({ submissionId }: Props) {
  const [open, setOpen]       = useState(false)
  const [reason, setReason]   = useState('')
  const [detail, setDetail]   = useState('')
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (done) {
    return (
      <p style={styles.thanks}>
        Report submitted. Thank you for helping keep the platform safe.
      </p>
    )
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={styles.trigger}>
        Report this content
      </button>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) { setError('Please select a reason.'); return }
    setError(null)

    startTransition(async () => {
      const result = await reportSubmission(submissionId, reason, detail.trim() || null)
      if (result?.error) {
        setError(result.error)
      } else {
        setDone(true)
      }
    })
  }

  const detailLeft = 500 - detail.length

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      <p style={styles.formHeading}>Report this submission</p>

      {error && (
        <p role="alert" style={styles.error}>{error}</p>
      )}

      <div style={styles.field}>
        <label htmlFor="report-reason" style={styles.label}>Reason</label>
        <select
          id="report-reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
          disabled={isPending}
          style={styles.select}
        >
          <option value="">Select a reason…</option>
          {REASONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div style={styles.field}>
        <div style={styles.labelRow}>
          <label htmlFor="report-detail" style={styles.label}>
            Additional detail{' '}
            <span style={styles.optional}>(optional)</span>
          </label>
          {detailLeft < 100 && (
            <span style={detailLeft < 20
              ? { ...styles.counter, ...styles.counterWarn }
              : styles.counter
            }>
              {detailLeft}
            </span>
          )}
        </div>
        <textarea
          id="report-detail"
          value={detail}
          onChange={e => setDetail(e.target.value)}
          maxLength={500}
          rows={3}
          disabled={isPending}
          placeholder="Tell us more about what you saw…"
          style={styles.textarea}
        />
      </div>

      <div style={styles.actions}>
        <button
          type="submit"
          disabled={isPending || !reason}
          style={isPending || !reason
            ? { ...styles.submitBtn, opacity: 0.6, cursor: 'not-allowed' }
            : styles.submitBtn
          }
        >
          {isPending ? 'Submitting…' : 'Submit report'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          style={styles.cancelBtn}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

const styles = {
  trigger: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
    padding: 'var(--space-5)',
    background: 'var(--color-surface-raised)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
  },
  formHeading: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    margin: 0,
  },
  error: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-error)',
    background: 'var(--color-error-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    margin: 0,
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
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-secondary)',
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
  select: {
    height: 36,
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
  submitBtn: {
    padding: 'var(--space-2) var(--space-5)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    fontWeight: 'var(--font-semibold)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
  },
  cancelBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  thanks: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
} as const
