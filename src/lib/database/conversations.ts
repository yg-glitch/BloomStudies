import { createUniversalClient as createClient } from '@/lib/supabase/universal'

export type Conversation = {
  id: string
  user_id: string
  title: string | null
  subject: string | null
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (error) return null
  return data
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) return []
  return data || []
}

export async function createConversation(userId: string, title?: string, subject?: string): Promise<Conversation | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title, subject })
    .select()
    .single()

  if (error) return null
  return data
}

export async function addMessage(conversationId: string, userId: string, role: 'user' | 'assistant', content: string): Promise<Message | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, user_id: userId, role, content })
    .select()
    .single()

  if (error) return null

  // Update conversation's updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  return data
}

export async function deleteConversation(conversationId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  return !error
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId)

  return !error
}

