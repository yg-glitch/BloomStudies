'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, ArrowLeft, MailCheck } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthAlert from '@/components/auth/AuthAlert'
import { sendPasswordReset } from '@/lib/auth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email.'); return }
    setError('')
    setLoading(true)
    const res = await sendPasswordReset(email)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSent(true)
  }

  return (
    <AuthLayout
      title={sent ? 'Check your inbox' : 'Reset your password'}
      subtitle={sent ? undefined : "Enter your email and we'll send you a reset link"}
      footer={
        <Link href="/auth/signin" className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-primary-500 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-5">
            <MailCheck className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-2">
            If an account exists for <span className="font-semibold text-slate-900 dark:text-white">{email}</span>, a password reset link is on its way.
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Check your spam folder if you don&apos;t see it within a few minutes.</p>
        </div>
      ) : (
        <>
          <AuthAlert type="error" message={error} />
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" autoFocus required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm focus:border-primary-500 focus:outline-none transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-base hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60">
              {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</> : <>Send reset link <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
