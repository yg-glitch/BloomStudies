'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Settings, User, Bell, Globe, Trash2, Download,
  CreditCard, Sparkles, Check, Copy, Gift, Crown,
  Moon, Sun, ExternalLink, Shield, Zap, Lock, LogOut,
  Link2, LifeBuoy, KeyRound, MailCheck, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/components/SubscriptionProvider'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { useToast } from '@/components/ui/Toast'
import { updateProfile, sendPasswordReset, signInWithProvider } from '@/lib/auth'

type Tab =
  | 'profile' | 'account' | 'subscription' | 'notifications' | 'appearance'
  | 'language' | 'connected' | 'privacy' | 'security' | 'help' | 'danger'

const MOCK_BILLING_HISTORY = [
  { id: 'inv_001', date: 'Jun 1, 2025', amount: '€9.99', status: 'paid', description: 'Bloom Premium — Monthly' },
  { id: 'inv_002', date: 'May 1, 2025', amount: '€9.99', status: 'paid', description: 'Bloom Premium — Monthly' },
  { id: 'inv_003', date: 'Apr 1, 2025', amount: '€9.99', status: 'paid', description: 'Bloom Premium — Monthly' },
]

const LANGUAGES = ['English', 'Gaeilge (Irish)', 'Français', 'Español', 'Deutsch', 'Polski']

const NAV_ITEMS: { id: Tab; icon: typeof User; label: string }[] = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'account', icon: KeyRound, label: 'Account' },
  { id: 'subscription', icon: CreditCard, label: 'Subscription' },
  { id: 'connected', icon: Link2, label: 'Connected Accounts' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'appearance', icon: Moon, label: 'Appearance' },
  { id: 'language', icon: Globe, label: 'Language' },
  { id: 'security', icon: Shield, label: 'Security' },
  { id: 'privacy', icon: Lock, label: 'Privacy' },
  { id: 'help', icon: LifeBuoy, label: 'Help & Support' },
  { id: 'danger', icon: Trash2, label: 'Danger Zone' },
]

