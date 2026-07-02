import { createUniversalClient as createClient } from '@/lib/supabase/universal'

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  school: string | null
  year: string | null
  subjects: string[] | null
  bloom_score: number
  xp: number
  level: string
  streak: number
  last_streak_date: string | null
  created_at: string
  updated_at: string
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) return null
  return data
}

export async function incrementXP(userId: string, amount: number): Promise<void> {
  const profile = await getProfile(userId)
  if (!profile) return

  const newXP = profile.xp + amount
  let newLevel = profile.level

  // Level up logic
  if (newXP >= 10000 && profile.level !== 'Legend') newLevel = 'Legend'
  else if (newXP >= 5000 && profile.level !== 'Master') newLevel = 'Master'
  else if (newXP >= 2500 && profile.level !== 'Expert') newLevel = 'Expert'
  else if (newXP >= 1000 && profile.level !== 'Scholar') newLevel = 'Scholar'
  else if (newXP >= 500 && profile.level !== 'Learner') newLevel = 'Learner'
  else if (newXP >= 100 && profile.level !== 'Sprout') newLevel = 'Sprout'

  await updateProfile(userId, { xp: newXP, level: newLevel })
}

export async function updateStreak(userId: string): Promise<void> {
  const profile = await getProfile(userId)
  if (!profile) return

  const today = new Date().toISOString().split('T')[0]
  const lastStreakDate = profile.last_streak_date

  let newStreak = profile.streak

  if (lastStreakDate === today) {
    // Already studied today, no change
    return
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (lastStreakDate === yesterdayStr) {
    // Streak continues
    newStreak += 1
  } else if (lastStreakDate !== today) {
    // Streak reset
    newStreak = 1
  }

  await updateProfile(userId, { streak: newStreak, last_streak_date: today })
}

