import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

// content_reports has no admin SELECT RLS policy — all reads via service-role.

export const metadata: Metadata = { title: 'Moderation Flags' }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Inappropriate content',
  offensive:     'Offensive or hateful',
  spam:          'Spam or self-promotion',
  misleading:    'Misleading or inaccurate',
  other:         'Other',
}

const STATUS_TABS = [
  { value: 'open',      label: 'Open' },
  { value: 'actioned',  label: 'Actioned' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'all',       label: 'All' },
] as const

type StatusTab = typeof STATUS_TABS[number]['value']

type ReportRow = {
  id: string
  target_id: string
  reason: string
  status: string
  created_at: string
}

export default async function FlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: rawStatus = 'open' } = await searchParams

  const statusFilter: StatusTab =
    STATUS_TABS.some(t => t.value === rawStatus)
      ? (rawStatus as StatusTab)
      : 'open'

  const service = createServiceClient()

  const baseQuery = service
    .from('content_reports')
    .select('id, target_id, reason, status, created_at')
    .order('created_at', { ascending: false })

  const { data: rawReports } = statusFilter === 'all'
    ? await baseQuery
    : await baseQuery.eq('status', statusFilter)

  const reports = (rawReports ?? []) as ReportRow[]

  // Batch-fetch submission titles to avoid N+1 queries.
  const submissionIds = [...new Set(reports.map(r => r.target_id))]
  const { data: rawSubs } = submissionIds.length > 0
    ? await service.from('submissions').select('id, title').in('id', submissionIds)
    : { data: [] }

  const subMap = new Map(
    ((rawSubs ?? []) as { id: string; title: string }[]).map(s => [s.id, s.title])
  )

  const openCount = statusFilter === 'open' ? reports.length : null

  return (
    <div style={styles.page}>

      {/* ── Top bar ───────────────────────────────────────── */}
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.heading}>Moderation Flags</h1>
          <p style={styles.sub}>Content reported by youth users.</p>
        </div>
        {openCount !== null && openCount > 0 && (
          <span style={styles.countBadge}>{openCount} open</span>
        )}
      </div>

      {/* ── Status filter tabs ────────────────────────────── */}
      <div style={styles.tabs}>
        {STATUS_TABS.map(tab => (
          <a
            key={tab.value}
            href={`/admin/flags?status=${tab.value}`}
            style={statusFilter === tab.value
              ? { ...styles.tab, ...styles.tabActive }
              : styles.tab
            }
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* ── List or empty state ───────────────────────────── */}
      {reports.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyHeading}>
            {statusFilter === 'open' ? 'No open reports' : `No ${statusFilter} reports`}
          </p>
          <p style={styles.emptyText}>
            {statusFilter === 'open'
              ? 'No content has been flagged yet.'
              : 'Nothing to show for this filter.'}
          </p>
        </div>
      ) : (
        <ul style={styles.list}>
          {reports.map(report => {
            const title = subMap.get(report.target_id) ?? 'Submission unavailable'
            return (
              <li key={report.id}>
                <a href={`/admin/flags/${report.id}`} style={styles.card}>
                  <div style={styles.cardMain}>
                    <span style={styles.cardTitle}>{title}</span>
                    <span style={styles.cardReason}>
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </span>
                  </div>
                  <div style={styles.cardRight}>
                    <span style={styles.cardDate}>{formatDate(report.created_at)}</span>
                    <span style={{ ...styles.statusPill, ...pillColors(report.status) }}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                    <span style={styles.arrow}>→</span>
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      )}

    </div>
  )
}

function pillColors(status: string): React.CSSProperties {
  switch (status) {
    case 'open':      return { background: 'var(--color-warning-surface)', color: 'var(--color-warning)' }
    case 'actioned':  return { background: 'var(--color-error-surface)',   color: 'var(--color-error)' }
    case 'dismissed': return { background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)' }
    default:          return { background: 'var(--color-info-surface)',    color: 'var(--color-info)' }
  }
}

const styles = {
  page: {
    maxWidth: 'var(--container-lg)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 'var(--space-4)',
  },
  heading: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  sub: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    marginTop: 'var(--space-1)',
  },
  countBadge: {
    padding: 'var(--space-1) var(--space-3)',
    background: 'var(--color-warning-surface)',
    color: 'var(--color-warning)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  tabs: {
    display: 'flex',
    gap: 'var(--space-1)',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: 'var(--space-2)',
  },
  tab: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
  },
  tabActive: {
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  empty: {
    padding: 'var(--space-16)',
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
  },
  emptyHeading: {
    fontSize: 'var(--text-lg)',
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
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-4)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-4) var(--space-5)',
    textDecoration: 'none',
  },
  cardMain: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
    minWidth: 0,
    flex: 1,
  },
  cardTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cardReason: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    flexShrink: 0,
  },
  cardDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap' as const,
  },
  statusPill: {
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
  },
  arrow: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-muted)',
  },
} as const
