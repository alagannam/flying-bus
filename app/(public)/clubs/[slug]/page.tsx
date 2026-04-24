import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Club' }

export default function Page() {
  return <ComingSoon title="Club" phase={2} />
}
