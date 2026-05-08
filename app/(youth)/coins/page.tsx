import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'My Kana Coins' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function reasonLabel(reason: string) {
  switch (reason) {
    case 'submission_approved': return 'Submission approved'
    case 'challenge_completed': return 'Challenge completed'
    case 'weekly_mission':      return 'Weekly mission'
    case 'admin_grant':         return 'Admin grant'
    case 'admin_deduct':        return 'Admin deduction'
    case 'shop_purchase':       return 'Shop purchase'
    case 'spend':               return 'Spent'
    default:                    return reason.replace(/_/g, ' ')
  }
}

type LedgerRow = {
  id: string
  amount: number
  balance_after: number
  reason: string
  created_at: string
}

export default async function CoinsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch balance and ledger history in parallel.
  // Both use the anon client — kana_ledger_select_own and
  // youth_profiles_select_own RLS policies scope to auth.uid().
  const [profileResult, ledgerResult] = await Promise.all([
    supabase
      .from('youth_profiles')
      .select('coins_balance')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('kana_ledger')
      .select('id, amount, balance_after, reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const balance = (profileResult.data as { coins_balance: number } | null)?.coins_balance ?? 0
  const entries = (ledgerResult.data ?? []) as LedgerRow[]

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Balance hero ───────────────────────────────────── */}
        <div style={styles.hero}>
          <p style={styles.heroLabel}>Kana Coins</p>
          <p style={styles.heroBalance}>{balance.toLocaleString()}</p>
          <p style={styles.heroSub}>Your current balance</p>
          <Link href="/shop" style={styles.shopLink}>Visit the shop →</Link>
        </div>

        {/* ── Transaction history ────────────────────────────── */}
        <div style={styles.section}>
          <p style={styles.sectionHeading}>Transaction history</p>

          {entries.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyHeading}>No transactions yet</p>
              <p style={styles.emptyText}>
                Earn Kana Coins by completing challenges, getting published, and hitting streaks.
              </p>
            </div>
          ) : (
            <ul style={styles.list}>
              {entries.map(entry => {
                const earned = entry.amount > 0
                return (
                  <li key={entry.id} style={styles.item}>
                    <div style={styles.itemLeft}>
                      <span style={styles.itemReason}>{reasonLabel(entry.reason)}</span>
                      <span style={styles.itemDate}>{formatDate(entry.created_at)}</span>
                    </div>
                    <div style={styles.itemRight}>
                      <span style={earned ? styles.amountEarned : styles.amountSpent}>
                        {earned ? '+' : '−'}{Math.abs(entry.amount).toLocaleString()}
                      </span>
                      <span style={styles.balanceAfter}>
                        {entry.balance_after.toLocaleString()} total
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-background)',
    padding: 'var(--space-8) var(--space-6)',
  },
  container: {
    maxWidth: 'var(--container-sm)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-8)',
  },

  // ── Hero ──────────────────────────────────────────────────────
  hero: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-8) var(--space-6)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 'var(--space-2)',
    textAlign: 'center' as const,
  },
  heroLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin: 0,
  },
  heroBalance: {
    fontSize: 'var(--text-5xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-accent)',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
    margin: 0,
  },
  heroSub: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
  shopLink: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-primary)',
    textDecoration: 'none',
    marginTop: 'var(--space-2)',
  },

  // ── History ───────────────────────────────────────────────────
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  sectionHeading: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: 0,
  },
  empty: {
    padding: 'var(--space-12)',
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
  },
  emptyHeading: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    marginBottom: 'var(--space-2)',
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-4)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-4) var(--space-5)',
  },
  itemLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
    minWidth: 0,
  },
  itemReason: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
  },
  itemDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  itemRight: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: 'var(--space-1)',
    flexShrink: 0,
  },
  amountEarned: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-success)',
    fontVariantNumeric: 'tabular-nums',
  },
  amountSpent: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
  balanceAfter: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
} as const
