import { createUniversalClient as createClient } from '@/lib/supabase/universal'

export type LearningResource = {
  id: string
  title: string
  description: string | null
  type: 'video' | 'article' | 'notes' | 'guide' | 'podcast' | 'flashcards' | 'quiz' | 'sample-answer' | 'marking-scheme'
  subject: string
  level: 'higher' | 'ordinary' | 'all'
  category: 'leaving-cert' | 'junior-cycle' | 'study-skills' | 'exam-technique' | 'cao' | 'wellbeing' | 'ai-tips'
  content: string | null
  thumbnail_color: string | null
  duration: number | null
  views: number
  likes: number
  rating: number
  creator_name: string | null
  creator_avatar: string | null
  creator_verified: boolean
  creator_type: string | null
  creator_followers: number
  topics: string[] | null
  created_at: string
  updated_at: string
}

export async function getLearningResources(filters?: {
  category?: string
  subject?: string
  type?: string
  level?: string
  search?: string
}): Promise<LearningResource[]> {
  const supabase = await createClient()
  let query = supabase
    .from('learning_resources')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters?.subject && filters.subject !== 'All') {
    query = query.eq('subject', filters.subject)
  }
  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }
  if (filters?.level && filters.level !== 'all') {
    query = query.eq('level', filters.level)
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) return []
  return data || []
}

export async function getLearningResource(id: string): Promise<LearningResource | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('learning_resources')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createLearningResource(resource: Omit<LearningResource, 'id' | 'views' | 'likes' | 'rating' | 'created_at' | 'updated_at'>): Promise<LearningResource | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('learning_resources')
    .insert({
      ...resource,
      views: 0,
      likes: 0,
      rating: 0,
    })
    .select()
    .single()

  if (error) return null
  return data
}

export async function updateLearningResource(id: string, updates: Partial<LearningResource>): Promise<LearningResource | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('learning_resources')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return null
  return data
}

export async function deleteLearningResource(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('learning_resources')
    .delete()
    .eq('id', id)

  return !error
}

export async function incrementResourceViews(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment_views', { resource_id: id })
}

