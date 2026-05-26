'use client'

import { useState, useTransition } from 'react'
import { saveDraft, createAndSubmit } from '../actions'

type Club = { id: string; name: string }

type Props = {
  clubs: Club[]
  challengeId?: string
  challengeTitle?: string
}

export function SubmissionForm({ clubs, challengeId, challengeTitle }: Props) {
  const [title,  setTitle]  = useState('')
  const [body,   setBody]   = useState('')
  const [clubId, setClubId] = useState('')
  const [error,  setError]  = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function buildFormData() {
    const fd = new FormData()
    fd.append('title',   title)
    fd.append('body',    body)
    fd.append('club_id', clubId)
    if (challengeId) fd.append('challenge_id', challengeId)
    return fd
  }

  function handleSaveDraft() {
    setError(null)
    startTransition(async () => {
      const result = await saveDraft(buildFormData())
      if (result?.error) setError(result.error)
    })
  }

  function handleSubmitForReview() {
    setError(null)
    startTransition(async () => {
      const result = await createAndSubmit(buildFormData())
      if (result?.error) setError(result.error)
    })
  }

  const titleOver   = title.length > 180
  const bodyTooShort = body.length > 0 && body.length < 20

  return (
    <div style={styles.wrapper}>
      {challengeTitle && (
        <div style={styles.challengeBanner}>
          Responding to challenge: <strong>{challengeTitle}</strong>
        </div>
      )}

      {error && (
        <div role="alert" style={styles.error}>{error}</div>
      )}

      <div style={styles.field}>
        <div style={styles.labelRow}>
          <label htmlFor="title" style={styles.label}>Title</label>
          <span style={{ ...styles.counter, color: titleOver ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
            {title.length} / 200
          </span>
        </div>
        <input
          id="title"
          type="text"
          maxLength={200}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Give your work a title"
          style={styles.input}
          disabled={isPending}
        />
      </div>

      <div style={styles.field}>
        <div style={styles.labelRow}>
          <label htmlFor="body" style={styles.label}>Your submission</label>
          <span style={{ ...styles.counter, color: bodyTooShort ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
            {body.length} chars{bodyTooShort ? ' (min 20)' : ''}
          </span>
        </div>
        <textarea
          id="body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your submission here…"
          style={styles.textarea}
          disabled={isPending}
          rows={12}
        />
      </div>

      <div style={styles.field}>
        <label htmlFor="club_id" style={styles.label}>
          Club <span style={styles.optional}>(optional)</span>
        </label>
        <select
          id="club_id"
          value={clubId}
          onChange={e => setClubId(e.target.value)}
          style={styles.select}
          disabled={isPending}
        >
          <option value="">— No club —</option>
          {clubs.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div style={styles.actions}>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isPending || title.trim().length < 3}
          style={isPending ? { ...styles.secondary, opacity: 0.6, cursor: 'not-allowed' } : styles.secondary}
        >
          {isPending ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={handleSubmitForReview}
          disabled={isPending || title.trim().length < 3 || body.length < 20}
          style={
            isPending || title.trim().length < 3 || body.length < 20
              ? { ...styles.primary, opacity: 0.5, cursor: 'not-allowed' }
              : styles.primary
          }
        >
          {isPending ? 'Submitting…' : 'Submit for review'}
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
  },
  error: {
    background: 'var(--color-error-surface)',
    color: 'var(--color-error)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    fontSize: 'var(--text-sm)',
  },
  challengeBanner: {
    background: 'var(--color-info-surface)',
    color: 'var(--color-info)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    fontSize: 'var(--text-sm)',
    border: '1px solid var(--color-info)',
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-2)' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
  },
  optional: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-normal)',
    color: 'var(--color-text-muted)',
  },
  counter: { fontSize: 'var(--text-xs)' },
  input: {
    height: 44,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    padding: '0 var(--space-3)',
    fontSize: 'var(--text-base)',
    color: 'var(--color-text)',
    background: 'var(--color-surface)',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    padding: 'var(--space-3)',
    fontSize: 'var(--text-base)',
    color: 'var(--color-text)',
    background: 'var(--color-surface)',
    width: '100%',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    lineHeight: 'var(--leading-relaxed)',
  },
  select: {
    height: 44,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    padding: '0 var(--space-3)',
    fontSize: 'var(--text-base)',
    color: 'var(--color-text)',
    background: 'var(--color-surface)',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  actions: {
    display: 'flex',
    gap: 'var(--space-3)',
    justifyContent: 'flex-end',
    paddingTop: 'var(--space-2)',
  },
  secondary: {
    height: 44,
    padding: '0 var(--space-6)',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--color-border-strong)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontWeight: 'var(--font-medium)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
  },
  primary: {
    height: 44,
    padding: '0 var(--space-6)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    fontWeight: 'var(--font-semibold)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
  },
} as const
