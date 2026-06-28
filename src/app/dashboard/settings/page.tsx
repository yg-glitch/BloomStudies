'use client'

import { useState, useEffect } from 'react'
import {
  Settings, User, Bell, Globe, Lock, Trash2, Download,
  CreditCard, Sparkles, Check, Copy, Gift, Crown,
  AlertCircle, Moon, Sun, ChevronRight, ExternalLink,
  RefreshCw, Shield, Zap, Infinity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/components/SubscriptionProvider'
import { useTheme } from '@/components/ThemeProvider'
import { PLAN_LIMITS } from '@/lib/subscription'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { useToast } from '@/components/ui/Toast'

type Tab = 'profile' | 'billing' | 'notifications' | 'appearance' | 'danger'

const MOCK_BILLING_HISTORY = [
  { id: 'inv_001', date: 'Jun 1, 2025', amount: '€9.99', status: 'paid', description: 'Bloom Premium — Monthly' },
  { id: 'inv_002', date: 'May 1, 2025', amount: '€9.99', status: 'paid', description: 'Bloom Premium — Monthly' },
  { id: 'inv_003', date: 'Apr 1, 2025', amount: '€9.99', status: 'paid', description: 'Bloom Premium — Monthly' },
]

export default function SettingsPage() {
  const { plan, limits, usage, isPremium, upgradeToPremium, openBillingPortal, referralCode, referralUrl, checkLimit } = useSubscription()
  const { theme, toggleTheme } = useTheme()
  const { success: toastSuccess, error: toastError, xp: toastXP } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      setActiveTab('billing')
      // In production: verify subscription status via webhook
    }
    if (params.get('tab') === 'billing') setActiveTab('billing')
  }, [])

  const handleUpgrade = async () => {
    setUpgradeError('')
    try {
      await upgradeToPremium(couponCode || undefined)
    } catch (e: any) {
      setUpgradeError(e.message)
    }
  }

  const handlePortal = async () => {
    setIsLoadingPortal(true)
    try {
      await openBillingPortal()
    } catch {
      setUpgradeError('Billing portal requires an active subscription.')
    } finally {
      setIsLoadingPortal(false)
    }
  }

  const copyReferral = async () => {
    await navigator.clipboard.writeText(referralUrl || referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const NAV_ITEMS = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'billing', icon: CreditCard, label: 'Billing & Plan' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'appearance', icon: Globe, label: 'Appearance' },
    { id: 'danger', icon: Trash2, label: 'Danger Zone' },
  ]

  return (
    <div className="page-container py-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="section-heading flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Settings className="w-6 h-6 text-white" />
          </div>
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account, subscription, and preferences</p>
      </div>

      {showUpgrade && <UpgradePrompt feature="Bloom Premium" onDismiss={() => setShowUpgrade(false)} />}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Nav */}
        <div className="space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as Tab)}
              className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === item.id ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
              {item.id === 'billing' && !isPremium && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-900 text-xs font-bold">FREE</span>
              )}
              {item.id === 'billing' && isPremium && (
                <Crown className="ml-auto w-4 h-4 text-amber-400" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-5">

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="p-6 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2"><User className="w-4 h-4 text-primary-500" /> Profile</h3>
              <div className="space-y-4">
                {[
                  { label: 'Full Name', placeholder: 'Your Name', type: 'text' },
                  { label: 'Email', placeholder: 'you@example.com', type: 'email' },
                  { label: 'School', placeholder: 'Your School', type: 'text' },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{field.label}</label>
                    <input type={field.type} placeholder={field.placeholder}
                      className="input" />
                  </div>
                ))}
                <button
                  onClick={() => toastSuccess('Profile saved', 'Your changes have been saved')}
                  className="btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-5">
              {/* Current plan */}
              <div className={cn('p-6 rounded-2xl border-2', isPremium ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-950/30 dark:to-accent-950/30' : 'border-slate-200 dark:border-slate-700 glass')}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isPremium ? <Crown className="w-5 h-5 text-amber-500" /> : <Zap className="w-5 h-5 text-slate-400" />}
                      <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                        {isPremium ? 'Bloom Premium' : 'Free Plan'}
                      </h3>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold', isPremium ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400')}>
                        {isPremium ? 'ACTIVE' : 'FREE'}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      {isPremium ? '€9.99/month · Renews automatically' : 'Upgrade to unlock everything'}
                    </p>
                  </div>
                  {isPremium && (
                    <button onClick={handlePortal} disabled={isLoadingPortal}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors disabled:opacity-50">
                      {isLoadingPortal ? <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                      Manage
                    </button>
                  )}
                </div>

                {/* Usage meters */}
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { label: 'AI Messages Today', used: usage.aiMessagesToday, limit: limits.aiMessagesPerDay },
                    { label: 'Gradings This Month', used: usage.gradingsThisMonth, limit: limits.gradingsPerMonth },
                    { label: 'Flashcard Decks', used: usage.flashcardDecksCreated, limit: limits.flashcardDecks },
                  ].map(m => (
                    <div key={m.label} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{m.label}</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {m.limit === -1 ? <span className="text-primary-500">∞</span> : `${m.used}/${m.limit}`}
                        </span>
                      </div>
                      {m.limit !== -1 && (
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', m.used / m.limit > 0.8 ? 'bg-red-500' : 'bg-gradient-to-r from-primary-500 to-accent-500')}
                            style={{ width: `${Math.min((m.used / m.limit) * 100, 100)}%` }} />
                        </div>
                      )}
                      {m.limit === -1 && <div className="text-xs text-primary-500 font-medium">Unlimited</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade section — only for free users */}
              {!isPremium && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 text-white shadow-xl shadow-primary-500/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold mb-1">Upgrade to Premium</h3>
                      <p className="text-white/80 text-sm mb-4">€9.99/month — Less than one grinds session</p>
                      <div className="grid sm:grid-cols-2 gap-2 mb-5">
                        {['Unlimited AI messages', 'Unlimited exam grading', 'Unlimited flashcards', 'Audio podcasts', 'Full analytics', 'Exam predictions', 'Priority AI', 'Referral rewards'].map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-white/90">
                            <Check className="w-3.5 h-3.5 text-white shrink-0" />{f}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
                          <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Discount code..."
                            className="bg-transparent text-white placeholder-white/50 text-sm focus:outline-none flex-1 min-w-0" />
                          {couponCode && <span className="text-xs text-white/60">→</span>}
                        </div>
                        <button onClick={handleUpgrade}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-primary-700 font-bold text-sm hover:shadow-lg transition-all">
                          <Sparkles className="w-4 h-4" /> Upgrade Now
                        </button>
                      </div>
                      {upgradeError && <p className="mt-2 text-red-200 text-xs">{upgradeError}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Referral system */}
              <div className="p-6 rounded-2xl card">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Gift className="w-4 h-4 text-primary-500" /> Referral Rewards</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Share your link and get 1 month free for you and your friend when they upgrade.</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-700 dark:text-slate-300 truncate">
                    {referralUrl || `Loading...`}
                  </div>
                  <button onClick={copyReferral}
                    className={cn('flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all shrink-0', copied ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-400')}>
                    {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
                  </button>
                </div>
                {referralCode && (
                  <p className="text-xs text-slate-400 mt-2">Your code: <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{referralCode}</span></p>
                )}
              </div>

              {/* Billing history — only for premium */}
              {isPremium && (
                <div className="p-6 rounded-2xl card">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary-500" /> Billing History</h3>
                  <div className="space-y-2">
                    {MOCK_BILLING_HISTORY.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{inv.description}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{inv.date} · {inv.id}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900 dark:text-white">{inv.amount}</span>
                          <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-medium">
                            {inv.status}
                          </span>
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handlePortal} disabled={isLoadingPortal}
                    className="mt-4 w-full py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> View Full Billing History in Stripe
                  </button>
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="p-6 rounded-2xl card space-y-5">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Bell className="w-4 h-4 text-primary-500" /> Notifications</h3>
              {[
                { label: 'Study reminders', desc: 'Daily nudge to keep your streak going', state: notifications, toggle: () => setNotifications(!notifications) },
                { label: 'Weekly report', desc: 'Your progress summary every Sunday', state: emailUpdates, toggle: () => setEmailUpdates(!emailUpdates) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white text-sm">{item.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                  </div>
                  <button onClick={item.toggle}
                    className={cn('w-12 h-6 rounded-full p-0.5 transition-all', item.state ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700')}>
                    <div className={cn('w-5 h-5 rounded-full bg-white transition-all shadow-sm', item.state ? 'translate-x-6' : 'translate-x-0')} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="p-6 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2"><Globe className="w-4 h-4 text-primary-500" /> Appearance</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Dark Mode</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Currently: {theme === 'dark' ? 'Dark' : 'Light'}</div>
                </div>
                <button onClick={toggleTheme}
                  className={cn('w-14 h-8 rounded-full p-1 transition-all', theme === 'dark' ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700')}>
                  <div className={cn('w-6 h-6 rounded-full bg-white transition-all flex items-center justify-center shadow-sm', theme === 'dark' ? 'translate-x-6' : 'translate-x-0')}>
                    {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-primary-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* DANGER */}
          {activeTab === 'danger' && (
            <div className="p-6 rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Danger Zone</h3>
              <div className="space-y-3">
                <button className="px-4 py-2.5 rounded-xl border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  Clear All Local Data
                </button>
                <button className="px-4 py-2.5 rounded-xl border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}





