import { PublicHeader } from '@/components/layout/PublicHeader'
import { Footer } from '@/components/layout/Footer'

/**
 * Public layout — no auth required.
 * Wraps all public-facing routes including SSR club, leaderboard,
 * impact, and profile pages.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main>{children}</main>
      <Footer />
    </>
  )
}
