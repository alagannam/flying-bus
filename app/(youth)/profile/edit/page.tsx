import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Profile' }

export default function Page() {
  return <ComingSoon title="Edit Profile" phase={3} />
}
