import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PurchaseButton } from './PurchaseButton'

export const metadata: Metadata = { title: 'Shop' }

type ShopItem = {
  id:          string
  name:        string
  description: string | null
  price_coins: number
  category:    string
}

export default async function ShopPage() {
  const supabase = await createClient()
  const service  = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch balance and active shop items in parallel.
  // Items are fetched via service client so `is_active` filtering is reliable
  // regardless of any RLS nuance; authenticated RLS also allows this read.
  const [profileResult, itemsResult] = await Promise.all([
    supabase
      .from('youth_profiles')
      .select('coins_balance')
      .eq('user_id', user.id)
      .single(),
    service
      .from('shop_items')
      .select('id, name, description, price_coins, category')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  const balance = profileResult.data?.coins_balance ?? 0
  const items   = (itemsResult.data ?? []) as ShopItem[]

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={styles.header}>
          <h1 style={styles.heading}>Shop</h1>
          <p style={styles.sub}>Spend your Kana Coins on badges and rewards.</p>
        </div>

        {/* ── Balance pill ──────────────────────────────────── */}
        <div style={styles.balancePill}>
          <span style={styles.balanceLabel}>Your balance</span>
          <span style={styles.balanceValue}>
            {balance.toLocaleString()} coins
          </span>
        </div>

        {/* ── Item grid ─────────────────────────────────────── */}
        {items.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyHeading}>No items available</p>
            <p style={styles.emptyText}>
              Check back soon — new rewards are added regularly.
            </p>
          </div>
        ) : (
          <ul style={styles.grid}>
            {items.map(item => (
              <li key={item.id} style={styles.card}>

                <div style={styles.cardMeta}>
                  <span style={styles.categoryBadge}>
                    {item.category}
                  </span>
                </div>

                <p style={styles.itemName}>{item.name}</p>

                {item.description && (
                  <p style={styles.itemDesc}>{item.description}</p>
                )}

                <div style={styles.priceRow}>
                  <span style={styles.price}>
                    {item.price_coins.toLocaleString()} coins
                  </span>
                </div>

                <PurchaseButton
                  itemId={item.id}
                  price={item.price_coins}
                  userBalance={balance}
                />

              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight:  '100vh',
    background: 'var(--color-background)',
    padding:    'var(--space-8) var(--space-6)',
  },
  container: {
    maxWidth:       'var(--container-md)',
    margin:         '0 auto',
    display:        'flex',
    flexDirection:  'column' as const,
    gap:            'var(--space-8)',
  },

  // ── Header ────────────────────────────────────────────────────────
  header: {
    display:        'flex',
    flexDirection:  'column' as const,
    gap:            'var(--space-2)',
  },
  heading: {
    fontSize:   'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
  },
  sub: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
  },

  // ── Balance pill ──────────────────────────────────────────────────
  balancePill: {
    display:        'inline-flex',
    alignSelf:      'flex-start' as const,
    alignItems:     'center',
    gap:            'var(--space-3)',
    background:     'var(--color-surface)',
    border:         '1px solid var(--color-border)',
    borderRadius:   'var(--radius-full)',
    padding:        'var(--space-2) var(--space-5)',
  },
  balanceLabel: {
    fontSize:   'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  balanceValue: {
    fontSize:           'var(--text-base)',
    fontWeight:         'var(--font-bold)',
    color:              'var(--color-accent)',
    fontVariantNumeric: 'tabular-nums',
  },

  // ── Grid ──────────────────────────────────────────────────────────
  grid: {
    listStyle:      'none',
    padding:        0,
    margin:         0,
    display:        'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap:            'var(--space-4)',
  },
  card: {
    background:     'var(--color-surface)',
    borderRadius:   'var(--radius-xl)',
    border:         '1px solid var(--color-border)',
    padding:        'var(--space-6)',
    display:        'flex',
    flexDirection:  'column' as const,
    gap:            'var(--space-3)',
  },
  cardMeta: {
    display: 'flex',
  },
  categoryBadge: {
    fontSize:       'var(--text-xs)',
    fontWeight:     'var(--font-semibold)',
    color:          'var(--color-primary)',
    background:     'var(--color-primary-surface)',
    padding:        '2px var(--space-2)',
    borderRadius:   'var(--radius-sm)',
    textTransform:  'capitalize' as const,
  },
  itemName: {
    fontSize:   'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
    margin:     0,
  },
  itemDesc: {
    fontSize:   'var(--text-sm)',
    color:      'var(--color-text-secondary)',
    margin:     0,
    flexGrow:   1,
  },
  priceRow: {
    display:    'flex',
    alignItems: 'center',
  },
  price: {
    fontSize:           'var(--text-sm)',
    fontWeight:         'var(--font-bold)',
    color:              'var(--color-accent)',
    fontVariantNumeric: 'tabular-nums',
  },

  // ── Empty state ───────────────────────────────────────────────────
  empty: {
    padding:        'var(--space-16)',
    textAlign:      'center' as const,
    background:     'var(--color-surface)',
    borderRadius:   'var(--radius-xl)',
    border:         '1px solid var(--color-border)',
  },
  emptyHeading: {
    fontSize:       'var(--text-base)',
    fontWeight:     'var(--font-semibold)',
    color:          'var(--color-text)',
    marginBottom:   'var(--space-2)',
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-secondary)',
  },
} as const
