import { createClient } from '@/lib/supabase/client'

export type Exam = {
  id: string
  user_id: string
  subject: string
  exam_date: string
  exam_level: 'Junior Cycle' | 'Leaving Cert' | null
  target_grade: string | null
  created_at: string
}

export type ExamGrade = {
  id: string
  user_id: string
  subject: string
  exam_type: string | null
  grade: string | null
  percentage: number | null
  date: string
  created_at: string
}

export async function getExams(userId: string): Promise<Exam[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('user_id', userId)
    .order('exam_date', { ascending: true })

  if (error) return []
  return data || []
}

export async function createExam(userId: string, exam: Omit<Exam, 'id' | 'user_id' | 'created_at'>): Promise<Exam | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exams')
    .insert({ user_id: userId, ...exam })
    .select()
    .single()

  if (error) return null
  return data
}

export async function updateExam(examId: string, updates: Partial<Exam>): Promise<Exam | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exams')
    .update(updates)
    .eq('id', examId)
    .select()
    .single()

  if (error) return null
  return data
}

export async function deleteExam(examId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId)

  return !error
}

export async function getExamGrades(userId: string, subject?: string): Promise<ExamGrade[]> {
  const supabase = createClient()
  let query = supabase
    .from('exam_grades')
    .select('*')
    .eq('user_id', userId)

  if (subject) query = query.eq('subject', subject)

  const { data, error } = await query.order('date', { ascending: false })

  if (error) return []
  return data || []
}

export async function createExamGrade(userId: string, grade: Omit<ExamGrade, 'id' | 'user_id' | 'created_at'>): Promise<ExamGrade | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exam_grades')
    .insert({ user_id: userId, ...grade })
    .select()
    .single()

  if (error) return null
  return data
}

export async function getUpcomingExams(userId: string): Promise<Exam[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('user_id', userId)
    .gte('exam_date', today)
    .order('exam_date', { ascending: true })

  if (error) return []
  return data || []
}

