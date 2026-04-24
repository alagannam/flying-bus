import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kana Channel' }

export default function Page() {
  return <ComingSoon title="Kana Channel" phase={6} />
}
