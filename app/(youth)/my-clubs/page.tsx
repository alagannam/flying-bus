import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Clubs' }

export default function Page() {
  return <ComingSoon title="My Clubs" phase={2} />
}
