/**
 * Supabase configuration helpers.
 *
 * The app is designed to run with OR without Supabase configured. When the
 * environment variables are missing (e.g. local demo / preview), auth-related
 * features degrade gracefully instead of crashing the build or runtime.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const PLACEHOLDER_VALUES = new Set([
  '',
  'your_supabase_project_url',
  'your_supabase_anon_key',
])

/**
 * Returns true only when real (non-placeholder) Supabase credentials are set.
 */
export function isSupabaseConfigured(): boolean {
  return (
    !PLACEHOLDER_VALUES.has(SUPABASE_URL) &&
    !PLACEHOLDER_VALUES.has(SUPABASE_ANON_KEY) &&
    SUPABASE_URL.startsWith('http')
  )
}

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Authentication is not configured yet. Add your Supabase project URL and anon key to enable sign in.'
