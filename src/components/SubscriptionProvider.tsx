'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Plan, PLAN_LIMITS, PlanLimits } from '@/lib/subscription'
import { useLocalStorage } from '@/lib/useLocalStorage'
import { createClient } from '@/lib/supabase/client'

interface UsageData {
  aiMessagesToday: number
  gradingsThisMonth: number
  flashcardDecksCreated: number
  audioLessonsCreated: number
  notesThisMonth: number
  lastResetDate: string
  lastMonthResetDate: string
}

interface SubscriptionContextType {
  plan: Plan
  limits: PlanLimits
  usage: UsageData
  isPremium: boolean
  stripeCustomerId: string | null
  subscriptionEndDate: string | null
  checkLimit: (feature: keyof PlanLimits) => boolean
  incrementUsage: (feature: keyof UsageData) => void
  upgradeToPremium: (couponCode?: string, referralCode?: string) => Promise<void>
  openBillingPortal: () => Promise<void>
  referralCode: string
  referralUrl: string
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

const DEFAULT_USAGE: UsageData = {
  aiMessagesToday: 0,
  gradingsThisMonth: 0,
  flashcardDecksCreated: 0,
  audioLessonsCreated: 0,
  notesThisMonth: 0,
  lastResetDate: new Date().toDateString(),
  lastMonthResetDate: new Date().toISOString().slice(0, 7),
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useLocalStorage<Plan>('bloom-plan', 'free')
  const [stripeCustomerId, setStripeCustomerId] = useLocalStorage<string | null>('bloom-stripe-customer', null)
  const [subscriptionEndDate, setSubscriptionEndDate] = useLocalStorage<string | null>('bloom-sub-end', null)
  const [usage, setUsage] = useLocalStorage<UsageData>('bloom-usage', DEFAULT_USAGE)
  const [referralCode, setReferralCode] = useState('')
  const [referralUrl, setReferralUrl] = useState('')

  const limits = PLAN_LIMITS[plan]
  const isPremium = plan === 'premium'

  // Sync plan from Supabase — source of truth, prevents localStorage bypass
  useEffect(() => {
    const syncPlan = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, stripe_customer_id')
          .eq('id', user.id)
          .single()
        if (profile) {
          setPlan((profile.plan as Plan) || 'free')
          if (profile.stripe_customer_id) setStripeCustomerId(profile.stripe_customer_id)
        }
      } catch { /* non-blocking */ }
    }
    syncPlan()
  }, [])

  // Reset daily/monthly counters
  useEffect(() => {
    const today = new Date().toDateString()
    const thisMonth = new Date().toISOString().slice(0, 7)
    setUsage(u => {
      let updated = { ...u }
      if (u.lastResetDate !== today) updated = { ...updated, aiMessagesToday: 0, lastResetDate: today }
      if (u.lastMonthResetDate !== thisMonth) updated = { ...updated, gradingsThisMonth: 0, notesThisMonth: 0, audioLessonsCreated: 0, lastMonthResetDate: thisMonth }
      return updated
    })
  }, [])

  // Generate referral code
  useEffect(() => {
    const uid = stripeCustomerId || 'user_' + Math.random().toString(36).slice(2, 9)
    fetch('/api/stripe/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: uid }),
    }).then(r => r.json()).then(d => {
      if (d.referralCode) { setReferralCode(d.referralCode); setReferralUrl(d.referralUrl) }
    }).catch(() => {})
  }, [stripeCustomerId])

  const checkLimit = (feature: keyof PlanLimits): boolean => {
    if (isPremium) return true
    const limit = limits[feature]
    if (typeof limit === 'boolean') return limit
    if (limit === -1) return true
    const usageMap: Partial<Record<keyof PlanLimits, number>> = {
      aiMessagesPerDay: usage.aiMessagesToday,
      gradingsPerMonth: usage.gradingsThisMonth,
      flashcardDecks: usage.flashcardDecksCreated,
      audioLessons: usage.audioLessonsCreated,
      notesPerMonth: usage.notesThisMonth,
    }
    return (usageMap[feature] ?? 0) < (limit as number)
  }

  const incrementUsage = (feature: keyof UsageData) => {
    setUsage(u => ({ ...u, [feature]: (u[feature] as number) + 1 }))
  }

  const upgradeToPremium = async (couponCode?: string, referralCode?: string) => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID, couponCode, referralCode }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else throw new Error(data.error || 'Failed to create checkout session')
  }

  const openBillingPortal = async () => {
    if (!stripeCustomerId) throw new Error('No customer ID — please upgrade first')
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: stripeCustomerId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else throw new Error(data.error || 'Failed to open billing portal')
  }

  return (
    <SubscriptionContext.Provider value={{
      plan, limits, usage, isPremium, stripeCustomerId,
      subscriptionEndDate, checkLimit, incrementUsage,
      upgradeToPremium, openBillingPortal, referralCode, referralUrl,
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}

