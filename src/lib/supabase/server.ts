import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

/**
 * Creates a server-side Supabase client bound to the request cookies.
 * Returns null when Supabase is not configured.
 *
 * Use inside Server Components, Route Handlers and Server Actions.
 */
export function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null

  const cookieStore = cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if middleware refreshes sessions.
        }
      },
    },
  })
}
