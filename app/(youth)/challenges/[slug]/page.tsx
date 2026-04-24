import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Challenge' }

export default function Page() {
  return <ComingSoon title="Challenge" phase={2} />
}
