import { NextResponse } from 'next/server'

export const revalidate = 300

/** Returns the active impact campaign. Built Phase 5. */
export async function GET() {
  return NextResponse.json({ message: 'Built in Phase 5' }, { status: 200 })
}
