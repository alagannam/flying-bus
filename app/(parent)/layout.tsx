import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ParentHeader } from '@/components/layout/ParentHeader'
import { Footer } from '@/components/layout/Footer'

/**
 * Parent layout — requires an active parent session.
 */
export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, unreadResult] = await Promise.all([
    supabase
      .from('parent_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null),
  ])

  const parentProfile = profileResult.data as { display_name: string } | null

  if (!parentProfile) redirect('/login')

  const unreadCount = unreadResult.count ?? 0

  return (
    <>
      <ParentHeader displayName={parentProfile.display_name} unreadCount={unreadCount} />
      <main>{children}</main>
      <Footer />
    </>
  )
}
