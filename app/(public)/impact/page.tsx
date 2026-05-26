import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Impact' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function dateRange(starts_at: string | null, ends_at: string | null): string | null {
  if (!starts_at && !ends_at) return null
  if (starts_at && ends_at) return `${formatDate(starts_at)} – ${formatDate(ends_at)}`
  if (starts_at) return `Starts ${formatDate(starts_at)}`
  return `Ends ${formatDate(ends_at!)}`
}

type CampaignRow = {
  id:           string
  slug:         string
  title:        string
  description:  string | null
  goal_summary: string | null
  starts_at:    string | null
  ends_at:      string | null
}

export default async function ImpactPage() {
  const supabase = await createClient()

  const { data: rawCampaigns } = await supabase
    .from('impact_campaigns')
    .select('id, slug, title, description, goal_summary, starts_at, ends_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const campaigns = (rawCampaigns ?? []) as CampaignRow[]

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.heading}>
          <h1 style={styles.title}>Impact</h1>
          <p style={styles.subtitle}>
            The Help Hub is where kids turn participation into real-world outcomes.
            Sponsor-backed campaigns let creators help other kids around the world.
          </p>
        </div>

        {campaigns.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>No active campaigns yet. Check back soon.</p>
          </div>
        ) : (
          <ul style={styles.list}>
            {campaigns.map(campaign => {
              const range = dateRange(campaign.starts_at, campaign.ends_at)
              return (
                <li key={campaign.id}>
                  <Link href={`/impact/${campaign.slug}`} style={styles.card}>
                    <span style={styles.cardName}>{campaign.title}</span>
                    {campaign.description && (
                      <span style={styles.cardDesc}>{campaign.description}</span>
                    )}
                    {campaign.goal_summary && (
                      <span style={styles.goal}>{campaign.goal_summary}</span>
                    )}
                    {range && (
                      <span style={styles.dateRange}>{range}</span>
                    )}
                  </Link>
                </li>
              )
            })}
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
    padding:    'var(--space-10) var(--space-6)',
  },
  container: {
    maxWidth:      'var(--container-md)',
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-8)',
  },
  heading: {
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
  subtitle: {
    fontSize:   'var(--text-base)',
    color:      'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    maxWidth:   '60ch',
  },
  empty: {
    padding:      'var(--space-12)',
    textAlign:    'center' as const,
    background:   'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border:       '1px solid var(--color-border)',
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color:    'var(--color-text-muted)',
  },
  list: {
    listStyle:     'none',
    padding:       0,
    margin:        0,
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-3)',
  },
  card: {
    display:        'flex',
    flexDirection:  'column' as const,
    gap:            'var(--space-2)',
    background:     'var(--color-surface)',
    borderRadius:   'var(--radius-xl)',
    border:         '1px solid var(--color-border)',
    padding:        'var(--space-5) var(--space-6)',
    textDecoration: 'none',
  },
  cardName: {
    fontSize:   'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-text)',
  },
  cardDesc: {
    fontSize:            'var(--text-sm)',
    color:               'var(--color-text-secondary)',
    lineHeight:          'var(--leading-relaxed)',
    display:             '-webkit-box',
    WebkitLineClamp:     2,
    WebkitBoxOrient:     'vertical' as const,
    overflow:            'hidden',
  },
  goal: {
    fontSize:   'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color:      'var(--color-primary)',
  },
  dateRange: {
    fontSize: 'var(--text-xs)',
    color:    'var(--color-text-muted)',
  },
} as const
