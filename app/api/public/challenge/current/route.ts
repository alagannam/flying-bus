import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const revalidate = 300

/**
 * Returns the current active challenge (single row with the lowest
 * sort_order). Used by the WordPress homepage widget and any other
 * external surface that needs the "current challenge" without a session.
 */
export async function GET() {
  try {
    const service = createServiceClient()

    const { data, error } = await service
      .from('challenges')
      .select('id, slug, title, description, category, starts_at, ends_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[/api/public/challenge/current] query error', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }

    return NextResponse.json({ challenge: data ?? null }, { status: 200 })
  } catch (err) {
    console.error('[/api/public/challenge/current] threw', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
