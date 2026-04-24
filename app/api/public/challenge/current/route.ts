import { NextResponse } from 'next/server'

export const revalidate = 300

/** Returns the current active challenge for the WordPress homepage widget. Built Phase 2. */
export async function GET() {
  return NextResponse.json({ message: 'Built in Phase 2' }, { status: 200 })
}
