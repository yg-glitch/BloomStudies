import { createClient } from '@/lib/supabase/client'

export type Flashcard = {
  id: string
  user_id: string
  deck_id: string | null
  subject: string | null
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
  next_review_date: string | null
  review_count: number
  correct_count: number
  mastery: number
  ease_factor: number
  interval: number
  created_at: string
  updated_at: string
  folder?: string | null
}

export type FlashcardDeck = {
  id: string
  user_id: string
  title: string
  subject: string | null
  created_at: string
  updated_at: string
}

export async function getFlashcardDecks(userId: string): Promise<FlashcardDeck[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('flashcard_decks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function createFlashcardDeck(userId: string, title: string, subject?: string): Promise<FlashcardDeck | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('flashcard_decks')
    .insert({ user_id: userId, title, subject })
    .select()
    .single()

  if (error) return null
  return data
}

export async function deleteFlashcardDeck(deckId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('flashcard_decks')
    .delete()
    .eq('id', deckId)

  return !error
}

export async function getFlashcards(userId: string, deckId?: string, subject?: string, folder?: string): Promise<Flashcard[]> {
  const supabase = createClient()
  let query = supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)

  if (deckId) query = query.eq('deck_id', deckId)
  if (subject) query = query.eq('subject', subject)
  if (folder) query = query.eq('folder', folder)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function getFlashcardsByDeck(deckId: string): Promise<Flashcard[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function getFlashcard(flashcardId: string): Promise<Flashcard | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('id', flashcardId)
    .single()

  if (error) return null
  return data
}

export async function createFlashcard(userId: string, flashcard: Omit<Flashcard, 'id' | 'user_id' | 'review_count' | 'correct_count' | 'mastery' | 'ease_factor' | 'interval' | 'created_at' | 'updated_at'>): Promise<Flashcard | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      user_id: userId,
      ...flashcard,
      review_count: 0,
      correct_count: 0,
      mastery: 0,
      ease_factor: 2.5,
      interval: 1,
    })
    .select()
    .single()

  if (error) return null
  return data
}

export async function updateFlashcard(flashcardId: string, updates: Partial<Flashcard>): Promise<Flashcard | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('flashcards')
    .update(updates)
    .eq('id', flashcardId)
    .select()
    .single()

  if (error) return null
  return data
}

export async function deleteFlashcard(flashcardId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', flashcardId)

  return !error
}

export async function reviewFlashcard(flashcardId: string, rating: number): Promise<Flashcard | null> {
  // SM-2 Algorithm implementation
  // rating: 0-5 (0: again, 1: hard, 2: good, 3: easy)
  const flashcard = await getFlashcard(flashcardId)
  if (!flashcard) return null

  const { ease_factor, interval, review_count, mastery } = flashcard
  let newEaseFactor = ease_factor
  let newInterval = interval
  let newReviewCount = review_count + 1
  let newMastery = mastery

  if (rating < 2) {
    // Failed - reset
    newInterval = 1
    newMastery = Math.max(0, mastery - 10)
  } else {
    if (review_count === 0) newInterval = 1
    else if (review_count === 1) newInterval = 6
    else newInterval = Math.round(interval * ease_factor)
    newMastery = Math.min(100, mastery + (rating - 1) * 5)
  }

  newEaseFactor = Math.max(1.3, ease_factor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))

  const now = new Date()
  const nextReviewDate = new Date(now.setDate(now.getDate() + newInterval)).toISOString()

  return await updateFlashcard(flashcardId, {
    review_count: newReviewCount,
    mastery: newMastery,
    ease_factor: newEaseFactor,
    interval: newInterval,
    next_review_date: nextReviewDate,
  })
}

export async function getDueFlashcards(userId: string): Promise<Flashcard[]> {
  const supabase = createClient()
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .or(`next_review_date.is.null,next_review_date.lte.${now}`)
    .order('next_review_date', { ascending: true })

  if (error) return []
  return data || []
}

