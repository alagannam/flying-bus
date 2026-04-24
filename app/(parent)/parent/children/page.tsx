import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Children' }

export default function Page() {
  return <ComingSoon title="My Children" phase={4} />
}
