'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, MailCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthAlert from '@/components/auth/AuthAlert'
import SocialButtons from '@/components/auth/SocialButtons'
import { signUpWithEmail } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/config'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ]
  const strength = checks.filter(c => c.pass).length
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-emerald-500']
  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i < strength ? colors[strength - 1] : 'bg-slate-300 dark:bg-slate-700')} />
        ))}
      </div>
      <div className="flex gap-3">
        {checks.map(c => (
          <div key={c.label} className={cn('flex items-center gap-1 text-[11px] transition-colors', c.pass ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-500')}>
            <Check className="w-3 h-3" />{c.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifySent, setVerifySent] = useState(false)
  const authEnabled = isSupabaseConfigured()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) { setError('Please fill in all fields.'); return }
    if (!agreed) { setError('Please accept the Terms of Service to continue.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setIsLoading(true)
    const result = await signUpWithEmail(email, password, name)
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }
    if (result.pendingConfirmation) {
      setVerifySent(true)
      setIsLoading(false)
      return
    }
    window.location.href = '/dashboard'
  }

  if (verifySent) {
    return (
      <AuthLayout title="Check your inbox" subtitle="One last step to start learning">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-5">
            <MailCheck className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-2">
            We sent a verification link to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>.
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Click the link in the email to activate your account, then sign in.
          </p>
          <Link href="/auth/signin" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-semibold text-sm hover:brightness-110 transition-all">
            Back to sign in <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free forever — upgrade anytime"
      footer={
        <p className="text-center text-slate-500 text-sm">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-primary-500 font-semibold hover:text-primary-400 transition-colors">
            Sign in
          </Link>
        </p>
      }
    >
      <AuthAlert type="error" message={error} />

      {!authEnabled && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
          Demo mode: authentication isn&apos;t configured yet. Add Supabase credentials to enable real sign up.
        </div>
      )}

      <SocialButtons onError={setError} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
        <div className="relative flex justify-center"><span className="px-4 bg-white dark:bg-slate-950 text-slate-500 text-xs">or with email</span></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" required
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm focus:border-primary-500 focus:outline-none transition-colors" />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm focus:border-primary-500 focus:outline-none transition-colors" />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
            <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" required
              className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm focus:border-primary-500 focus:outline-none transition-colors" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>
        <label className="flex items-start gap-3 cursor-pointer group mt-1">
          <div className="relative mt-0.5">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" />
            <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center transition-all', agreed ? 'bg-primary-500 border-primary-500' : 'border-slate-400 dark:border-slate-600 group-hover:border-slate-500 dark:group-hover:border-slate-400')}>
              {agreed && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            I agree to the{' '}
            <Link href="/terms" className="text-primary-500 hover:text-primary-400">Terms of Service</Link>{' '}and{' '}
            <Link href="/privacy" className="text-primary-500 hover:text-primary-400">Privacy Policy</Link>
          </span>
        </label>
        <button type="submit" disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-base hover:brightness-110 hover:shadow-xl hover:shadow-primary-500/25 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2">
          {isLoading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</> : <>Create Free Account <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </AuthLayout>
  )
}
