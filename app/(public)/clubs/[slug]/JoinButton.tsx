'use client'

import { useTransition } from 'react'
import { joinClub } from '@/app/(youth)/clubs/actions'

type Props = { clubId: string; isMember: boolean }

export function JoinButton({ clubId, isMember }: Props) {
  const [isPending, startTransition] = useTransition()

  if (isMember) {
    return (
      <span style={styles.joined} aria-label="You are a member of this club">
        ✓ Joined
      </span>
    )
  }

  function handleClick() {
    startTransition(async () => {
      await joinClub(clubId)
      // joinClub calls revalidatePath, which re-renders the page tree
      // and flips isMember to true — no client-side state to update.
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      style={isPending ? { ...styles.join, opacity: 0.6, cursor: 'wait' } : styles.join}
    >
      {isPending ? 'Joining…' : 'Join this club'}
    </button>
  )
}

const styles = {
  join: {
    padding:        'var(--space-2) var(--space-5)',
    background:     'var(--color-primary)',
    color:          '#fff',
    border:         'none',
    borderRadius:   'var(--radius-full)',
    fontSize:       'var(--text-sm)',
    fontWeight:     'var(--font-semibold)',
    cursor:         'pointer',
    alignSelf:      'flex-start' as const,
  },
  joined: {
    padding:        'var(--space-2) var(--space-5)',
    background:     'var(--color-success-surface)',
    color:          'var(--color-success)',
    border:         '1px solid var(--color-success-surface)',
    borderRadius:   'var(--radius-full)',
    fontSize:       'var(--text-sm)',
    fontWeight:     'var(--font-semibold)',
    cursor:         'default',
    display:        'inline-block',
    alignSelf:      'flex-start' as const,
  },
} as const
