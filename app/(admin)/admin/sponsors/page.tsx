import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sponsors' }

export default function Page() {
  return <ComingSoon title="Sponsors" phase={8} />
}
