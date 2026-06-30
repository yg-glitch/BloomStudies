import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Handles the redirect back from OAuth providers, magic links and email
 * confirmations. Exchanges the `code` for a session cookie, then forwards the
 * user to their intended destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const errorDescription = searchParams.get('error_description')

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/auth/signin?error=${encodeURIComponent(errorDescription)}`
    )
  }

  if (code) {
    const supabase = getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.redirect(`${origin}/auth/signin`)
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const safeNext = next.startsWith('/') ? next : '/dashboard'
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
    return NextResponse.redirect(
      `${origin}/auth/signin?error=${encodeURIComponent(error.message)}`
    )
  }

  return NextResponse.redirect(`${origin}/auth/signin`)
}
