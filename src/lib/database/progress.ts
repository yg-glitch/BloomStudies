import { createUniversalClient as createClient } from '@/lib/supabase/universal'

export type Progress = {
  id: string
  user_id: string
  subject: string
  hours_studied: number
  lessons_completed: number
  flashcards_mastered: number
  average_grade: number | null
  last_updated: string
}

export async function getProgress(userId: string): Promise<Progress[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)

  if (error) return []
  return data || []
}

export async function getSubjectProgress(userId: string, subject: string): Promise<Progress | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .eq('subject', subject)
    .single()

  if (error) return null
  return data
}

export async function updateProgress(userId: string, subject: string, updates: Partial<Progress>): Promise<Progress | null> {
  const supabase = await createClient()
  
  // Check if progress exists
  const existing = await getSubjectProgress(userId, subject)
  
  if (existing) {
    const { data, error } = await supabase
      .from('progress')
      .update({ ...updates, last_updated: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('subject', subject)
      .select()
      .single()

    if (error) return null
    return data
  } else {
    const { data, error } = await supabase
      .from('progress')
      .insert({
        user_id: userId,
        subject,
        hours_studied: updates.hours_studied || 0,
        lessons_completed: updates.lessons_completed || 0,
        flashcards_mastered: updates.flashcards_mastered || 0,
        average_grade: updates.average_grade || null,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return null
    return data
  }
}

export async function incrementStudyHours(userId: string, subject: string, hours: number): Promise<Progress | null> {
  const progress = await getSubjectProgress(userId, subject)
  const currentHours = progress?.hours_studied || 0
  return await updateProgress(userId, subject, { hours_studied: currentHours + hours })
}

export async function incrementLessonsCompleted(userId: string, subject: string): Promise<Progress | null> {
  const progress = await getSubjectProgress(userId, subject)
  const currentLessons = progress?.lessons_completed || 0
  return await updateProgress(userId, subject, { lessons_completed: currentLessons + 1 })
}

export async function updateAverageGrade(userId: string, subject: string, newGrade: number): Promise<Progress | null> {
  const progress = await getSubjectProgress(userId, subject)
  if (!progress) return null

  const currentAverage = progress.average_grade || 0
  const currentLessons = progress.lessons_completed || 1
  const newAverage = (currentAverage * currentLessons + newGrade) / (currentLessons + 1)
  
  return await updateProgress(userId, subject, { average_grade: Math.round(newAverage) })
}

