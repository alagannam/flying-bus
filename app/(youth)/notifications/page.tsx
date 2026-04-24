import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notifications' }

export default function Page() {
  return <ComingSoon title="Notifications" phase={2} />
}
