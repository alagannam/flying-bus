'use client'

import { useEffect } from 'react'
import { markAllRead } from './actions'

export function MarkAllRead({ ids }: { ids: string[] }) {
  useEffect(() => {
    if (ids.length > 0) markAllRead(ids)
  }, []) // intentionally empty — fire once on mount only

  return null
}
