import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { SpendApprovalCard } from './SpendApprovalCard'

export const metadata: Metadata = { title: 'Approvals' }

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

type PendingSubmission = {
  id: string
  title: string
  youth_user_id: string
  club_id: string | null
  submitted_at: string | null
}

type SpendRequest = {
  id: string
  youth_user_id: string
  shop_item_id: string
  coins_amount: number
  created_at: string
}

export default async function ApprovalsPage() {
  const supabase = await createClient()
  const service  = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch submission approvals and coin spend requests in parallel.
  // Submissions: anon client — RLS policy "submissions_select_parent" scopes to
  //   children linked to this parent.
  // Spend requests: anon client — RLS policy "csr_select_own_parent" scopes to
  //   rows where parent_user_id = auth.uid().
  const [submissionsResult, spendResult] = await Promise.all([
    supabase
      .from('submissions')
      .select('id, title, youth_user_id, club_id, submitted_at')
      .eq('status', 'pending_parent_approval')
      .order('submitted_at', { ascending: true }),
    supabase
      .from('coin_spend_requests')
      .select('id, youth_user_id, shop_item_id, coins_amount, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ])

  const submissions   = (submissionsResult.data  ?? []) as PendingSubmission[]
  const spendRequests = (spendResult.data         ?? []) as SpendRequest[]

  // Collect unique IDs for batch enrichment.
  const allYouthIds  = [...new Set([
    ...submissions.map(s => s.youth_user_id),
    ...spendRequests.map(r => r.youth_user_id),
  ])]
  const clubIds      = [...new Set(submissions.map(s => s.club_id).filter(Boolean))] as string[]
  const shopItemIds  = [...new Set(spendRequests.map(r => r.shop_item_id))]

  // Batch fetch profiles, clubs, and shop items in parallel.
  // Profiles and items are fetched via service client because youth_profiles
  // has per-user RLS and shop_items needs no session-cookie dependency here.
  const [profilesResult, clubsResult, itemsResult] = await Promise.all([
    allYouthIds.length > 0
      ? service
          .from('youth_profiles')
          .select('user_id, display_name, username')
          .in('user_id', allYouthIds)
      : Promise.resolve({ data: [] }),
    clubIds.length > 0
      ? supabase.from('clubs').select('id, name').in('id', clubIds)
      : Promise.resolve({ data: [] }),
    shopItemIds.length > 0
      ? service.from('shop_items').select('id, name').in('id', shopItemIds)
      : Promise.resolve({ data: [] }),
  ])

  type ProfileRow  = { user_id: string; display_name: string; username: string }
  type ClubRow     = { id: string; name: string }
  type ShopItemRow = { id: string; name: string }

  const profileMap  = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map(p => [p.user_id, p])
  )
  const clubMap     = new Map(
    ((clubsResult.data    ?? []) as ClubRow[]).map(c => [c.id, c.name])
  )
  const shopItemMap = new Map(
    ((itemsResult.data    ?? []) as ShopItemRow[]).map(i => [i.id, i.name])
  )

  const totalPending = submissions.length + spendRequests.length

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.heading}>Approvals</h1>
            <p style={styles.sub}>
              Review your child&apos;s submissions and spending requests.
            </p>
          </div>
          {totalPending > 0 && (
            <span style={styles.count}>{totalPending} waiting</span>
          )}
        </div>

        {totalPending === 0 && (
          <div style={styles.empty}>
            <p style={styles.emptyHeading}>Nothing to review</p>
            <p style={styles.emptyText}>
              You&apos;ll see submission and coin spending requests here when
              your child needs your approval.
            </p>
          </div>
        )}

        {/* ── Coin spend requests ────────────────────────────── */}
        {spendRequests.length > 0 && (
          <section>
            <p style={styles.sectionHeading}>Coin spend requests</p>
            <ul style={styles.list}>
              {spendRequests.map(req => {
                const profile   = profileMap.get(req.youth_user_id)
                const childName = profile?.display_name ?? profile?.username ?? 'Your child'
                const itemName  = shopItemMap.get(req.shop_item_id) ?? 'Unknown item'
                return (
                  <SpendApprovalCard
                    key={req.id}
                    requestId={req.id}
                    childName={childName}
                    itemName={itemName}
                    coinsAmount={req.coins_amount}
                    formattedDate={formatDate(req.created_at)}
                  />
                )
              })}
            </ul>
          </section>
        )}

        {/* ── Submission approvals ───────────────────────────── */}
        {submissions.length > 0 && (
          <section>
            <p style={styles.sectionHeading}>Submission approvals</p>
            <ul style={styles.list}>
              {submissions.map(s => (
                <li key={s.id}>
                  <a href={`/parent/approvals/${s.id}`} style={styles.card}>
                    <div style={styles.cardMain}>
                      <span style={styles.cardTitle}>{s.title}</span>
                      <div style={styles.cardMeta}>
                        <span>{profileMap.get(s.youth_user_id)?.display_name ?? 'Your child'}</span>
                        {s.club_id && clubMap.has(s.club_id) && (
                          <><span style={styles.metaDot}>·</span><span>{clubMap.get(s.club_id)}</span></>
                        )}
                        {s.submitted_at && (
                          <><span style={styles.metaDot}>·</span><span>Submitted {formatDate(s.submitted_at)}</span></>
                        )}
                      </div>
                    </div>
                    <span style={styles.arrow}>→</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
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
    maxWidth:      'var(--container-lg)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-8)',
  },
  topBar: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    gap:            'var(--space-4)',
  },
  heading: {
    fontSize:   'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
  },
  sub: {
    fontSize:  'var(--text-sm)',
    color:     'var(--color-text-secondary)',
    marginTop: 'var(--space-1)',
  },
  count: {
    padding:    'var(--space-1) var(--space-3)',
    background: 'var(--color-warning-surface)',
    color:      'var(--color-warning)',
    borderRadius: 'var(--radius-full)',
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  empty: {
    padding:      'var(--space-16)',
    textAlign:    'center' as const,
    background:   'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border:       '1px solid var(--color-border)',
  },
  emptyHeading: {
    fontSize:     'var(--text-lg)',
    fontWeight:   'var(--font-semibold)',
    color:        'var(--color-text)',
    marginBottom: 'var(--space-2)',
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-secondary)',
  },
  sectionHeading: {
    fontSize:     'var(--text-xs)',
    fontWeight:   'var(--font-semibold)',
    color:        'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: 'var(--space-3)',
  },
  list: {
    listStyle:     'none',
    padding:       0,
    margin:        0,
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
  },

  // ── Submission card ────────────────────────────────────────────
  card: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    gap:            'var(--space-4)',
    background:     'var(--color-surface)',
    borderRadius:   'var(--radius-lg)',
    border:         '1px solid var(--color-border)',
    padding:        'var(--space-4) var(--space-5)',
    textDecoration: 'none',
  },
  cardMain: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-1)',
    minWidth:      0,
    flex:          1,
  },
  cardTitle: {
    fontSize:    'var(--text-base)',
    fontWeight:  'var(--font-medium)',
    color:       'var(--color-text)',
    overflow:    'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:  'nowrap' as const,
  },
  cardMeta: {
    display:    'flex',
    alignItems: 'center',
    flexWrap:   'wrap' as const,
    gap:        'var(--space-2)',
    fontSize:   'var(--text-xs)',
    color:      'var(--color-text-muted)',
  },
  metaDot: { color: 'var(--color-border-strong)' },
  arrow: {
    fontSize:   'var(--text-base)',
    color:      'var(--color-text-muted)',
    flexShrink: 0,
  },
} as const
