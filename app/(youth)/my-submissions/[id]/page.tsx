import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Submission' }

export default function Page() {
  return <ComingSoon title="Submission" phase={2} />
}
