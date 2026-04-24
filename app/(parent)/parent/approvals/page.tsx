import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Approvals' }

export default function Page() {
  return <ComingSoon title="Approvals" phase={4} />
}
