'use client'

import { useState, useTransition } from 'react'
import { setRaisedAmount } from './actions'

type Props = {
  campaignId:           string
  campaignTitle:        string
  initialRaisedDollars: string
  goalDollarsLabel:     string
}

export function AdminRaisedForm({
  campaignId,
  campaignTitle,
  initialRaisedDollars,
  goalDollarsLabel,
}: Props) {
  const [value, setValue]   = useState(initialRaisedDollars)
  const [error, setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await setRaisedAmount(form)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      <input type="hidden" name="campaign_id" value={campaignId} />

      <div style={styles.header}>
        <p style={styles.title}>{campaignTitle}</p>
        <p style={styles.sub}>Goal: {goalDollarsLabel}</p>
      </div>

      <div style={styles.row}>
        <label htmlFor="raised_dollars" style={styles.label}>
          Raised so far (USD)
        </label>
        <div style={styles.inputWrap}>
          <span style={styles.prefix}>$</span>
          <input
            id="raised_dollars"
            name="raised_dollars"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            required
            disabled={isPending}
            value={value}
            onChange={e => { setValue(e.target.value); setSuccess(false) }}
            style={styles.input}
          />
        </div>
        <button type="submit" disabled={isPending} style={styles.submit}>
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      <p style={styles.hint}>
        Dollars only — no coins or token logic. Saves as integer cents.
      </p>

      {error   && <div role="alert" style={styles.error}>{error}</div>}
      {success && <div role="status" style={styles.success}>Saved.</div>}
    </form>
  )
}

const styles = {
  form: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-3)',
    background:    'var(--color-surface)',
    border:        '1px solid var(--color-border)',
    borderRadius:  'var(--radius-xl)',
    padding:       'var(--space-5) var(--space-6)',
  },
  header: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-1)',
  },
  title: {
    fontSize:   'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
    margin:     0,
  },
  sub: {
    fontSize: 'var(--text-xs)',
    color:    'var(--color-text-muted)',
    margin:   0,
  },
  row: {
    display:    'flex',
    gap:        'var(--space-3)',
    alignItems: 'flex-end',
    flexWrap:   'wrap' as const,
  },
  label: {
    display:    'block',
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color:      'var(--color-text)',
    marginBottom: 'var(--space-1)',
  },
  inputWrap: {
    position:   'relative' as const,
    display:    'flex',
    alignItems: 'center',
    flex:       '1 1 200px',
  },
  prefix: {
    position:   'absolute' as const,
    left:       'var(--space-3)',
    fontSize:   'var(--text-sm)',
    color:      'var(--color-text-muted)',
    pointerEvents: 'none' as const,
  },
  input: {
    height:       40,
    width:        '100%',
    borderRadius: 'var(--radius-md)',
    border:       '1px solid var(--color-border-strong)',
    padding:      `0 var(--space-3) 0 var(--space-6)`,
    fontSize:     'var(--text-sm)',
    color:        'var(--color-text)',
    background:   'var(--color-surface)',
    outline:      'none',
    fontVariantNumeric: 'tabular-nums',
  },
  submit: {
    height:       40,
    padding:      '0 var(--space-5)',
    borderRadius: 'var(--radius-full)',
    border:       'none',
    background:   'var(--color-primary)',
    color:        'var(--color-text-inverse)',
    fontWeight:   'var(--font-semibold)',
    fontSize:     'var(--text-sm)',
    cursor:       'pointer',
  },
  hint: {
    fontSize: 'var(--text-xs)',
    color:    'var(--color-text-muted)',
    margin:   0,
  },
  error: {
    background:   'var(--color-error-surface)',
    color:        'var(--color-error)',
    borderRadius: 'var(--radius-md)',
    padding:      `var(--space-2) var(--space-3)`,
    fontSize:     'var(--text-xs)',
  },
  success: {
    background:   'var(--color-success-surface)',
    color:        'var(--color-success)',
    borderRadius: 'var(--radius-md)',
    padding:      `var(--space-2) var(--space-3)`,
    fontSize:     'var(--text-xs)',
  },
} as const
