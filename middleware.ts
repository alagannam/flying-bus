import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

/**
 * Route gating rules:
 *
 * Public paths       → always allowed, no session required
 * /api/*             → allowed (API routes handle their own auth)
 * /brand/*           → allowed (shared CSS served to WordPress)
 * Unauthenticated    → redirect to /login?next=[path]
 * account_status bad → redirect to /account-restricted
 * (parent) routes    → account_type must be 'parent'
 * (admin) routes     → account_type must be in [editor, moderator, admin]
 * (youth) routes     → account_type must be 'youth'
 *
 * Sub-route role gating (e.g. /admin/coins = admin only) is enforced
 * inside Server Components, not here, to keep middleware fast.
 */

const PUBLIC_PREFIXES = [
  '/clubs',
  '/challenges',
  '/leaderboards',
  '/impact',
  '/profile',
  '/join',
  '/login',
  '/account-restricted',
  '/api/',
  '/brand/',
  '/_next/',
  '/favicon',
]

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true
  return PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

const YOUTH_PREFIXES = [
  '/dashboard',
  '/my-clubs',
  '/studio',
  '/my-submissions',
  '/coins',
  '/notifications',
  '/settings',
]

function isYouthPath(pathname: string): boolean {
  return YOUTH_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabase, response } = createMiddlewareClient(request)

  // Refresh session — must happen on every request.
  // getUser() is used (not getSession()) to validate with Supabase Auth server.
  const { data: { user } } = await supabase.auth.getUser()

  // Always allow public paths
  if (isPublicPath(pathname)) {
    return response
  }

  // No session — redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Fetch account type and status.
  // Kept minimal — only the fields needed for routing decisions.
  type UserRouteData = {
    account_type: 'youth' | 'parent' | 'editor' | 'moderator' | 'admin' | 'sponsor'
    account_status: 'active' | 'suspended' | 'frozen' | 'deleted' | 'pending_exit'
    suspended_until: string | null
  }
  const { data: rawUserData, error } = await supabase
    .from('users')
    .select('account_type, account_status, suspended_until')
    .eq('id', user.id)
    .single()

  const userData = rawUserData as UserRouteData | null

  if (error || !userData) {
    // User record missing — something went wrong during signup
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Blocked account
  if (userData.account_status === 'deleted') {
    return NextResponse.redirect(new URL('/account-restricted', request.url))
  }

  if (userData.account_status === 'frozen') {
    return NextResponse.redirect(new URL('/account-restricted', request.url))
  }

  if (userData.account_status === 'suspended') {
    const suspendedUntil = userData.suspended_until
      ? new Date(userData.suspended_until)
      : null
    if (!suspendedUntil || suspendedUntil > new Date()) {
      return NextResponse.redirect(new URL('/account-restricted', request.url))
    }
    // Suspension expired — allow through; the next server action will clear the status
  }

  const accountType = userData.account_type

  // /parent/* — parent accounts only
  if (pathname.startsWith('/parent/')) {
    if (accountType !== 'parent') {
      return NextResponse.redirect(
        accountType === 'youth'
          ? new URL('/dashboard', request.url)
          : new URL('/admin', request.url)
      )
    }
    return response
  }

  // /admin/* — editor, moderator, admin only
  if (pathname.startsWith('/admin') || pathname === '/admin') {
    if (!['editor', 'moderator', 'admin'].includes(accountType)) {
      return NextResponse.redirect(
        accountType === 'parent'
          ? new URL('/parent/dashboard', request.url)
          : new URL('/dashboard', request.url)
      )
    }
    return response
  }

  // Youth-only paths
  if (isYouthPath(pathname)) {
    if (accountType !== 'youth') {
      return NextResponse.redirect(
        accountType === 'parent'
          ? new URL('/parent/dashboard', request.url)
          : new URL('/admin', request.url)
      )
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image  (image optimisation)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
