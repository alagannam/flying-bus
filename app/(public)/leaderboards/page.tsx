import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Leaderboards' }

export default function Page() {
  return <ComingSoon title="Leaderboards" phase={3} />
}
