'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, Lock, ArrowRight, Eye, EyeOff, Phone, Wand2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthAlert from '@/components/auth/AuthAlert'
import SocialButtons from '@/components/auth/SocialButtons'
import PhoneAuth from '@/components/auth/PhoneAuth'
import MagicLinkForm from '@/components/auth/MagicLinkForm'
import { signInWithEmail } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/config'

function SignInForm() {
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get('redirectedFrom') || undefined
  const urlError = searchParams.get('error') || ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'none' | 'phone' | 'magic'>('none')
  const authEnabled = isSupabaseConfigured()

  useEffect(() => {
    if (urlError) setError(urlError)
  }, [urlError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setIsLoading(true)
    const result = await signInWithEmail(email, password)
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }
    window.location.href = redirectedFrom && redirectedFrom.startsWith('/dashboard') ? redirectedFrom : '/dashboard'
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your learning journey"
      footer={
        <p className="text-center text-slate-500 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-primary-500 font-semibold hover:text-primary-400 transition-colors">
            Create one free
          </Link>
        </p>
      }
    >
      <AuthAlert type="error" message={error} />

      {!authEnabled && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
          Demo mode: authentication isn&apos;t configured yet. Add Supabase credentials to enable real sign in.
        </div>
      )}

      {/* Social providers */}
      <SocialButtons redirectedFrom={redirectedFrom} onError={setError} />

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-white dark:bg-slate-950 text-slate-500 text-xs">or with email</span>
        </div>
      </div>

      {/* Email + password */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-xs text-primary-500 hover:text-primary-400 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm focus:border-primary-500 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-base hover:brightness-110 hover:shadow-xl hover:shadow-primary-500/25 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </>
          ) : (
            <>Login <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      {/* Alternative methods */}
      <div className="mt-5 space-y-3">
        {mode === 'phone' && <PhoneAuth onCancel={() => setMode('none')} />}
        {mode === 'magic' && <MagicLinkForm onCancel={() => setMode('none')} />}

        {mode === 'none' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('phone')}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <Phone className="w-4 h-4" /> Phone
            </button>
            <button
              type="button"
              onClick={() => setMode('magic')}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <Wand2 className="w-4 h-4" /> Magic link
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-950" />}>
      <SignInForm />
    </Suspense>
  )
}
