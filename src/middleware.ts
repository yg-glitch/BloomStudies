import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Public routes that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/parents',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/auth/logout',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let public paths through without auth check
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // For API routes: return JSON 401 instead of HTML redirect
  if (pathname.startsWith('/api/')) {
    // Skip auth check for public API routes (webhooks must be accessible)
    const publicApiPaths = ['/api/stripe/webhook']
    if (publicApiPaths.some(p => pathname.startsWith(p))) {
      return NextResponse.next()
    }

    // Check auth for protected API routes
    const response = await updateSession(request)
    // If updateSession redirected to sign-in, it means unauthenticated
    if (response.status === 307 || response.status === 302) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }
    return response
  }

  // For all other routes (dashboard etc): use normal session update + redirect
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Match all routes except static files and images
    '/((?!_next/static|_next/image|favicon.ico|logo.png|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)',
  ],
}
