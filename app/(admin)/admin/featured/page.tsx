import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Featured Content' }

export default function Page() {
  return <ComingSoon title="Featured Content" phase={8} />
}
