import { createUniversalClient as createClient } from '@/lib/supabase/universal'

export type AIMemory = {
  id: string
  user_id: string
  feature: string
  context_key: string
  context_value: any
  importance: number
  last_accessed: string
  access_count: number
  created_at: string
}

export async function getAIMemory(userId: string, feature?: string, contextKey?: string): Promise<AIMemory[]> {
  const supabase = await createClient()
  let query = supabase
    .from('ai_memory')
    .select('*')
    .eq('user_id', userId)
    .order('importance', { ascending: false })
    .order('last_accessed', { ascending: false })

  if (feature) {
    query = query.eq('feature', feature)
  }
  if (contextKey) {
    query = query.eq('context_key', contextKey)
  }

  const { data, error } = await query

  if (error) return []
  return data || []
}

export async function getRelevantContext(userId: string, subject?: string, limit: number = 10): Promise<any[]> {
  const supabase = await createClient()
  let query = supabase
    .from('ai_memory')
    .select('*')
    .eq('user_id', userId)
    .order('importance', { ascending: false })
    .order('last_accessed', { ascending: false })
    .limit(limit)

  if (subject) {
    query = query.contains('context_key', subject)
  }

  const { data, error } = await query

  if (error) return []
  return data?.map(m => ({
    feature: m.feature,
    context: m.context_value,
    importance: m.importance,
  })) || []
}

export async function createAIMemory(userId: string, memory: Omit<AIMemory, 'id' | 'user_id' | 'last_accessed' | 'access_count' | 'created_at'>): Promise<AIMemory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_memory')
    .insert({
      user_id: userId,
      ...memory,
      last_accessed: new Date().toISOString(),
      access_count: 0,
    })
    .select()
    .single()

  if (error) return null
  return data
}

export async function updateAIMemory(id: string, updates: Partial<AIMemory>): Promise<AIMemory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_memory')
    .update({
      ...updates,
      last_accessed: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return null
  return data
}

export async function incrementAIMemoryAccess(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment_ai_memory_access', { memory_id: id })
}

export async function deleteAIMemory(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ai_memory')
    .delete()
    .eq('id', id)

  return !error
}

export async function cleanupOldAIMemory(userId: string, daysToKeep: number = 30): Promise<number> {
  const supabase = await createClient()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const { data, error } = await supabase
    .from('ai_memory')
    .delete()
    .lt('last_accessed', cutoffDate.toISOString())
    .eq('user_id', userId)
    .select('count')

  if (error) return 0
  return data?.length || 0
}

