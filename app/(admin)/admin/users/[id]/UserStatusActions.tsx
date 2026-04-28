'use client'

import { useState, useTransition } from 'react'
import { setAccountStatus } from './actions'

type Props = {
  targetUserId: string
  currentStatus: string
}

export function UserStatusActions({ targetUserId, currentStatus }: Props) {
  const [confirming, setConfirming]   = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  const isSuspended = currentStatus === 'suspended'

  function handleSuspend() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await setAccountStatus(targetUserId, 'suspended')
      if (result?.error) {
        setError(result.error)
        setConfirming(false)
      }
      // On success the server action redirects — no client nav needed.
    })
  }

  function handleRestore() {
    setError(null)
    startTransition(async () => {
      const result = await setAccountStatus(targetUserId, 'active')
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div style={styles.container}>
      <p style={styles.heading}>Account status</p>

      {error && (
        <p role="alert" style={styles.error}>{error}</p>
      )}

      {isSuspended ? (
        // ── Restore flow (single-step) ──────────────────────
        <div style={styles.row}>
          <button
            type="button"
            onClick={handleRestore}
            disabled={isPending}
            style={isPending
              ? { ...styles.restoreBtn, opacity: 0.6, cursor: 'not-allowed' }
              : styles.restoreBtn
            }
          >
            {isPending ? 'Restoring…' : 'Restore account'}
          </button>
          <p style={styles.hint}>
            Restores login access and marks the account active.
          </p>
        </div>
      ) : confirming ? (
        // ── Suspend — confirm step ──────────────────────────
        <div style={styles.confirmBox}>
          <p style={styles.confirmText}>
            This will immediately invalidate the user&apos;s session and prevent
            re-login. Are you sure?
          </p>
          <div style={styles.confirmActions}>
            <button
              type="button"
              onClick={handleSuspend}
              disabled={isPending}
              style={isPending
                ? { ...styles.confirmSuspendBtn, opacity: 0.6, cursor: 'not-allowed' }
                : styles.confirmSuspendBtn
              }
            >
              {isPending ? 'Suspending…' : 'Yes, suspend account'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              style={styles.cancelBtn}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // ── Suspend — initial step ──────────────────────────
        <div style={styles.row}>
          <button
            type="button"
            onClick={handleSuspend}
            disabled={isPending}
            style={styles.suspendBtn}
          >
            Suspend account
          </button>
          <p style={styles.hint}>
            Immediately logs out the user and blocks re-login.
          </p>
        </div>
      )}
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
    lineHeight: 'var(--leading-relaxed)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    flexWrap: 'wrap' as const,
  },
  hint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
  suspendBtn: {
    padding: 'var(--space-2) var(--space-5)',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--color-error)',
    background: 'var(--color-surface)',
    color: 'var(--color-error)',
    fontWeight: 'var(--font-semibold)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
  },
  restoreBtn: {
    padding: 'var(--space-2) var(--space-5)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--color-success)',
    color: 'var(--color-text-inverse)',
    fontWeight: 'var(--font-semibold)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
  },
  confirmBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
    padding: 'var(--space-4)',
    background: 'var(--color-error-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-error)',
  },
  confirmText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    margin: 0,
    lineHeight: 'var(--leading-relaxed)',
  },
  confirmActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  confirmSuspendBtn: {
    padding: 'var(--space-2) var(--space-5)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--color-error)',
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
} as const
