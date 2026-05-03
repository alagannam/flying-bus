'use client'

import { useState, useTransition } from 'react'
import { initiatePurchase } from './actions'
import type { PurchaseResult } from './actions'

type Props = {
  itemId:      string
  price:       number
  userBalance: number
}

export function PurchaseButton({ itemId, price, userBalance }: Props) {
  const [result, setResult]     = useState<PurchaseResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const canAfford = userBalance >= price

  function handlePurchase() {
    startTransition(async () => {
      const r = await initiatePurchase(itemId)
      setResult(r)
    })
  }

  // ── Terminal states — replace button with status card ────────────

  if (result?.status === 'purchased') {
    return (
      <div style={styles.statusCard}>
        <span style={styles.statusIcon}>✓</span>
        <div>
          <p style={styles.statusTitle}>Purchased!</p>
          {result.badgeName && (
            <p style={styles.statusSub}>{result.badgeName} granted</p>
          )}
          <p style={styles.statusSub}>
            New balance: {result.newBalance.toLocaleString()} coins
          </p>
        </div>
      </div>
    )
  }

  if (result?.status === 'pending_approval') {
    return (
      <div style={{ ...styles.statusCard, ...styles.statusCardPending }}>
        <span style={styles.statusIcon}>⏳</span>
        <div>
          <p style={styles.statusTitle}>Pending parent approval</p>
          <p style={styles.statusSub}>
            Your parent will review this request.
          </p>
        </div>
      </div>
    )
  }

  // ── Active button with inline error ─────────────────────────────

  return (
    <div style={styles.wrapper}>
      {result?.status === 'insufficient_coins' && (
        <p role="alert" style={styles.errorMsg}>Not enough coins.</p>
      )}
      {result?.status === 'item_unavailable' && (
        <p role="alert" style={styles.errorMsg}>Item is no longer available.</p>
      )}
      {result?.status === 'error' && (
        <p role="alert" style={styles.errorMsg}>{result.message}</p>
      )}

      <button
        onClick={handlePurchase}
        disabled={isPending || !canAfford}
        style={
          !canAfford
            ? { ...styles.button, ...styles.buttonDisabled }
            : styles.button
        }
      >
        {isPending
          ? 'Processing…'
          : !canAfford
          ? 'Not enough coins'
          : `Buy · ${price.toLocaleString()} coins`}
      </button>
    </div>
  )
}

const styles = {
  wrapper: {
    display:        'flex',
    flexDirection:  'column' as const,
    gap:            'var(--space-2)',
  },
  button: {
    height:         40,
    borderRadius:   'var(--radius-full)',
    border:         'none',
    background:     'var(--color-primary)',
    color:          'var(--color-text-inverse)',
    fontWeight:     'var(--font-semibold)',
    fontSize:       'var(--text-sm)',
    cursor:         'pointer',
    padding:        '0 var(--space-5)',
    width:          '100%',
  },
  buttonDisabled: {
    background:     'var(--color-surface-alt)',
    color:          'var(--color-text-muted)',
    cursor:         'default',
  },
  errorMsg: {
    fontSize:       'var(--text-xs)',
    color:          'var(--color-error)',
    margin:         0,
  },
  statusCard: {
    display:        'flex',
    alignItems:     'center',
    gap:            'var(--space-3)',
    background:     'var(--color-success-surface)',
    border:         '1px solid var(--color-success)',
    borderRadius:   'var(--radius-lg)',
    padding:        'var(--space-3) var(--space-4)',
  },
  statusCardPending: {
    background:     'var(--color-warning-surface)',
    borderColor:    'var(--color-warning)',
  },
  statusIcon: {
    fontSize:       'var(--text-lg)',
    flexShrink:     0,
  },
  statusTitle: {
    fontSize:       'var(--text-sm)',
    fontWeight:     'var(--font-semibold)',
    color:          'var(--color-text)',
    margin:         0,
  },
  statusSub: {
    fontSize:       'var(--text-xs)',
    color:          'var(--color-text-muted)',
    margin:         0,
  },
} as const
