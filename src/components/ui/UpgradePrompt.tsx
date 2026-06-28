'use client'

import { Sparkles, Lock, ArrowRight, X } from 'lucide-react'
import { useSubscription } from '@/components/SubscriptionProvider'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface UpgradePromptProps {
  feature: string
  description?: string
  inline?: boolean
  onDismiss?: () => void
}

export default function UpgradePrompt({ feature, description, inline = false, onDismiss }: UpgradePromptProps) {
  const { upgradeToPremium } = useSubscription()
  const [coupon, setCoupon] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpgrade = async () => {
    setIsLoading(true)
    setError('')
    try {
      await upgradeToPremium(coupon || undefined)
    } catch (e: any) {
      setError(e.message || 'Failed to start checkout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (inline) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-950/30 dark:to-accent-950/30 border border-primary-200 dark:border-primary-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{feature} — Premium only</p>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>}
        </div>
        <button onClick={handleUpgrade} disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white text-sm font-semibold hover:shadow-lg transition-all shrink-0 disabled:opacity-50">
          <Sparkles className="w-3.5 h-3.5" />
          Upgrade
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-primary-500 to-accent-600 text-white relative">
          {onDismiss && (
            <button onClick={onDismiss} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-1">Unlock {feature}</h2>
          <p className="text-white/80 text-sm">Upgrade to Bloom Premium to access this feature</p>
        </div>

        <div className="p-6 space-y-4">
          {/* What you get */}
          <div className="space-y-2.5">
            {[
              'Unlimited AI Tutor messages',
              'Unlimited exam grading',
              'Unlimited flashcard decks',
              'Audio podcast generation',
              'Full analytics dashboard',
              'Exam grade predictions',
              'Priority AI responses',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                <div className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {item}
              </div>
            ))}
          </div>

          {/* Coupon code */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              Discount code (optional)
            </label>
            <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
              placeholder="BLOOM20 or referral code"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none text-sm" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button onClick={handleUpgrade} disabled={isLoading}
            className={cn('w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-all',
              isLoading ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-primary-600 to-accent-500 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.01]')}>
            {isLoading
              ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
              : <><Sparkles className="w-5 h-5" />Upgrade for €9.99/month<ArrowRight className="w-5 h-5" /></>}
          </button>

          <p className="text-center text-xs text-slate-400">
            Cancel anytime · Secure payment via Stripe · No hidden fees
          </p>
        </div>
      </div>
    </div>
  )
}
