import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Review Queue' }

export default function Page() {
  return <ComingSoon title="Review Queue" phase={2} />
}
