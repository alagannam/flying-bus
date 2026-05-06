'use client'

import { useEffect } from 'react'
import { markAllRead } from './actions'

export function MarkAllRead({ ids }: { ids: string[] }) {
  useEffect(() => {
    if (!ids.length) return

    void markAllRead(ids)
  }, [ids])

  return null
}