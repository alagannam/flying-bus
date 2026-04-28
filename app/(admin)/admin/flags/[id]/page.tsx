import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { FlagActions } from './FlagActions'

// content_reports has no admin SELECT RLS policy — all reads via service-role.

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Inappropriate content',
  offensive:     'Offensive or hateful',
  spam:          'Spam or self-promotion',
  misleading:    'Misleading or inaccurate',
  other:         'Other',
}

type Report = {
  id: string
  target_id: string
  reason: string
  detail: string | null
  status: string
  reviewed_at: string | null
  moderator_note: string | null
  created_at: string
}

type Submission = {
  id: string
  title: string
  body: string
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Flag Review' }
}

export default async function FlagDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const service = createServiceClient()

  const { data: rawReport } = await service
    .from('content_reports')
    .select('id, target_id, reason, detail, status, reviewed_at, moderator_note, created_at')
    .eq('id', id)
    .maybeSingle()

  if (!rawReport) notFound()

  const report = rawReport as Report

  // Fetch the flagged submission — handle gracefully if since deleted/unpublished.
  const { data: rawSub } = await service
    .from('submissions')
    .select('id, title, body')
    .eq('id', report.target_id)
    .maybeSingle()

  const sub = rawSub as Submission | null

  const isOpen     = report.status === 'open'
  const isActioned = report.status === 'actioned'

  // Preview: first 3 non-empty paragraphs only.
  const allParas    = sub ? sub.body.split('\n').filter(p => p.trim()) : []
  const previewParas = allParas.slice(0, 3)
  const hasMoreBody  = allParas.length > 3

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <Link href="/admin/flags" style={styles.back}>
          ← Moderation Flags
        </Link>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>
              {sub?.title ?? 'Submission unavailable'}
            </h1>
            <span style={{ ...styles.statusBadge, ...statusColors(report.status) }}>
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </span>
          </div>
          <p style={styles.headerSub}>
            {sub ? (
              <Link
                href={`/submissions/${report.target_id}`}
                style={styles.viewLink}
                target="_blank"
                rel="noopener"
              >
                View published submission ↗
              </Link>
            ) : (
              'Submission no longer available'
            )}
          </p>
        </div>

        {/* ── Report details ─────────────────────────────────── */}
        <div style={styles.reportCard}>
          <p style={styles.cardHeading}>Report details</p>
          <dl style={styles.dl}>
            <div style={styles.dlRow}>
              <dt style={styles.dt}>Reason</dt>
              <dd style={styles.dd}>{REASON_LABELS[report.reason] ?? report.reason}</dd>
            </div>
            <div style={styles.dlRow}>
              <dt style={styles.dt}>Filed</dt>
              <dd style={styles.dd}>{formatDate(report.created_at)}</dd>
            </div>
            {report.detail && (
              <div style={styles.dlRow}>
                <dt style={styles.dt}>Detail</dt>
                <dd style={{ ...styles.dd, fontStyle: 'italic' }}>
                  &ldquo;{report.detail}&rdquo;
                </dd>
              </div>
            )}
          </dl>
          <p style={styles.privacyNote}>Reporter identity is not shown.</p>
        </div>

        {/* ── Submission body preview ────────────────────────── */}
        {sub && (
          <div style={styles.bodyCard}>
            <p style={styles.cardHeading}>Submission content preview</p>
            <div style={styles.bodyPreview}>
              {previewParas.map((para, i) => (
                <p key={i} style={styles.para}>{para}</p>
              ))}
              {hasMoreBody && (
                <p style={styles.truncNote}>
                  Showing first 3 paragraphs.{' '}
                  <Link
                    href={`/submissions/${report.target_id}`}
                    style={styles.viewLink}
                    target="_blank"
                    rel="noopener"
                  >
                    View full submission ↗
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Moderator actions (open reports only) ─────────── */}
        {isOpen && <FlagActions reportId={report.id} />}

        {/* ── Already reviewed banner ────────────────────────── */}
        {!isOpen && (
          <div style={{
            ...styles.reviewedBanner,
            borderColor: isActioned ? 'var(--color-error)' : 'var(--color-border-strong)',
            background:  isActioned ? 'var(--color-error-surface)' : 'var(--color-surface-raised)',
          }}>
            <p style={styles.reviewedTitle}>
              {isActioned ? 'Actioned' : 'Dismissed'}
              {report.reviewed_at ? ` on ${formatDate(report.reviewed_at)}` : ''}
            </p>
            {report.moderator_note && (
              <p style={styles.reviewedNote}>{report.moderator_note}</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function statusColors(status: string): React.CSSProperties {
  switch (status) {
    case 'open':      return { background: 'var(--color-warning-surface)', color: 'var(--color-warning)' }
    case 'actioned':  return { background: 'var(--color-error-surface)',   color: 'var(--color-error)' }
    case 'dismissed': return { background: 'var(--color-surface-raised)',  color: 'var(--color-text-muted)' }
    default:          return { background: 'var(--color-info-surface)',    color: 'var(--color-info)' }
  }
}

const styles = {
  page: {
    background: 'var(--color-background)',
    minHeight: '100vh',
    padding: 'var(--space-6) var(--space-6) var(--space-16)',
  },
  container: {
    maxWidth: 'var(--container-md)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-8)',
  },
  back: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    alignSelf: 'flex-start' as const,
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
  },
  title: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
    flex: 1,
  },
  statusBadge: {
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    marginTop: 'var(--space-1)',
  },
  headerSub: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
  viewLink: {
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: 'var(--font-medium)',
  },
  reportCard: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  cardHeading: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: 0,
  },
  dl: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
  },
  dlRow: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr',
    gap: 'var(--space-4)',
    alignItems: 'baseline',
  },
  dt: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-muted)',
  },
  dd: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    margin: 0,
    lineHeight: 'var(--leading-relaxed)',
  },
  privacyNote: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    margin: 0,
    paddingTop: 'var(--space-3)',
    borderTop: '1px solid var(--color-border)',
  },
  bodyCard: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  bodyPreview: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
  },
  para: {
    fontSize: 'var(--text-base)',
    lineHeight: 'var(--leading-relaxed)',
    color: 'var(--color-text)',
    margin: 0,
  },
  truncNote: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    margin: 0,
    paddingTop: 'var(--space-3)',
    borderTop: '1px solid var(--color-border)',
  },
  reviewedBanner: {
    borderRadius: 'var(--radius-lg)',
    border: '1px solid',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  reviewedTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    margin: 0,
  },
  reviewedNote: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin: 0,
  },
} as const
