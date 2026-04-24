import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Impact' }

export default function Page() {
  return <ComingSoon title="Impact" phase={5} />
}
