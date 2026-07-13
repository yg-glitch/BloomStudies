'use client'

import { useState, useEffect } from 'react'
import {
  Settings, User, Bell, Globe, Lock, Trash2, Download,
  CreditCard, Sparkles, Check, Copy, Gift, Crown,
  Moon, Sun, ExternalLink, BookOpen, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/components/SubscriptionProvider'
import { useTheme } from '@/components/ThemeProvider'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

type Tab = 'profile' | 'billing' | 'notifications' | 'privacy' | 'study' | 'appearance' | 'danger'

interface BillingInvoice {
  id: string
  date: string
  amount: string
  status: string
  description: string
  pdf?: string | null
}

export default function SettingsPage() {
  const { plan, limits, usage, isPremium, upgradeToPremium, openBillingPortal, referralCode, referralUrl } = useSubscription()
  const { theme, toggleTheme } = useTheme()
  const { success: toastSuccess, error: toastError } = useToast()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profileSchool, setProfileSchool] = useState('')
  const [profileYear, setProfileYear] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [billingHistory, setBillingHistory] = useState<BillingInvoice[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        setProfileName(profile.full_name || '')
        setProfileEmail(profile.email || user.email || '')
        setProfileSchool(profile.school || '')
        setProfileYear(profile.year || '')
      } else {
        setProfileEmail(user.email || '')
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'billing' || params.get('success') === 'true') setActiveTab('billing')
  }, [])

  useEffect(() => {
    if (activeTab === 'billing' && isPremium && billingHistory.length === 0) {
      setIsLoadingInvoices(true)
      fetch('/api/stripe/invoices')
        .then(r => r.json())
        .then(d => { if (d.invoices) setBillingHistory(d.invoices) })
        .catch(() => {})
        .finally(() => setIsLoadingInvoices(false))
    }
  }, [activeTab, isPremium])

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('profiles').update({
        full_name: profileName, school: profileSchool, year: profileYear,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
      if (error) throw error
      toastSuccess('Profile saved', 'Your changes have been updated')
    } catch (err: any) {
      toastError('Save failed', err.message)
    } finally { setIsSavingProfile(false) }
  }

  const handleUpgrade = async () => {
    setUpgradeError('')
    try { await upgradeToPremium(couponCode || undefined) }
    catch (e: any) { setUpgradeError(e.message) }
  }

  const handlePortal = async () => {
    setIsLoadingPortal(true)
    try { await openBillingPortal() }
    catch { setUpgradeError('Billing portal requires an active subscription.') }
    finally { setIsLoadingPortal(false) }
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
    { id: 'privacy', icon: Lock, label: 'Privacy' },
    { id: 'study', icon: BookOpen, label: 'Study Preferences' },
    { id: 'appearance', icon: Globe, label: 'Appearance' },
    { id: 'danger', icon: Trash2, label: 'Danger Zone' },
  ]

  return (
    <div className="page-container py-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="section-heading flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md shrink-0">
            <Settings className="w-5 h-5 text-white" />
          </div>
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your account, subscription, and preferences</p>
      </div>

      {showUpgrade && <UpgradePrompt feature="Bloom Premium" onDismiss={() => setShowUpgrade(false)} />}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as Tab)}
              className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-sm',
                activeTab === item.id ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {item.id === 'billing' && !isPremium && <span className="ml-auto px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold">FREE</span>}
              {item.id === 'billing' && isPremium && <Crown className="ml-auto w-4 h-4 text-amber-400" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-5">

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="p-6 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-500" /> Profile
              </h3>
              <div className="space-y-4">
                {[
                  { id: 'name', label: 'Full Name', value: profileName, set: setProfileName, type: 'text', placeholder: 'Your Name' },
                  { id: 'school', label: 'School', value: profileSchool, set: setProfileSchool, type: 'text', placeholder: 'Your School' },
                ].map(f => (
                  <div key={f.id}>
                    <label htmlFor={`profile-${f.id}`} className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                    <input id={`profile-${f.id}`} type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="input" />
                  </div>
                ))}
                <div>
                  <label htmlFor="profile-email" className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input id="profile-email" type="email" value={profileEmail} disabled className="input opacity-60 cursor-not-allowed" />
                  <p className="text-xs text-slate-400 mt-1">Email cannot be changed here.</p>
                </div>
                <div>
                  <label htmlFor="profile-year" className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Year</label>
                  <select id="profile-year" value={profileYear} onChange={e => setProfileYear(e.target.value)} className="input">
                    <option value="">Select year…</option>
                    {['Junior Cycle 1','Junior Cycle 2','Junior Cycle 3','5th Year','6th Year','Other'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="btn-primary disabled:opacity-50">
                  {isSavingProfile ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-5">
              <div className={cn('p-6 rounded-2xl border-2', isPremium ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-950/30 dark:to-accent-950/30' : 'border-slate-200 dark:border-slate-700 card')}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isPremium ? <Crown className="w-5 h-5 text-amber-500" /> : <Zap className="w-5 h-5 text-slate-400" />}
                      <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{isPremium ? 'Bloom Premium' : 'Free Plan'}</h3>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold', isPremium ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400')}>{isPremium ? 'ACTIVE' : 'FREE'}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{isPremium ? '€9.99/month · Renews automatically' : 'Upgrade to unlock everything'}</p>
                  </div>
                  {isPremium && (
                    <button onClick={handlePortal} disabled={isLoadingPortal} className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors disabled:opacity-50">
                      {isLoadingPortal ? <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /> : <ExternalLink className="w-4 h-4" />} Manage
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { label: 'AI Messages Today', used: usage.aiMessagesToday, limit: limits.aiMessagesPerDay },
                    { label: 'Gradings This Month', used: usage.gradingsThisMonth, limit: limits.gradingsPerMonth },
                    { label: 'Flashcard Decks', used: usage.flashcardDecksCreated, limit: limits.flashcardDecks },
                  ].map(m => (
                    <div key={m.label} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-500">{m.label}</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{m.limit === -1 ? <span className="text-primary-500">∞</span> : `${m.used}/${m.limit}`}</span>
                      </div>
                      {m.limit !== -1 && <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"><div className={cn('h-full rounded-full transition-all', m.used / m.limit > 0.8 ? 'bg-red-500' : 'bg-gradient-to-r from-primary-500 to-accent-500')} style={{ width: `${Math.min((m.used / m.limit) * 100, 100)}%` }} /></div>}
                      {m.limit === -1 && <div className="text-xs text-primary-500 font-medium">Unlimited</div>}
                    </div>
                  ))}
                </div>
              </div>

              {!isPremium && (
                <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 text-white shadow-xl shadow-primary-500/20 overflow-hidden">
                  <div className="p-6 pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Crown className="w-5 h-5 text-white" /></div>
                      <div><h3 className="font-display text-lg font-bold leading-none">Bloom Premium</h3><p className="text-white/70 text-xs mt-0.5">€9.99/month</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {['Unlimited AI Tutor','Unlimited grading','Unlimited flashcards','Audio podcasts','Full analytics','Grade predictions','Priority AI','Referral rewards'].map((f,i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-white/90"><Check className="w-3.5 h-3.5 shrink-0" />{f}</div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 pb-6 pt-2 space-y-2.5">
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Discount code (optional)" className="w-full px-4 py-2.5 rounded-xl bg-white/15 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:bg-white/20 transition-colors" />
                    <button onClick={handleUpgrade} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-primary-700 font-bold text-sm hover:shadow-lg active:scale-[0.98] transition-all">
                      <Sparkles className="w-4 h-4" /> Upgrade to Premium
                    </button>
                    {upgradeError && <p className="text-red-200 text-xs text-center">{upgradeError}</p>}
                  </div>
                </div>
              )}

              <div className="p-6 rounded-2xl card">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Gift className="w-4 h-4 text-primary-500" /> Referral Rewards</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Share your link — get 1 month free for you and your friend.</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-700 dark:text-slate-300 truncate">{referralUrl || 'Loading…'}</div>
                  <button onClick={copyReferral} className={cn('flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all shrink-0', copied ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-400')}>
                    {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
                  </button>
                </div>
                {referralCode && <p className="text-xs text-slate-400 mt-2">Code: <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{referralCode}</span></p>}
              </div>

              {isPremium && (
                <div className="p-6 rounded-2xl card">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary-500" /> Billing History</h3>
                  {isLoadingInvoices ? (
                    <div className="flex items-center gap-2 py-4 text-slate-400 text-sm"><div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />Loading invoices…</div>
                  ) : billingHistory.length === 0 ? (
                    <p className="text-sm text-slate-400 py-2">No invoices yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {billingHistory.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <div><div className="text-sm font-medium text-slate-900 dark:text-white">{inv.description}</div><div className="text-xs text-slate-500">{inv.date}</div></div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-900 dark:text-white">{inv.amount}</span>
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', inv.status === 'paid' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400')}>{inv.status}</span>
                            {inv.pdf && <a href={inv.pdf} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 transition-colors"><Download className="w-4 h-4" /></a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={handlePortal} disabled={isLoadingPortal} className="mt-4 w-full py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Manage in Stripe
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
                { label: 'Study reminders', desc: 'Daily nudge to keep your streak going', state: notifications, toggle: () => setNotifications(v => !v) },
                { label: 'Weekly report', desc: 'Progress summary every Sunday', state: emailUpdates, toggle: () => setEmailUpdates(v => !v) },
                { label: 'Exam countdown alerts', desc: 'Reminders as exams approach', state: true, toggle: () => {} },
                { label: 'Achievement notifications', desc: 'Celebrate milestones', state: true, toggle: () => {} },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div><div className="font-medium text-slate-900 dark:text-white text-sm">{item.label}</div><div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div></div>
                  <button onClick={item.toggle} className={cn('w-12 h-6 rounded-full p-0.5 transition-all', item.state ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700')}>
                    <div className={cn('w-5 h-5 rounded-full bg-white shadow-sm transition-all', item.state ? 'translate-x-6' : 'translate-x-0')} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="p-6 rounded-2xl card space-y-5">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Lock className="w-4 h-4 text-primary-500" /> Privacy</h3>
              {[
                { label: 'Data sharing', desc: 'Allow anonymized usage data to improve Bloom', state: false },
                { label: 'Profile visibility', desc: 'Show profile in leaderboards', state: true },
                { label: 'Study history', desc: 'Keep detailed history', state: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div><div className="font-medium text-slate-900 dark:text-white text-sm">{item.label}</div><div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div></div>
                  <button className={cn('w-12 h-6 rounded-full p-0.5 transition-all', item.state ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700')}>
                    <div className={cn('w-5 h-5 rounded-full bg-white shadow-sm transition-all', item.state ? 'translate-x-6' : 'translate-x-0')} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* STUDY PREFERENCES */}
          {activeTab === 'study' && (
            <div className="p-6 rounded-2xl card space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary-500" /> Study Preferences</h3>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Default Session Duration</label>
                <select className="input"><option>25 minutes (Pomodoro)</option><option>30 minutes</option><option>45 minutes</option><option>60 minutes</option></select></div>
              <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Break Duration</label>
                <select className="input"><option>5 minutes</option><option>10 minutes</option><option>15 minutes</option></select></div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="p-6 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2"><Globe className="w-4 h-4 text-primary-500" /> Appearance</h3>
              <div className="flex items-center justify-between">
                <div><div className="font-medium text-slate-900 dark:text-white">Dark Mode</div><div className="text-sm text-slate-500">Currently: {theme === 'dark' ? 'Dark' : 'Light'}</div></div>
                <button onClick={toggleTheme} className={cn('w-14 h-8 rounded-full p-1 transition-all', theme === 'dark' ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700')}>
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
                <button onClick={() => { localStorage.clear(); window.location.reload() }} className="px-4 py-2.5 rounded-xl border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">Clear All Local Data</button>
                <button className="px-4 py-2.5 rounded-xl border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">Delete Account</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

