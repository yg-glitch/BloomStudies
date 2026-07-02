'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

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
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i < strength ? colors[strength - 1] : 'bg-slate-200 dark:bg-slate-700')} />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map(c => (
          <div key={c.label} className={cn('flex items-center gap-1 text-[11px] transition-colors', c.pass ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500')}>
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
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) { setError('Please fill in all fields.'); return }
    if (!agreed) { setError('Please accept the Terms of Service to continue.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setIsLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
  }

  const handleOAuth = async (provider: 'google' | 'azure') => {
    setOauthLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: provider === 'azure' ? 'email profile openid' : undefined,
      },
    })
    if (error) { setError(error.message); setOauthLoading(null) }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="font-display text-3xl font-black text-slate-900 dark:text-white mb-3">Check your email</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            We've sent a confirmation link to <strong className="text-slate-900 dark:text-white">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/auth/signin" className="btn-primary inline-flex">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      {/* Left branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <Link href="/" className="relative flex items-center gap-3">
          <Image src="/logo.png" alt="Bloom Studies" width={40} height={40} className="rounded-xl" />
          <span className="font-display font-bold text-white text-xl">Bloom Studies</span>
        </Link>
        <div className="relative space-y-5">
          <h2 className="font-display text-4xl font-black text-white leading-tight">Start your journey<br />to better grades.</h2>
          <p className="text-white/80 text-lg">Join 15,000+ Irish students already achieving their potential.</p>
          <ul className="space-y-3">
            {['Free plan — no credit card needed', 'Built for Junior Cycle & Leaving Cert', 'AI tutor available 24/7', 'SEC-aligned exam grading'].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-white/90 text-sm">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white" /></div>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg shrink-0">🧑‍💻</div>
            <div>
              <p className="text-white text-sm leading-relaxed italic">"The exam grader told me exactly what the examiner wanted. My English went from H3 to H1 in a month."</p>
              <p className="text-white/60 text-xs mt-2">Ciarán O'Brien · Leaving Cert</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <Image src="/logo.png" alt="Bloom Studies" width={36} height={36} className="rounded-xl" />
            <span className="font-display font-bold text-slate-900 dark:text-white text-xl">Bloom Studies</span>
          </div>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-black text-slate-900 dark:text-white mb-2">Create your account</h1>
            <p className="text-slate-500 dark:text-slate-400">Free forever — upgrade anytime</p>
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-sm mb-5 animate-fade-in-down">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* OAuth */}
          <div className="space-y-2.5 mb-6">
            {[
              { id: 'google', label: 'Continue with Google', icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>, action: () => handleOAuth('google') },
              { id: 'azure', label: 'Continue with Microsoft', icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#7fba00" d="M13 1h10v10H13z"/><path fill="#00a4ef" d="M1 13h10v10H1z"/><path fill="#ffb900" d="M13 13h10v10H13z"/></svg>, action: () => handleOAuth('azure') },
            ].map(p => (
              <button key={p.id} onClick={p.action} disabled={oauthLoading !== null}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all disabled:opacity-60">
                {oauthLoading === p.id ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : p.icon}
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
            <div className="relative flex justify-center"><span className="px-4 bg-white dark:bg-slate-950 text-slate-500 text-xs">or sign up with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" autoFocus required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-sm focus:border-primary-500 focus:outline-none transition-colors" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-sm focus:border-primary-500 focus:outline-none transition-colors" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" required
                  className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-sm focus:border-primary-500 focus:outline-none transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide' : 'Show'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <label className="flex items-start gap-3 cursor-pointer group mt-1">
              <div className="relative mt-0.5 shrink-0">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" />
                <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center transition-all', agreed ? 'bg-primary-500 border-primary-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400')}>
                  {agreed && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                I agree to the{' '}<Link href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">Terms</Link>{' '}and{' '}<Link href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</Link>
              </span>
            </label>
            <button type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-base hover:brightness-110 hover:shadow-xl hover:shadow-primary-500/25 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {isLoading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</> : <>Create Free Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-slate-500 dark:text-slate-500 text-sm mt-8">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-500 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
