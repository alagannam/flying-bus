import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Flag Review' }

export default function Page() {
  return <ComingSoon title="Flag Review" phase={4} />
}
