import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/signin')
}
