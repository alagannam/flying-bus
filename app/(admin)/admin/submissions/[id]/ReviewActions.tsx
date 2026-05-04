'use client'

import { useState, useTransition } from 'react'
import { approveSubmission, rejectSubmission } from '../actions'

export function ReviewActions({ submissionId }: { submissionId: string }) {
  const [approveNote, setApproveNote] = useState('')
  const [rejectNote,  setRejectNote]  = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const result = await approveSubmission(submissionId, approveNote.trim() || null)
      if (result?.error) setError(result.error)
    })
  }

  function handleReject() {
    if (!rejectNote.trim()) {
      setError('Enter a feedback note before rejecting.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await rejectSubmission(submissionId, rejectNote)
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
        <h2 style={styles.approveHeading}>Approve and publish</h2>
        <p style={styles.sectionDesc}>
          The submission goes live immediately. The youth earns Kana Coins and
          receives a notification. An optional note is included in the notification.
        </p>
        <div style={styles.field}>
          <label htmlFor="approve-note" style={styles.label}>
            Note for youth <span style={styles.optional}>(optional)</span>
          </label>
          <textarea
            id="approve-note"
            value={approveNote}
            onChange={e => setApproveNote(e.target.value)}
            placeholder="Great work — keep it up!"
            style={styles.textarea}
            disabled={isPending}
            rows={3}
          />
        </div>
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          style={isPending ? { ...styles.approveBtn, opacity: 0.6, cursor: 'not-allowed' } : styles.approveBtn}
        >
          {isPending ? 'Publishing…' : '✓ Approve and publish'}
        </button>
      </div>

      <div style={styles.divider} />

      {/* ── Reject ──────────────────────────────────────────── */}
      <div style={styles.section}>
        <h2 style={styles.rejectHeading}>Do not approve</h2>
        <p style={styles.sectionDesc}>
          The youth is notified and receives your note as feedback. A note is
          required — it is the only guidance they get.
        </p>
        <div style={styles.field}>
          <label htmlFor="reject-note" style={styles.label}>
            Feedback note <span style={styles.required}>(required)</span>
          </label>
          <textarea
            id="reject-note"
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            placeholder="This submission needs a clearer introduction and…"
            style={{
              ...styles.textarea,
              borderColor: rejectNote.trim()
                ? 'var(--color-border-strong)'
                : 'var(--color-error)',
            }}
            disabled={isPending}
            rows={4}
          />
        </div>
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending || !rejectNote.trim()}
          style={
            isPending || !rejectNote.trim()
              ? { ...styles.rejectBtn, opacity: 0.5, cursor: 'not-allowed' }
              : styles.rejectBtn
          }
        >
          {isPending ? 'Saving…' : '✕ Do not approve'}
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
  rejectHeading: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
  },
  sectionDesc: {
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
  optional: {
    fontWeight: 'var(--font-normal)',
    color: 'var(--color-text-muted)',
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
  rejectBtn: {
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
