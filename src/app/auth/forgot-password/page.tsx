'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function ForgotPassword() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email address.'); return }
    setError('')
    setIsLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="font-display text-3xl font-black text-slate-900 dark:text-white mb-3">Check your email</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              We&apos;ve sent a password reset link to <strong>{email}</strong>. The link will expire in 24 hours.
            </p>
            <div className="space-y-3">
              <Link href="/auth/signin" className="btn-primary w-full flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
              <button onClick={() => setSuccess(false)} className="w-full py-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-sm">
                Try a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-8">
          <Link href="/auth/signin" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
          <h1 className="font-display text-3xl font-black text-slate-900 dark:text-white mb-2">Reset your password</h1>
          <p className="text-slate-500 dark:text-slate-400">Enter your email and we&apos;ll send you a reset link</p>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-5 animate-fade-in-down">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                required
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-base hover:brightness-110 hover:shadow-xl hover:shadow-primary-500/25 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending reset link…
              </>
            ) : (
              <>Send Reset Link <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/auth/signin" className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Remember your password? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
