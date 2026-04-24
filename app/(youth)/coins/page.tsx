import { ComingSoon } from '@/components/ui/ComingSoon'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Kana Coins' }

export default function Page() {
  return <ComingSoon title="My Kana Coins" phase={5} />
}
