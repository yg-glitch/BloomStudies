'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setError('')
    setIsLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message === 'Invalid login credentials'
        ? 'Incorrect email or password. Please try again.'
        : signInError.message
      )
      setIsLoading(false)
      return
    }

    window.location.href = '/dashboard'
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
    if (error) {
      setError(error.message)
      setOauthLoading(null)
    }
  }

  const handleMagicLink = async () => {
    if (!email) { setError('Enter your email above to receive a magic link.'); return }
    setError('')
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setIsLoading(false)
    if (error) { setError(error.message); return }
    setError('')
    alert(`Magic link sent to ${email}! Check your inbox.`)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <Link href="/" className="relative flex items-center gap-3">
          <Image src="/logo.png" alt="Bloom Studies" width={40} height={40} className="rounded-xl" />
          <span className="font-display font-bold text-white text-xl">Bloom Studies</span>
        </Link>
        <div className="relative space-y-6">
          <h2 className="font-display text-4xl font-black text-white leading-tight">Ireland&apos;s smartest<br />study platform.</h2>
          <p className="text-white/80 text-lg leading-relaxed">AI-powered tools built for Junior Cycle and Leaving Certificate students. Study smarter, score higher.</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ value: '15k+', label: 'Students' }, { value: '95%', label: 'Improve grades' }, { value: '38', label: 'Subjects' }, { value: '24/7', label: 'AI support' }].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="font-display font-black text-white text-2xl">{s.value}</div>
                <div className="text-white/70 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg shrink-0">👩‍🎓</div>
            <div>
              <p className="text-white text-sm leading-relaxed italic">&quot;Got H1 in my English mock after 2 weeks of using Bloom. The AI tutor is incredible.&quot;</p>
              <p className="text-white/60 text-xs mt-2">Aoife Murphy · Leaving Cert 2025</p>
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
            <h1 className="font-display text-3xl font-black text-slate-900 dark:text-white mb-2">Welcome back</h1>
            <p className="text-slate-500 dark:text-slate-400">Sign in to continue your learning journey</p>
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-sm mb-5 animate-fade-in-down">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* OAuth providers */}
          <div className="space-y-2.5 mb-6">
            {[
              { id: 'google', label: 'Continue with Google', icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              ), action: () => handleOAuth('google') },
              { id: 'azure', label: 'Continue with Microsoft', icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#7fba00" d="M13 1h10v10H13z"/>
                  <path fill="#00a4ef" d="M1 13h10v10H1z"/><path fill="#ffb900" d="M13 13h10v10H13z"/>
                </svg>
              ), action: () => handleOAuth('azure') },
            ].map(p => (
              <button key={p.id} onClick={p.action} disabled={oauthLoading !== null}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-primary-300 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {oauthLoading === p.id ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : p.icon}
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
            <div className="relative flex justify-center"><span className="px-4 bg-white dark:bg-slate-950 text-slate-500 text-xs">or sign in with email</span></div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" autoFocus required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-sm focus:border-primary-500 focus:outline-none transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required
                  className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-sm focus:border-primary-500 focus:outline-none transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-base hover:brightness-110 hover:shadow-xl hover:shadow-primary-500/25 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {isLoading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          {/* Magic link */}
          <div className="mt-4">
            <button onClick={handleMagicLink} disabled={isLoading}
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all disabled:opacity-50">
              ✨ Send Magic Link (no password needed)
            </button>
          </div>

          <p className="text-center text-slate-500 dark:text-slate-500 text-sm mt-8">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-500 transition-colors">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

