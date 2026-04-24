import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Submissions' }

export default function Page() {
  return <ComingSoon title="My Submissions" phase={2} />
}
