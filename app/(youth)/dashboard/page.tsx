import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default function Page() {
  return <ComingSoon title="Dashboard" phase={2} />
}
