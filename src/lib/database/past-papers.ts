import { createUniversalClient as createClient } from '@/lib/supabase/universal'

export type PastPaper = {
  id: string
  subject: string
  year: number
  level: 'Higher' | 'Ordinary'
  paper_number: number | null
  pdf_url: string | null
  marking_scheme_url: string | null
  duration: number | null
  question_count: number | null
  topics: string[] | null
  language: 'English' | 'Irish' | 'Both'
  audio_url: string | null
  examiner_report_url: string | null
  education_system: 'junior-cycle' | 'leaving-cert'
  created_at: string
}

export async function getPastPapers(filters?: {
  subject?: string
  year?: number
  level?: 'Higher' | 'Ordinary' | 'All'
}): Promise<PastPaper[]> {
  const supabase = await createClient()
  let query = supabase
    .from('past_papers')
    .select('*')
    .order('year', { ascending: false })
    .order('paper_number', { ascending: true })

  if (filters?.subject && filters.subject !== 'All') {
    query = query.eq('subject', filters.subject)
  }
  if (filters?.year) {
    query = query.eq('year', filters.year)
  }
  if (filters?.level && filters.level !== 'All') {
    query = query.eq('level', filters.level as 'Higher' | 'Ordinary')
  }

  const { data, error } = await query

  if (error) return []
  return data || []
}

export async function getPastPaper(id: string): Promise<PastPaper | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('past_papers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createPastPaper(paper: Omit<PastPaper, 'id' | 'created_at'>): Promise<PastPaper | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('past_papers')
    .insert(paper)
    .select()
    .single()

  if (error) return null
  return data
}

export async function updatePastPaper(id: string, updates: Partial<PastPaper>): Promise<PastPaper | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('past_papers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return null
  return data
}

export async function deletePastPaper(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('past_papers')
    .delete()
    .eq('id', id)

  return !error
}

export async function getPastPaperYears(): Promise<number[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('past_papers')
    .select('year')

  if (error) return []
  const years = [...new Set(data?.map(p => p.year) || [])]
  return years.sort((a, b) => b - a)
}

export async function getPastPaperSubjects(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('past_papers')
    .select('subject')

  if (error) return []
  const subjects = [...new Set(data?.map(p => p.subject) || [])]
  return subjects.sort()
}

