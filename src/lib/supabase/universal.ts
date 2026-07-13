/**
 * Universal Supabase client that works in both server and client contexts.
 * 
 * - Server components / API routes: uses server-side client (cookies)
 * - Client components: uses browser client
 * 
 * All `src/lib/database/*.ts` helpers should import from here.
 */

import { createBrowserClient } from '@supabase/ssr'

// Detect if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

export async function createUniversalClient() {
  if (isBrowser) {
    // Client-side: use browser client directly (inline to avoid import issues)
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  
  // Server-side: use server client with dynamic import
  // This ensures next/headers is only imported on the server
  const { createServerClient } = await import('@supabase/ssr')
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
