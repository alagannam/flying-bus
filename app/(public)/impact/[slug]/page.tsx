import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function dateRange(starts_at: string | null, ends_at: string | null): string | null {
  if (!starts_at && !ends_at) return null
  if (starts_at && ends_at) return `${formatDate(starts_at)} – ${formatDate(ends_at)}`
  if (starts_at) return `Starts ${formatDate(starts_at)}`
  return `Ends ${formatDate(ends_at!)}`
}

type CampaignRow = {
  slug:         string
  title:        string
  description:  string | null
  goal_summary: string | null
  starts_at:    string | null
  ends_at:      string | null
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('impact_campaigns')
    .select('title')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  const row = data as { title?: string } | null
  return { title: row?.title ?? 'Campaign' }
}

export default async function ImpactDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // is_active = true is an explicit filter, not just a display concern.
  // An inactive slug and a non-existent slug both return notFound() —
  // callers cannot distinguish the two cases.
  const { data: rawCampaign } = await supabase
    .from('impact_campaigns')
    .select('slug, title, description, goal_summary, starts_at, ends_at')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!rawCampaign) notFound()

  const campaign = rawCampaign as CampaignRow
  const range = dateRange(campaign.starts_at, campaign.ends_at)

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <Link href="/impact" style={styles.back}>← Impact</Link>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={styles.header}>
          <h1 style={styles.title}>{campaign.title}</h1>
          {range && <p style={styles.dateRange}>{range}</p>}
        </div>

        {/* ── Goal pull-out ─────────────────────────────────── */}
        {campaign.goal_summary && (
          <div style={styles.goalCard}>
            <p style={styles.goalLabel}>Goal</p>
            <p style={styles.goalText}>{campaign.goal_summary}</p>
          </div>
        )}

        {/* ── Description ───────────────────────────────────── */}
        {campaign.description && (
          <p style={styles.description}>{campaign.description}</p>
        )}

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight:  '100vh',
    background: 'var(--color-background)',
    padding:    'var(--space-10) var(--space-6)',
  },
  container: {
    maxWidth:      'var(--container-md)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-8)',
  },
  back: {
    fontSize:       'var(--text-sm)',
    color:          'var(--color-text-secondary)',
    textDecoration: 'none',
    alignSelf:      'flex-start' as const,
  },
  header: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-3)',
  },
  title: {
    fontSize:   'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color:      'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
  },
  dateRange: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
    margin:   0,
  },
  goalCard: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-2)',
    background:    'var(--color-primary-surface)',
    border:        '1px solid var(--color-border)',
    borderRadius:  'var(--radius-xl)',
    padding:       'var(--space-5) var(--space-6)',
  },
  goalLabel: {
    fontSize:      'var(--text-xs)',
    fontWeight:    'var(--font-semibold)',
    color:         'var(--color-primary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin:        0,
  },
  goalText: {
    fontSize:   'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
    margin:     0,
  },
  description: {
    fontSize:   'var(--text-base)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    margin:     0,
  },
} as const
