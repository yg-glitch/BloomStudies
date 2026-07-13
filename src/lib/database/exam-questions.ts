import { createUniversalClient as createClient } from '@/lib/supabase/universal'

export type Subject = {
  id: string
  name: string
  display_name: string
  code: string | null
  education_system: 'junior-cycle' | 'leaving-cert'
  levels: string[]
  description: string | null
  icon_color: string | null
  created_at: string
}

export type Topic = {
  id: string
  subject_id: string
  name: string
  description: string | null
  parent_topic_id: string | null
  order_index: number
  created_at: string
}

export type ExamQuestion = {
  id: string
  subject_id: string
  past_paper_id: string | null
  question_number: number
  part_number: string | null
  year: number
  level: 'Higher' | 'Ordinary' | 'Common'
  paper_number: number | null
  language: 'English' | 'Irish' | 'Both'
  question_text: string
  marks_available: number | null
  difficulty: 'easy' | 'medium' | 'hard'
  question_type: string | null
  topics: string[] | null
  tags: string[] | null
  examiner_notes: string | null
  common_mistakes: string[] | null
  created_at: string
  updated_at: string
}

export type MarkingScheme = {
  id: string
  question_id: string
  marking_points: any
  total_marks: number
  sample_answer: string | null
  examiner_feedback: string | null
  key_points: string[] | null
  created_at: string
  updated_at: string
}

export type QuestionProgress = {
  id: string
  user_id: string
  question_id: string
  status: 'not-started' | 'in-progress' | 'completed' | 'mastered'
  attempts: number
  best_score: number | null
  last_attempted_at: string | null
  last_score: number | null
  time_spent_seconds: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type QuestionBookmark = {
  id: string
  user_id: string
  question_id: string
  notes: string | null
  created_at: string
}

// ============================================================
// SUBJECTS
// ============================================================

export async function getSubjects(educationSystem?: 'junior-cycle' | 'leaving-cert'): Promise<Subject[]> {
  const supabase = await createClient()
  let query = supabase
    .from('subjects')
    .select('*')
    .order('display_name')

  if (educationSystem) {
    query = query.eq('education_system', educationSystem)
  }

  const { data, error } = await query

  if (error) return []
  return data || []
}

export async function getSubject(id: string): Promise<Subject | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getSubjectByName(name: string): Promise<Subject | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('name', name)
    .single()

  if (error) return null
  return data
}

// ============================================================
// TOPICS
// ============================================================

export async function getTopics(subjectId?: string): Promise<Topic[]> {
  const supabase = await createClient()
  let query = supabase
    .from('topics')
    .select('*')
    .order('order_index')

  if (subjectId) {
    query = query.eq('subject_id', subjectId)
  }

  const { data, error } = await query

  if (error) return []
  return data || []
}

export async function getTopic(id: string): Promise<Topic | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

// ============================================================
// EXAM QUESTIONS
// ============================================================

export async function getExamQuestions(filters?: {
  subjectId?: string
  topicId?: string
  year?: number
  level?: 'Higher' | 'Ordinary' | 'Common'
  difficulty?: 'easy' | 'medium' | 'hard'
  search?: string
}): Promise<ExamQuestion[]> {
  const supabase = await createClient()
  let query = supabase
    .from('exam_questions')
    .select('*')
    .order('year', { ascending: false })
    .order('question_number', { ascending: true })

  if (filters?.subjectId) {
    query = query.eq('subject_id', filters.subjectId)
  }

  if (filters?.topicId) {
    query = query.contains('topics', [filters.topicId])
  }

  if (filters?.year) {
    query = query.eq('year', filters.year)
  }

  if (filters?.level) {
    query = query.eq('level', filters.level)
  }

  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty)
  }

  if (filters?.search) {
    query = query.or(`question_text.ilike.%${filters.search}%,tags.cs.{${filters.search}}`)
  }

  const { data, error } = await query

  if (error) return []
  return data || []
}

export async function getExamQuestion(id: string): Promise<ExamQuestion | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null

  // Increment view count
  await supabase.rpc('increment_question_view_count', { question_id: id })

  return data
}

