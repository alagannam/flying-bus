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

  const { data: rawParentProfile } = await supabase
    .from('parent_profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .single()

  const parentProfile = rawParentProfile as { display_name: string } | null

  if (!parentProfile) redirect('/login')

  return (
    <>
      <ParentHeader displayName={parentProfile.display_name} />
      <main>{children}</main>
      <Footer />
    </>
  )
}
