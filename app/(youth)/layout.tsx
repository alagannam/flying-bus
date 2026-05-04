import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { YouthHeader } from '@/components/layout/YouthHeader'
import { Footer } from '@/components/layout/Footer'

/**
 * Youth layout — requires an active youth session.
 * Middleware handles the initial redirect; this layout performs
 * a server-side check to get the profile for the nav and confirm
 * the account is in a valid state before rendering any child page.
 */
export default async function YouthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, unreadResult] = await Promise.all([
    supabase
      .from('youth_profiles')
      .select('display_name, username, avatar_url, coins_balance, creator_level')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null),
  ])

  if (!profileResult.data) redirect('/login')

  const profile     = profileResult.data
  const unreadCount = unreadResult.count ?? 0

  return (
    <>
      <YouthHeader profile={profile} unreadCount={unreadCount} />
      <main>{children}</main>
      <Footer />
    </>
  )
}
