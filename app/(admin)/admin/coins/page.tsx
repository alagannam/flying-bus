import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kana Coins' }

export default function Page() {
  return <ComingSoon title="Kana Coins" phase={5} />
}
