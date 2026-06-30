import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { SUPABASE_URL, isSupabaseConfigured } from '@/lib/supabase/config'

/**
 * Permanently deletes the currently authenticated user's account.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (server-only) to perform the privileged
 * admin delete. The caller is identified from their session cookie, so a user
 * can only ever delete their own account.
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 400 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Account deletion is not available — server is missing SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 501 }
    )
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 400 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const admin = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
