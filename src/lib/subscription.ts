/**
 * Subscription plan definitions and feature gating
 */

export type Plan = 'free' | 'premium'

export interface PlanLimits {
  aiMessagesPerDay: number       // -1 = unlimited
  gradingsPerMonth: number
  flashcardDecks: number
  audioLessons: number
  notesPerMonth: number
  analyticsAccess: boolean
  examPredictions: boolean
  priorityAI: boolean
  referralRewards: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    aiMessagesPerDay: 10,
    gradingsPerMonth: 3,
    flashcardDecks: 3,
    audioLessons: 2,
    notesPerMonth: 5,
    analyticsAccess: false,
    examPredictions: false,
    priorityAI: false,
    referralRewards: false,
  },
  premium: {
    aiMessagesPerDay: -1,
    gradingsPerMonth: -1,
    flashcardDecks: -1,
    audioLessons: -1,
    notesPerMonth: -1,
    analyticsAccess: true,
    examPredictions: true,
    priorityAI: true,
    referralRewards: true,
  },
}

export const PREMIUM_PRICE = 9.99
export const PREMIUM_PRICE_EUR = '€9.99'

export function isUnlimited(limit: number) {
  return limit === -1
}

export function canUseFeature(plan: Plan, feature: keyof PlanLimits): boolean {
  return !!PLAN_LIMITS[plan][feature]
}

export function getRemainingUsage(plan: Plan, feature: keyof PlanLimits, used: number): number {
  const limit = PLAN_LIMITS[plan][feature] as number
  if (limit === -1) return Infinity
  return Math.max(0, limit - used)
}
