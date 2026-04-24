import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Users' }

export default function Page() {
  return <ComingSoon title="Users" phase={4} />
}
