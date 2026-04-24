import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default function Page() {
  return <ComingSoon title="Admin Dashboard" phase={8} />
}
