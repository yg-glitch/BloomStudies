import { createUniversalClient as createClient } from '@/lib/supabase/universal'

export type StudySession = {
  id: string
  user_id: string
  subject: string
  topic: string | null
  date: string
  duration_minutes: number | null
  completed: boolean
  created_at: string
}

export async function getStudySessions(userId: string, startDate?: Date, endDate?: Date): Promise<StudySession[]> {
  const supabase = await createClient()
  let query = supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)

  if (startDate) query = query.gte('date', startDate.toISOString().split('T')[0])
  if (endDate) query = query.lte('date', endDate.toISOString().split('T')[0])

  const { data, error } = await query.order('date', { ascending: false })

  if (error) return []
  return data || []
}

export async function createStudySession(userId: string, session: Omit<StudySession, 'id' | 'user_id' | 'created_at'>): Promise<StudySession | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({ user_id: userId, ...session })
    .select()
    .single()

  if (error) return null
  return data
}

export async function updateStudySession(sessionId: string, updates: Partial<StudySession>): Promise<StudySession | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('study_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) return null
  return data
}

export async function deleteStudySession(sessionId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', sessionId)

  return !error
}

export async function completeStudySession(sessionId: string, durationMinutes: number): Promise<StudySession | null> {
  return await updateStudySession(sessionId, { completed: true, duration_minutes: durationMinutes })
}

