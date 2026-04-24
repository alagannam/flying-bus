import { NextResponse, type NextRequest } from 'next/server'

/**
 * Handles Mux video status webhooks.
 * IMPORTANT: Must verify Mux-Signature header before processing — built Phase 6.
 */
export async function POST(request: NextRequest) {
  void request
  return NextResponse.json({ received: true })
}
