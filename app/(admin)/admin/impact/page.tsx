import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Impact Campaigns' }

export default function Page() {
  return <ComingSoon title="Impact Campaigns" phase={5} />
}
