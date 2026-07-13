import { createClient } from '@/lib/supabase/client'

export type Note = {
  id: string
  user_id: string
  title: string
  content: string
  subject: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

export async function getNotes(userId: string, subject?: string): Promise<Note[]> {
  const supabase = createClient()
  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)

  if (subject) query = query.eq('subject', subject)

  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function getNote(noteId: string): Promise<Note | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .single()

  if (error) return null
  return data
}

export async function createNote(userId: string, note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Note | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, ...note })
    .select()
    .single()

  if (error) return null
  return data
}

export async function updateNote(noteId: string, updates: Partial<Note>): Promise<Note | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .select()
    .single()

  if (error) return null
  return data
}

export async function deleteNote(noteId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)

  return !error
}

export async function searchNotes(userId: string, query: string): Promise<Note[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('updated_at', { ascending: false })

  if (error) return []
  return data || []
}

