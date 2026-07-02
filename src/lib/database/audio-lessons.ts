import { createUniversalClient as createClient } from '@/lib/supabase/universal'

export type AudioLesson = {
  id: string
  user_id: string
  title: string
  subject: string
  duration: number
  script: string
  transcript: string
  voice: string
  bookmarks: number[]
  progress: number
  created_at: string
}

export async function getAudioLessons(userId: string): Promise<AudioLesson[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audio_lessons')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function getAudioLesson(id: string): Promise<AudioLesson | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audio_lessons')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createAudioLesson(userId: string, lesson: Omit<AudioLesson, 'id' | 'user_id' | 'created_at'>): Promise<AudioLesson | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audio_lessons')
    .insert({ user_id: userId, ...lesson })
    .select()
    .single()

  if (error) return null
  return data
}

export async function updateAudioLesson(id: string, updates: Partial<AudioLesson>): Promise<AudioLesson | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audio_lessons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return null
  return data
}

export async function deleteAudioLesson(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('audio_lessons')
    .delete()
    .eq('id', id)

  return !error
}

export async function updateAudioLessonProgress(id: string, progress: number): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('audio_lessons')
    .update({ progress })
    .eq('id', id)
}

export async function addAudioLessonBookmark(id: string, bookmarkPosition: number): Promise<void> {
  const supabase = await createClient()
  const lesson = await getAudioLesson(id)
  if (!lesson) return

  const bookmarks = lesson.bookmarks || []
  await supabase
    .from('audio_lessons')
    .update({ bookmarks: [...bookmarks, bookmarkPosition] })
    .eq('id', id)
}

