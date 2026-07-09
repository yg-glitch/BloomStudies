import { createClient } from '@/lib/supabase/client'

export type GradedAnswer = {
  id: string
  user_id: string
  subject: string | null
  question: string | null
  student_answer: string
  result: any
  education_system: string | null
  level: string | null
  created_at: string
}

export async function getGradedAnswers(userId: string, subject?: string): Promise<GradedAnswer[]> {
  const supabase = createClient()
  let query = supabase
    .from('graded_answers')
    .select('*')
    .eq('user_id', userId)

  if (subject) query = query.eq('subject', subject)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function createGradedAnswer(
  userId: string, 
  subject: string, 
  question: string, 
  studentAnswer: string, 
  result: any,
  educationSystem: string,
  level: string
): Promise<GradedAnswer | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('graded_answers')
    .insert({ 
      user_id: userId, 
      subject, 
      question, 
      student_answer: studentAnswer, 
      result,
      education_system: educationSystem,
      level
    })
    .select()
    .single()

  if (error) return null
  return data
}

export async function getGradedAnswer(answerId: string): Promise<GradedAnswer | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('graded_answers')
    .select('*')
    .eq('id', answerId)
    .single()

  if (error) return null
  return data
}

