'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveSpend, rejectSpend } from './actions'

type Props = {
  requestId:     string
  childName:     string
  itemName:      string
  coinsAmount:   number
  formattedDate: string
}

export function SpendApprovalCard({
  requestId,
  childName,
  itemName,
  coinsAmount,
  formattedDate,
}: Props) {
  const router                       = useRouter()
  const [outcome, setOutcome]        = useState<'approved' | 'rejected' | null>(null)
  const [error, setError]            = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const result = await approveSpend(requestId)
      if (result.error) {
        setError(result.error)
      } else {
        setOutcome('approved')
        router.refresh()  // re-fetch server data so the count badge updates
      }
    })
  }

  function handleReject() {
    setError(null)
    startTransition(async () => {
      const result = await rejectSpend(requestId)
      if (result.error) {
        setError(result.error)
      } else {
        setOutcome('rejected')
        router.refresh()  // re-fetch server data so the count badge updates
      }
    })
  }

  // ── Terminal states ─────────────────────────────────────────

  if (outcome === 'approved') {
    return (
      <li style={{ ...styles.card, ...styles.cardApproved }}>
        <span style={styles.outcomeIcon}>✓</span>
        <div>
          <p style={styles.outcomeTitle}>Approved</p>
          <p style={styles.outcomeSub}>
            {coinsAmount.toLocaleString()} coins deducted for {childName}.
          </p>
        </div>
      </li>
    )
  }

  if (outcome === 'rejected') {
    return (
      <li style={{ ...styles.card, ...styles.cardRejected }}>
        <span style={styles.outcomeIcon}>✕</span>
        <div>
          <p style={styles.outcomeTitle}>Rejected</p>
          <p style={styles.outcomeSub}>
            {childName}&apos;s request for {itemName} was declined.
          </p>
        </div>
      </li>
    )
  }

  // ── Pending state ───────────────────────────────────────────

  return (
    <li style={styles.card}>
      <div style={styles.info}>
        <p style={styles.itemName}>{itemName}</p>
        <p style={styles.meta}>
          {childName}
          <span style={styles.dot}>·</span>
          {coinsAmount.toLocaleString()} coins
          <span style={styles.dot}>·</span>
          {formattedDate}
        </p>
      </div>

      {error && (
        <p role="alert" style={styles.error}>{error}</p>
      )}

      <div style={styles.actions}>
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          style={isPending ? { ...styles.approveBtn, opacity: 0.6 } : styles.approveBtn}
        >
          {isPending ? '…' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          style={isPending ? { ...styles.rejectBtn, opacity: 0.6 } : styles.rejectBtn}
        >
          {isPending ? '…' : 'Reject'}
        </button>
      </div>
    </li>
  )
}

const styles = {
  card: {
    display:        'flex',
    alignItems:     'center',
    gap:            'var(--space-4)',
    background:     'var(--color-surface)',
    borderRadius:   'var(--radius-lg)',
    border:         '1px solid var(--color-border)',
    padding:        'var(--space-4) var(--space-5)',
  },
  cardApproved: {
    background:     'var(--color-success-surface)',
    borderColor:    'var(--color-success)',
  },
  cardRejected: {
    background:     'var(--color-surface)',
    borderColor:    'var(--color-border)',
    opacity:        0.6,
  },
  outcomeIcon: {
    fontSize:   'var(--text-base)',
    flexShrink: 0,
  },
  outcomeTitle: {
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
    margin:     0,
  },
  outcomeSub: {
    fontSize:   'var(--text-xs)',
    color:      'var(--color-text-muted)',
    margin:     0,
  },
  info: {
    flex:     1,
    minWidth: 0,
  },
  itemName: {
    fontSize:     'var(--text-base)',
    fontWeight:   'var(--font-medium)',
    color:        'var(--color-text)',
    margin:       0,
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap' as const,
  },
  meta: {
    display:    'flex',
    alignItems: 'center',
    flexWrap:   'wrap' as const,
    gap:        'var(--space-2)',
    fontSize:   'var(--text-xs)',
    color:      'var(--color-text-muted)',
    marginTop:  'var(--space-1)',
  },
  dot: { color: 'var(--color-border-strong)' },
  error: {
    fontSize:   'var(--text-xs)',
    color:      'var(--color-error)',
    margin:     0,
    flexShrink: 0,
  },
  actions: {
    display:    'flex',
    gap:        'var(--space-2)',
    flexShrink: 0,
  },
  approveBtn: {
    padding:      'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-full)',
    border:       'none',
    background:   'var(--color-success)',
    color:        '#fff',
    fontWeight:   'var(--font-semibold)',
    fontSize:     'var(--text-sm)',
    cursor:       'pointer',
    whiteSpace:   'nowrap' as const,
  },
  rejectBtn: {
    padding:      'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-full)',
    border:       '1px solid var(--color-border-strong)',
    background:   'var(--color-surface)',
    color:        'var(--color-text)',
    fontWeight:   'var(--font-semibold)',
    fontSize:     'var(--text-sm)',
    cursor:       'pointer',
    whiteSpace:   'nowrap' as const,
  },
} as const