function SettingsContent() {
  const searchParams = useSearchParams()
  const { limits, usage, isPremium, upgradeToPremium, openBillingPortal, referralCode, referralUrl } = useSubscription()
  const { theme, toggleTheme } = useTheme()
  const { user, displayName, authEnabled, signOut } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')

  // Profile fields
  const [fullName, setFullName] = useState('')
  const [school, setSchool] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Preferences persisted locally
  const [language, setLanguage] = useState('English')
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true)
  const [personalisation, setPersonalisation] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setFullName((user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || '')
    setSchool((user?.user_metadata?.school as string) || '')
  }, [user])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'billing' || tab === 'subscription') setActiveTab('subscription')
    if (searchParams.get('success') === 'true') setActiveTab('subscription')
    try {
      const stored = localStorage.getItem('bloom-language')
      if (stored) setLanguage(stored)
    } catch { /* ignore */ }
  }, [searchParams])

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

  const saveProfile = async () => {
    if (!authEnabled) {
      toastSuccess('Profile saved', 'Your changes have been saved locally')
      return
    }
    setSavingProfile(true)
    const res = await updateProfile({ full_name: fullName, school })
    setSavingProfile(false)
    if (res.error) toastError('Could not save', res.error)
    else toastSuccess('Profile saved', 'Your changes have been saved')
  }

  const saveLanguage = (lang: string) => {
    setLanguage(lang)
    try { localStorage.setItem('bloom-language', lang) } catch { /* ignore */ }
    toastSuccess('Language updated', lang)
  }

  const handleChangePassword = async () => {
    if (!user?.email) { toastError('No email', 'Add an email to your account first.'); return }
    const res = await sendPasswordReset(user.email)
    if (res.error) toastError('Could not send', res.error)
    else toastSuccess('Check your inbox', `We sent a password reset link to ${user.email}`)
  }

  const handleConnect = async (provider: 'google' | 'apple' | 'microsoft') => {
    const res = await signInWithProvider(provider)
    if (res.error) toastError('Could not connect', res.error)
  }

  const exportData = () => {
    try {
      const data: Record<string, unknown> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('bloom-')) {
          try { data[key] = JSON.parse(localStorage.getItem(key) || 'null') }
          catch { data[key] = localStorage.getItem(key) }
        }
      }
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), user: user?.email, data }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bloom-studies-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toastSuccess('Data exported', 'Your data has been downloaded')
    } catch {
      toastError('Export failed', 'Could not export your data')
    }
  }

  const clearLocalData = () => {
    if (!confirm('Clear all locally stored Bloom data on this device? This cannot be undone.')) return
    try {
      Object.keys(localStorage).filter(k => k.startsWith('bloom-')).forEach(k => localStorage.removeItem(k))
      toastSuccess('Local data cleared', 'Reloading…')
      setTimeout(() => window.location.reload(), 800)
    } catch {
      toastError('Failed', 'Could not clear local data')
    }
  }

  const deleteAccount = async () => {
    if (!authEnabled) { toastError('Not available', 'Account deletion requires authentication to be configured.'); return }
    if (!confirm('Permanently delete your account and all associated data? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete account')
      await signOut()
      window.location.href = '/'
    } catch (e: any) {
      setDeleting(false)
      toastError('Could not delete account', e.message)
    }
  }

  const providers = (user?.identities || []).map(i => i.provider)
  const emailVerified = !!user?.email_confirmed_at

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
        <div className="space-y-1 lg:sticky lg:top-6 self-start">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={cn('w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left text-sm',
                activeTab === item.id ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              <item.icon className="w-4.5 h-4.5 shrink-0" style={{ width: 18, height: 18 }} />
              {item.label}
              {item.id === 'subscription' && !isPremium && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold">FREE</span>
              )}
              {item.id === 'subscription' && isPremium && (
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
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white text-2xl font-bold flex items-center justify-center">
                  {(displayName || 'B').trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{displayName || 'Bloom Student'}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email || 'Not signed in'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Full Name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} type="text" placeholder="Your Name" className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input value={user?.email || ''} type="email" placeholder="you@example.com" disabled className="input opacity-70 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">School</label>
                  <input value={school} onChange={e => setSchool(e.target.value)} type="text" placeholder="Your School" className="input" />
                </div>
                <button onClick={saveProfile} disabled={savingProfile} className="btn-primary">
                  {savingProfile ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ACCOUNT */}
          {activeTab === 'account' && (
            <div className="p-6 rounded-2xl card space-y-5">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary-500" /> Account</h3>
              {authEnabled && user ? (
                <>
                  <Row label="Email" value={user.email || '—'} badge={emailVerified ? 'Verified' : 'Unverified'} badgeOk={emailVerified} />
                  {user.phone && <Row label="Phone" value={user.phone} />}
                  <Row label="Signed in with" value={providers.length ? providers.join(', ') : 'email'} />
                  <Row label="User ID" value={user.id} mono />
                  <button onClick={() => signOut().then(() => (window.location.href = '/auth/signin'))}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </>
              ) : (
                <NotConfigured action="manage your account" />
              )}
            </div>
          )}

          {/* SUBSCRIPTION */}
          {activeTab === 'subscription' && (
            <div className="space-y-5">
              <div className={cn('p-6 rounded-2xl border-2', isPremium ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-950/30 dark:to-accent-950/30' : 'border-slate-200 dark:border-slate-700 glass')}>
                <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isPremium ? <Crown className="w-5 h-5 text-amber-500" /> : <Zap className="w-5 h-5 text-slate-400" />}
                      <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{isPremium ? 'Bloom Premium' : 'Free Plan'}</h3>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold', isPremium ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400')}>
                        {isPremium ? 'ACTIVE' : 'FREE'}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{isPremium ? '€9.99/month · Renews automatically' : 'Upgrade to unlock everything'}</p>
                  </div>
                  {isPremium && (
                    <button onClick={handlePortal} disabled={isLoadingPortal}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors disabled:opacity-50">
                      {isLoadingPortal ? <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                      Manage
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
                        <span className="text-xs text-slate-500 dark:text-slate-400">{m.label}</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{m.limit === -1 ? <span className="text-primary-500">∞</span> : `${m.used}/${m.limit}`}</span>
                      </div>
                      {m.limit !== -1 ? (
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', m.used / m.limit > 0.8 ? 'bg-red-500' : 'bg-gradient-to-r from-primary-500 to-accent-500')} style={{ width: `${Math.min((m.used / m.limit) * 100, 100)}%` }} />
                        </div>
                      ) : <div className="text-xs text-primary-500 font-medium">Unlimited</div>}
                    </div>
                  ))}
                </div>
              </div>

              {!isPremium && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 text-white shadow-xl shadow-primary-500/20">
                  <div className="flex items-start gap-4 flex-col sm:flex-row">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 w-full">
                      <h3 className="font-display text-xl font-bold mb-1">Upgrade to Premium</h3>
                      <p className="text-white/80 text-sm mb-4">€9.99/month — Less than one grinds session</p>
                      <div className="grid sm:grid-cols-2 gap-2 mb-5">
                        {['Unlimited AI messages', 'Unlimited exam grading', 'Unlimited flashcards', 'Audio podcasts', 'Full analytics', 'Exam predictions', 'Priority AI', 'Referral rewards'].map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-white/90"><Check className="w-3.5 h-3.5 text-white shrink-0" />{f}</div>
                        ))}
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 flex-1 min-w-[180px]">
                          <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Discount code…" className="bg-transparent text-white placeholder-white/50 text-sm focus:outline-none flex-1 min-w-0" />
                          {couponCode && <span className="text-xs text-white/60">→</span>}
                        </div>
                        <button onClick={handleUpgrade} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-primary-700 font-bold text-sm hover:shadow-lg transition-all">
                          <Sparkles className="w-4 h-4" /> Upgrade Now
                        </button>
                      </div>
                      {upgradeError && <p className="mt-2 text-red-200 text-xs">{upgradeError}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 rounded-2xl card">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Gift className="w-4 h-4 text-primary-500" /> Referral Rewards</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Share your link and get 1 month free for you and your friend when they upgrade.</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-700 dark:text-slate-300 truncate">{referralUrl || 'Loading…'}</div>
                  <button onClick={copyReferral} className={cn('flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all shrink-0', copied ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-400')}>
                    {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
                  </button>
                </div>
              </div>

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
                          <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-medium">{inv.status}</span>
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 transition-colors"><Download className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONNECTED ACCOUNTS */}
          {activeTab === 'connected' && (
            <div className="p-6 rounded-2xl card space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2"><Link2 className="w-4 h-4 text-primary-500" /> Connected Accounts</h3>
              {!authEnabled ? (
                <NotConfigured action="connect accounts" />
              ) : (
                ([
                  { id: 'google', label: 'Google' },
                  { id: 'apple', label: 'Apple' },
                  { id: 'microsoft', label: 'Microsoft' },
                ] as const).map(p => {
                  const connected = providers.includes(p.id === 'microsoft' ? 'azure' : p.id)
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-200">{p.label.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{p.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{connected ? 'Connected' : 'Not connected'}</p>
                        </div>
                      </div>
                      {connected ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400"><Check className="w-4 h-4" /> Linked</span>
                      ) : (
                        <button onClick={() => handleConnect(p.id)} className="px-4 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-primary-400 transition-colors">Connect</button>
                      )}
                    </div>
                  )
                })
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
                <Toggle key={item.label} label={item.label} desc={item.desc} on={item.state} onClick={item.toggle} />
              ))}
            </div>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="p-6 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2"><Moon className="w-4 h-4 text-primary-500" /> Appearance</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Dark Mode</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Currently: {theme === 'dark' ? 'Dark' : 'Light'}</div>
                </div>
                <button onClick={toggleTheme} className={cn('w-14 h-8 rounded-full p-1 transition-all', theme === 'dark' ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700')}>
                  <div className={cn('w-6 h-6 rounded-full bg-white transition-all flex items-center justify-center shadow-sm', theme === 'dark' ? 'translate-x-6' : 'translate-x-0')}>
                    {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-primary-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* LANGUAGE */}
          {activeTab === 'language' && (
            <div className="p-6 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2"><Globe className="w-4 h-4 text-primary-500" /> Language</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {LANGUAGES.map(lang => (
                  <button key={lang} onClick={() => saveLanguage(lang)}
                    className={cn('flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left',
                      language === lang ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300')}>
                    {lang}{language === lang && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <div className="p-6 rounded-2xl card space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Shield className="w-4 h-4 text-primary-500" /> Security</h3>
              {authEnabled && user ? (
                <>
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <MailCheck className={cn('w-5 h-5', emailVerified ? 'text-green-500' : 'text-amber-500')} />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Email verification</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{emailVerified ? 'Your email is verified' : 'Your email is not verified yet'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <KeyRound className="w-5 h-5 text-primary-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Password</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Send a secure reset link to your email</p>
                      </div>
                    </div>
                    <button onClick={handleChangePassword} className="px-4 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-primary-400 transition-colors">Change password</button>
                  </div>
                </>
              ) : (
                <NotConfigured action="manage security" />
              )}
            </div>
          )}

          {/* PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="p-6 rounded-2xl card space-y-5">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Lock className="w-4 h-4 text-primary-500" /> Privacy</h3>
              <Toggle label="Usage analytics" desc="Help improve Bloom by sharing anonymous usage data" on={analyticsOptIn} onClick={() => setAnalyticsOptIn(!analyticsOptIn)} />
              <Toggle label="Personalised AI" desc="Let the AI use your progress and notes to personalise responses" on={personalisation} onClick={() => setPersonalisation(!personalisation)} />
              <div className="flex gap-2 pt-1 flex-wrap">
                <Link href="/privacy" className="text-sm text-primary-500 hover:text-primary-400 font-medium">Privacy Policy</Link>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <Link href="/terms" className="text-sm text-primary-500 hover:text-primary-400 font-medium">Terms of Service</Link>
              </div>
            </div>
          )}

          {/* HELP */}
          {activeTab === 'help' && (
            <div className="p-6 rounded-2xl card space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2"><LifeBuoy className="w-4 h-4 text-primary-500" /> Help & Support</h3>
              {[
                { label: 'Contact support', desc: 'Get help from our team', href: 'mailto:support@bloomstudies.ie' },
                { label: 'Help centre', desc: 'Guides and FAQs', href: '/parents' },
                { label: 'Report a problem', desc: 'Tell us what went wrong', href: 'mailto:support@bloomstudies.ie?subject=Problem%20report' },
              ].map(item => (
                <a key={item.label} href={item.href} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-400 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </div>
          )}

          {/* DANGER */}
          {activeTab === 'danger' && (
            <div className="p-6 rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 space-y-4">
              <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Danger Zone</h3>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Export your data</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Download everything stored on this device as JSON</p>
                </div>
                <button onClick={exportData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors">
                  <Download className="w-4 h-4" /> Export Data
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Clear local data</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Remove all Bloom data stored in this browser</p>
                </div>
                <button onClick={clearLocalData} className="px-4 py-2.5 rounded-xl border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  Clear All Local Data
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Delete account</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Permanently remove your account and all data</p>
                </div>
                <button onClick={deleteAccount} disabled={deleting} className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
                  {deleting ? 'Deleting…' : 'Delete Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, badge, badgeOk, mono }: { label: string; value: string; badge?: string; badgeOk?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
      <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className={cn('text-sm text-slate-900 dark:text-white text-right truncate', mono && 'font-mono text-xs')}>
        {value}
        {badge && (
          <span className={cn('ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold', badgeOk ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400')}>{badge}</span>
        )}
      </span>
    </div>
  )
}

function Toggle({ label, desc, on, onClick }: { label: string; desc: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium text-slate-900 dark:text-white text-sm">{label}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{desc}</div>
      </div>
      <button onClick={onClick} className={cn('w-12 h-6 rounded-full p-0.5 transition-all shrink-0', on ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700')}>
        <div className={cn('w-5 h-5 rounded-full bg-white transition-all shadow-sm', on ? 'translate-x-6' : 'translate-x-0')} />
      </button>
    </div>
  )
}

function NotConfigured({ action }: { action: string }) {
  return (
    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm">
      Sign in with a configured account to {action}. Authentication isn&apos;t set up in this environment yet.
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="page-container py-6" />}>
      <SettingsContent />
    </Suspense>
  )
}
