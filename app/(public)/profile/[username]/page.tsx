import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profile' }

export default function Page() {
  return <ComingSoon title="Profile" phase={3} />
}
