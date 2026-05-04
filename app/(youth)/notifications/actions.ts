'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Uses the anon SSR client — the RLS policy "notifications_update_own_read_at"
// allows users to update read_at on their own rows, so service role is not needed.

export async function markRead(id: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)  // ownership — defence beyond RLS
    .is('read_at', null)     // no-op if already read

  revalidatePath('/notifications')
}

// Bulk mark-read for all visible unread notifications on page visit.
// Called from the MarkAllRead client component immediately after mount.
// The .is('read_at', null) guard makes this idempotent — re-runs are safe.
export async function markAllRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)
    .eq('user_id', user.id)  // ownership — defence beyond RLS
    .is('read_at', null)

  revalidatePath('/notifications')
}
