import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/conversations/:id — fetch messages for a conversation
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ messages: [] })

    // Verify ownership
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!conv) return NextResponse.json({ messages: [] })

    const { data: messages } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ messages: messages || [] })
  } catch {
    return NextResponse.json({ messages: [] })
  }
}
