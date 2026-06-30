'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

let cachedClient: SupabaseClient | null = null

/**
 * Returns a singleton browser Supabase client, or null when Supabase is not
 * configured. Callers must handle the null case (auth disabled).
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!cachedClient) {
    cachedClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return cachedClient
}
