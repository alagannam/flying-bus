import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Submission Studio' }

export default function Page() {
  return <ComingSoon title="Submission Studio" phase={2} />
}
