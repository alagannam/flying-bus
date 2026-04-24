import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Parent Dashboard' }

export default function Page() {
  return <ComingSoon title="Parent Dashboard" phase={4} />
}
