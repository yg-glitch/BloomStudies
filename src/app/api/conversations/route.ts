import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/conversations — fetch all conversations for current user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ conversations: [] })

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, subject, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ conversations: [] })
    return NextResponse.json({ conversations: data || [] })
  } catch (error: any) {
    return NextResponse.json({ conversations: [] })
  }
}

// DELETE /api/conversations?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'No ID' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await supabase.from('conversations').delete().eq('id', id).eq('user_id', user.id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
