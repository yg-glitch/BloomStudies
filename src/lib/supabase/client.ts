import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Check if we're in a build environment
  const isBuild = typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build'

  if (isBuild) {
    // Return a mock client during build to prevent errors
    // This will be replaced with a real client at runtime
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Not available during build') }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: new Error('Not available during build') }),
        update: () => ({ data: null, error: new Error('Not available during build') }),
        delete: () => ({ data: null, error: new Error('Not available during build') }),
      }),
    } as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
