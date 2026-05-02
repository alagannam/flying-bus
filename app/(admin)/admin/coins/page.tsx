import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

// All reads use service-role. shop_items has an authenticated-user SELECT
// policy, but coin_spend_requests has no admin SELECT policy — service-role
// is required for both to keep the pattern consistent and safe.

export const metadata: Metadata = { title: 'Kana Coins' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function statusPill(status: string): { label: string; bg: string; fg: string } {
  switch (status) {
    case 'pending':
      return { label: 'Pending',   bg: 'var(--color-warning-surface)', fg: 'var(--color-warning)' }
    case 'approved':
      return { label: 'Approved',  bg: 'var(--color-success-surface)', fg: 'var(--color-success)' }
    case 'rejected':
      return { label: 'Rejected',  bg: 'var(--color-error-surface)',   fg: 'var(--color-error)' }
    case 'cancelled':
      return { label: 'Cancelled', bg: 'var(--color-surface)',         fg: 'var(--color-text-muted)' }
    default:
      return { label: status,      bg: 'var(--color-surface)',         fg: 'var(--color-text-muted)' }
  }
}

type ShopItem = {
  id:          string
  name:        string
  slug:        string
  item_ref:    string
  category:    string
  price_coins: number
  sort_order:  number
  is_active:   boolean
}

type SpendRequest = {
  id:             string
  youth_user_id:  string
  parent_user_id: string
  shop_item_id:   string
  coins_amount:   number
  status:         string
  created_at:     string
}

export default async function AdminCoinsPage() {
  const service = createServiceClient()

  // ── Round 1: shop inventory + spend requests in parallel ─────────
  // Fetch all shop items (active and inactive) so inactive items
  // referenced by older spend requests still resolve to a name.
  const [shopItemsResult, spendRequestsResult] = await Promise.all([
    service
      .from('shop_items')
      .select('id, name, slug, item_ref, category, price_coins, sort_order, is_active')
      .order('sort_order', { ascending: true }),
    service
      .from('coin_spend_requests')
      .select('id, youth_user_id, parent_user_id, shop_item_id, coins_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const allShopItems  = (shopItemsResult.data   ?? []) as ShopItem[]
  const spendRequests = (spendRequestsResult.data ?? []) as SpendRequest[]

  // Inventory section shows only active items.
  const activeItems = allShopItems.filter(i => i.is_active)

  // Map covers all items (including inactive) so spend requests can always
  // resolve a name even if the item was later deactivated.
  const shopItemMap = new Map(allShopItems.map(i => [i.id, i.name]))

  // ── Round 2: enrich spend requests ──────────────────────────────
  const youthIds  = [...new Set(spendRequests.map(r => r.youth_user_id))]
  const parentIds = [...new Set(spendRequests.map(r => r.parent_user_id))]

  const [youthResult, parentResult] = await Promise.all([
    youthIds.length > 0
      ? service
          .from('youth_profiles')
          .select('user_id, display_name, username')
          .in('user_id', youthIds)
      : Promise.resolve({ data: [] }),
    parentIds.length > 0
      ? service
          .from('users')
          .select('id, email')
          .in('id', parentIds)
      : Promise.resolve({ data: [] }),
  ])

  type YouthRow  = { user_id: string; display_name: string; username: string }
  type ParentRow = { id: string; email: string }

  const youthMap  = new Map(
    ((youthResult.data  ?? []) as YouthRow[]).map(p => [p.user_id, p])
  )
  const parentMap = new Map(
    ((parentResult.data ?? []) as ParentRow[]).map(u => [u.id, u.email])
  )

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Page header ───────────────────────────────────── */}
        <div style={styles.pageHeader}>
          <h1 style={styles.heading}>Kana Coins</h1>
          <p style={styles.sub}>Read-only view of the shop inventory and recent spend requests.</p>
        </div>

        {/* ── Shop inventory ────────────────────────────────── */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <p style={styles.sectionTitle}>Shop inventory</p>
            <span style={styles.sectionCount}>{activeItems.length} active</span>
          </div>

          {activeItems.length === 0 ? (
            <p style={styles.empty}>No active shop items.</p>
          ) : (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Name</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Slug</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Category</th>
                    <th style={{ ...styles.th, ...styles.thRight }}>Price (coins)</th>
                    <th style={{ ...styles.th, ...styles.thRight }}>Order</th>
                  </tr>
                </thead>
                <tbody>
                  {activeItems.map(item => (
                    <tr key={item.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 'var(--font-medium)' }}>
                        {item.name}
                      </td>
                      <td style={{ ...styles.td, ...styles.mono }}>{item.slug}</td>
                      <td style={{ ...styles.td, textTransform: 'capitalize' as const }}>
                        {item.category}
                      </td>
                      <td style={{ ...styles.td, ...styles.tdRight }}>
                        {item.price_coins.toLocaleString()}
                      </td>
                      <td style={{ ...styles.td, ...styles.tdRight }}>
                        {item.sort_order}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Spend requests ────────────────────────────────── */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <p style={styles.sectionTitle}>Recent spend requests</p>
            <span style={styles.sectionCount}>
              {spendRequests.length === 50 ? 'last 50' : spendRequests.length}
            </span>
          </div>

          {spendRequests.length === 0 ? (
            <p style={styles.empty}>No spend requests yet.</p>
          ) : (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Child</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Parent</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Item</th>
                    <th style={{ ...styles.th, ...styles.thRight }}>Coins</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Status</th>
                    <th style={{ ...styles.th, ...styles.thLeft }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {spendRequests.map(req => {
                    const youth       = youthMap.get(req.youth_user_id)
                    const childLabel  = youth?.display_name ?? youth?.username ?? '—'
                    const parentEmail = parentMap.get(req.parent_user_id) ?? '—'
                    const itemLabel   = shopItemMap.get(req.shop_item_id) ?? '—'
                    const pill        = statusPill(req.status)

                    return (
                      <tr key={req.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 'var(--font-medium)' }}>
                          {childLabel}
                        </td>
                        <td style={{ ...styles.td, ...styles.muted }}>{parentEmail}</td>
                        <td style={styles.td}>{itemLabel}</td>
                        <td style={{ ...styles.td, ...styles.tdRight }}>
                          {req.coins_amount.toLocaleString()}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.pill,
                            background: pill.bg,
                            color:      pill.fg,
                          }}>
                            {pill.label}
                          </span>
                        </td>
                        <td style={{ ...styles.td, ...styles.muted }}>
                          {formatDate(req.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

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
    maxWidth:      'var(--container-xl)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-10)',
  },

  // ── Header ────────────────────────────────────────────────────────
  pageHeader: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
  },
  heading: {
    fontSize:   'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
  },
  sub: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
  },

  // ── Section ───────────────────────────────────────────────────────
  section: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-4)',
  },
  sectionHeader: {
    display:     'flex',
    alignItems:  'center',
    gap:         'var(--space-3)',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: 'var(--space-3)',
  },
  sectionTitle: {
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
    margin:     0,
  },
  sectionCount: {
    fontSize:   'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    color:      'var(--color-text-muted)',
    background: 'var(--color-surface)',
    border:     '1px solid var(--color-border)',
    borderRadius: 'var(--radius-full)',
    padding:    '1px var(--space-2)',
  },
  empty: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
    padding:  'var(--space-6) 0',
    margin:   0,
  },

  // ── Table ─────────────────────────────────────────────────────────
  tableScroll: {
    overflowX:    'auto' as const,
    borderRadius: 'var(--radius-lg)',
    border:       '1px solid var(--color-border)',
  },
  table: {
    width:           '100%',
    borderCollapse:  'collapse' as const,
    background:      'var(--color-surface)',
    fontSize:        'var(--text-sm)',
  },
  th: {
    padding:         'var(--space-3) var(--space-4)',
    fontSize:        'var(--text-xs)',
    fontWeight:      'var(--font-semibold)',
    color:           'var(--color-text-muted)',
    textTransform:   'uppercase' as const,
    letterSpacing:   '0.05em',
    background:      'var(--color-surface)',
    borderBottom:    '1px solid var(--color-border)',
    whiteSpace:      'nowrap' as const,
  },
  thLeft:  { textAlign: 'left'  as const },
  thRight: { textAlign: 'right' as const },
  tr: {
    borderBottom: '1px solid var(--color-border)',
  },
  td: {
    padding: 'var(--space-3) var(--space-4)',
    color:   'var(--color-text)',
    verticalAlign: 'middle' as const,
  },
  tdRight: {
    textAlign:          'right' as const,
    fontVariantNumeric: 'tabular-nums',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize:   'var(--text-xs)',
    color:      'var(--color-text-secondary)',
  },
  muted: {
    color:    'var(--color-text-muted)',
    fontSize: 'var(--text-xs)',
  },

  // ── Status pill ───────────────────────────────────────────────────
  pill: {
    display:      'inline-block',
    padding:      '2px var(--space-2)',
    borderRadius: 'var(--radius-full)',
    fontSize:     'var(--text-xs)',
    fontWeight:   'var(--font-semibold)',
    whiteSpace:   'nowrap' as const,
  },
} as const
