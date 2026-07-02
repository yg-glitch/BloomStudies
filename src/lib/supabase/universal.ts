/**
 * Universal Supabase client that works in both server and client contexts.
 * 
 * - Server components / API routes: uses server-side client (cookies)
 * - Client components: uses browser client
 * 
 * All `src/lib/database/*.ts` helpers should import from here.
 */

// Detect if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

export async function createUniversalClient() {
  if (isBrowser) {
    // Client-side: use browser client
    const { createClient } = await import('@/lib/supabase/client')
    return createClient()
  } else {
    // Server-side: use server client
    const { createClient } = await import('@/lib/supabase/server')
    return await createClient()
  }
}
