import type { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { SubmissionForm } from './SubmissionForm'

export const metadata: Metadata = { title: 'New Submission' }

type ChallengeRow = { title: string }

export default async function NewSubmissionPage({
  searchParams,
}: {
  searchParams: Promise<{ challenge_id?: string }>
}) {
  const { challenge_id: challengeIdParam } = await searchParams
  const supabase = await createClient()

  const { data: rawClubs } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order')

  const clubs = (rawClubs ?? []) as { id: string; name: string }[]

  // Resolve challenge title from the id. Only resolve if the challenge
  // is still active — a stale or bogus id is silently dropped so we never
  // persist a challenge_id that doesn't correspond to a real active row.
  let challengeId:    string | undefined = undefined
  let challengeTitle: string | undefined = undefined
  if (challengeIdParam) {
    const service = createServiceClient()
    const { data } = await service
      .from('challenges')
      .select('title')
      .eq('id', challengeIdParam)
      .eq('is_active', true)
      .maybeSingle()
    const row = data as ChallengeRow | null
    if (row) {
      challengeId    = challengeIdParam
      challengeTitle = row.title
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <a href="/studio" style={styles.back}>← Back to studio</a>
          <h1 style={styles.heading}>New submission</h1>
          <p style={styles.sub}>
            Write something great. Save a draft to come back to it, or submit straight to the review queue.
          </p>
        </div>
        <SubmissionForm
          clubs={clubs}
          challengeId={challengeId}
          challengeTitle={challengeTitle}
        />
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
    maxWidth: 'var(--container-md)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-8)',
  },
  header: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-3)' },
  back: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    alignSelf: 'flex-start' as const,
  },
  heading: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  sub: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
  },
} as const
