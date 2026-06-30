import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

const PUBLIC_PATHS = ['/auth', '/parents', '/']

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard')
}

function isAuthPath(pathname: string): boolean {
  return pathname.startsWith('/auth')
}

/**
 * Refreshes the Supabase session cookie and enforces route protection.
 *
 * - Unauthenticated users hitting /dashboard/* are redirected to sign in.
 * - Authenticated users hitting /auth/* are redirected to the dashboard.
 * - When Supabase is not configured, requests pass through untouched so the
 *   app remains usable as a demo.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  if (!isSupabaseConfigured()) {
    return supabaseResponse
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthPath(pathname) && !pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export { PUBLIC_PATHS }
