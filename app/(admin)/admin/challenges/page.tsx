import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Challenges' }

export default function Page() {
  return <ComingSoon title="Challenges" phase={6} />
}
