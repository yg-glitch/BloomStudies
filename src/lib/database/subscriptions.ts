import { createClient } from '@/lib/supabase/client'

export type Subscription = {
  id: string
  user_id: string
  plan: 'free' | 'premium'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data
}

export async function createSubscription(userId: string, subscription: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Subscription | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({ user_id: userId, ...subscription })
    .select()
    .single()

  if (error) return null
  return data
}

export async function updateSubscription(userId: string, updates: Partial<Subscription>): Promise<Subscription | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return null
  return data
}

export async function isPremiumUser(userId: string): Promise<boolean> {
  const subscription = await getSubscription(userId)
  if (!subscription) return false
  
  return subscription.plan === 'premium' && subscription.status === 'active'
}

export async function cancelSubscription(userId: string): Promise<Subscription | null> {
  return await updateSubscription(userId, { status: 'canceled' })
}

