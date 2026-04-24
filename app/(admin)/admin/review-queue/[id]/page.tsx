import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Review Submission' }

export default function Page() {
  return <ComingSoon title="Review Submission" phase={2} />
}