export async function getQuestionsByTopic(topicId: string): Promise<ExamQuestion[]> {
  return getExamQuestions({ topicId })
}

export async function getQuestionsBySubject(subjectId: string): Promise<ExamQuestion[]> {
  return getExamQuestions({ subjectId })
}

export async function getQuestionYears(): Promise<number[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exam_questions')
    .select('year')

  if (error) return []
  const years = [...new Set(data?.map(q => q.year) || [])]
  return years.sort((a, b) => b - a)
}

// ============================================================
// MARKING SCHEMES
// ============================================================

export async function getMarkingScheme(questionId: string): Promise<MarkingScheme | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marking_schemes')
    .select('*')
    .eq('question_id', questionId)
    .single()

  if (error) return null
  return data
}

// ============================================================
// USER PROGRESS
// ============================================================

export async function getUserQuestionProgress(userId: string, questionId: string): Promise<QuestionProgress | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_question_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .single()

  if (error) return null
  return data
}

export async function getUserAllProgress(userId: string, filters?: {
  subjectId?: string
  status?: 'not-started' | 'in-progress' | 'completed' | 'mastered'
}): Promise<QuestionProgress[]> {
  const supabase = await createClient()
  let query = supabase
    .from('user_question_progress')
    .select('*, exam_questions(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) return []
  return data || []
}

export async function updateUserQuestionProgress(
  userId: string,
  questionId: string,
  updates: Partial<QuestionProgress>
): Promise<QuestionProgress | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_question_progress')
    .upsert({
      user_id: userId,
      question_id: questionId,
      ...updates,
    })
    .select()
    .single()

  if (error) return null
  return data
}

export async function markQuestionCompleted(userId: string, questionId: string, score: number): Promise<QuestionProgress | null> {
  const existing = await getUserQuestionProgress(userId, questionId)
  const attempts = (existing?.attempts || 0) + 1
  const bestScore = existing?.best_score ? Math.max(existing.best_score, score) : score

  return updateUserQuestionProgress(userId, questionId, {
    status: score >= 80 ? 'mastered' : 'completed',
    attempts,
    best_score: bestScore,
    last_score: score,
    last_attempted_at: new Date().toISOString(),
  })
}

// ============================================================
// BOOKMARKS
// ============================================================

export async function getUserBookmarks(userId: string): Promise<QuestionBookmark[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('question_bookmarks')
    .select('*, exam_questions(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function isQuestionBookmarked(userId: string, questionId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('question_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .single()

  if (error) return false
  return !!data
}

export async function toggleQuestionBookmark(userId: string, questionId: string, notes?: string): Promise<boolean> {
  const supabase = await createClient()
  const isBookmarked = await isQuestionBookmarked(userId, questionId)

  if (isBookmarked) {
    // Remove bookmark
    const { error } = await supabase
      .from('question_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('question_id', questionId)

    // Decrement bookmark count
    await supabase.rpc('increment_question_bookmark_count', { question_id: questionId, increment: false })

    return !error
  } else {
    // Add bookmark
    const { error } = await supabase
      .from('question_bookmarks')
      .insert({
        user_id: userId,
        question_id: questionId,
        notes,
      })

    // Increment bookmark count
    await supabase.rpc('increment_question_bookmark_count', { question_id: questionId, increment: true })

    return !error
  }
}

export async function addQuestionToStudyPlanner(userId: string, questionId: string, date: Date): Promise<boolean> {
  const supabase = await createClient()
  const question = await getExamQuestion(questionId)
  
  if (!question) return false

  const subject = await getSubject(question.subject_id)
  if (!subject) return false

  // Create a study session for this question
  const { error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: userId,
      subject: subject.display_name,
      topic: question.tags?.join(', ') || question.question_text.substring(0, 50),
      date: date.toISOString().split('T')[0],
      session_type: 'practice',
      notes: `Practice question: ${question.year} ${question.level} Paper ${question.paper_number} Q${question.question_number}`,
    })

  return !error
}
