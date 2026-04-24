import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'User' }

export default function Page() {
  return <ComingSoon title="User" phase={4} />
}
