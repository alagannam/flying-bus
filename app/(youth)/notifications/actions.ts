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
