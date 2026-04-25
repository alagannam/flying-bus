'use client'

import { useState, useTransition } from 'react'
import { parentApprove, parentReject } from '../actions'

export function ParentApprovalActions({ submissionId }: { submissionId: string }) {
  const [declineNote, setDeclineNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const result = await parentApprove(submissionId)
      if (result?.error) setError(result.error)
    })
  }

  function handleDecline() {
    if (!declineNote.trim()) {
      setError('Please enter a note explaining your decision.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await parentReject(submissionId, declineNote)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div style={styles.wrapper}>

      {error && (
        <div role="alert" style={styles.error}>{error}</div>
      )}

      {/* ── Approve ─────────────────────────────────────────── */}
      <div style={styles.section}>
        <h2 style={styles.approveHeading}>Approve and send to editors</h2>
        <p style={styles.desc}>
          Your child&apos;s submission will be sent to the Flying Bus editorial team for
          review. They make the final decision on whether it gets published.
        </p>
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          style={isPending ? { ...styles.approveBtn, opacity: 0.6, cursor: 'not-allowed' } : styles.approveBtn}
        >
          {isPending ? 'Sending…' : '✓ Approve and send to editors'}
        </button>
      </div>

      <div style={styles.divider} />

      {/* ── Decline ─────────────────────────────────────────── */}
      <div style={styles.section}>
        <h2 style={styles.declineHeading}>Decline this submission</h2>
        <p style={styles.desc}>
          Your child will receive your note and can submit new work in the future.
          A note is required — it is the only feedback they will receive from you.
        </p>
        <div style={styles.field}>
          <label htmlFor="decline-note" style={styles.label}>
            Note for your child <span style={styles.required}>(required)</span>
          </label>
          <textarea
            id="decline-note"
            value={declineNote}
            onChange={e => setDeclineNote(e.target.value)}
            placeholder="I&apos;d like you to review this before submitting because…"
            style={{
              ...styles.textarea,
              borderColor: declineNote.trim()
                ? 'var(--color-border-strong)'
                : 'var(--color-error)',
            }}
            disabled={isPending}
            rows={4}
          />
        </div>
        <button
          type="button"
          onClick={handleDecline}
          disabled={isPending || !declineNote.trim()}
          style={
            isPending || !declineNote.trim()
              ? { ...styles.declineBtn, opacity: 0.5, cursor: 'not-allowed' }
              : styles.declineBtn
          }
        >
          {isPending ? 'Saving…' : 'Decline'}
        </button>
      </div>

    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-6)',
  },
  error: {
    background: 'var(--color-error-surface)',
    color: 'var(--color-error)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    fontSize: 'var(--text-sm)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
  },
  approveHeading: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-success)',
  },
  declineHeading: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
  },
  desc: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-2)' },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
  },
  required: {
    fontWeight: 'var(--font-normal)',
    color: 'var(--color-error)',
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
  },
  divider: {
    height: 1,
    background: 'var(--color-border)',
  },
  approveBtn: {
    alignSelf: 'flex-start' as const,
    padding: 'var(--space-3) var(--space-6)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--color-success)',
    color: '#fff',
    fontWeight: 'var(--font-semibold)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
  },
  declineBtn: {
    alignSelf: 'flex-start' as const,
    padding: 'var(--space-3) var(--space-6)',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--color-border-strong)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontWeight: 'var(--font-semibold)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
  },
} as const
