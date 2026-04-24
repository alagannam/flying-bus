import { NextResponse } from 'next/server'

export const revalidate = 300

/** Returns sanitised top-N leaderboard entries. Never returns age_band or PII. Built Phase 3. */
export async function GET() {
  return NextResponse.json({ message: 'Built in Phase 3' }, { status: 200 })
}
