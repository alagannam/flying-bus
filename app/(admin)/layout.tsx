import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { hasAdminAccess } from '@/lib/utils/permissions'
import type { AccountType } from '@/types/app'

/**
 * Admin layout — requires editor, moderator, or admin account type.
 * Sub-route role checks (e.g. admin-only pages) are done inside
 * each individual Server Component, not here.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawUserData } = await supabase
    .from('users')
    .select('account_type')
    .eq('id', user.id)
    .single()

  const userData = rawUserData as { account_type: AccountType } | null

  if (!userData || !hasAdminAccess(userData.account_type)) {
    redirect('/dashboard')
  }

  return (
    <>
      <AdminHeader accountType={userData.account_type} />
      <main style={{ padding: 'var(--space-6)' }}>{children}</main>
    </>
  )
}
