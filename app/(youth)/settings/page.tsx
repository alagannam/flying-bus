import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default function Page() {
  return <ComingSoon title="Settings" phase={1} />
}
