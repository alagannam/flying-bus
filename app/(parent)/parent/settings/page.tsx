import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Parent Settings' }

export default function Page() {
  return <ComingSoon title="Parent Settings" phase={4} />
}
