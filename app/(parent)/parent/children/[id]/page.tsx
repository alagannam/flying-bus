import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Child Account' }

export default function Page() {
  return <ComingSoon title="Child Account" phase={4} />
}
