import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Clubs' }

export default function Page() {
  return <ComingSoon title="Clubs" phase={2} />
}
