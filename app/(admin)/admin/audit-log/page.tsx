import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Audit Log' }

export default function Page() {
  return <ComingSoon title="Audit Log" phase={4} />
}
