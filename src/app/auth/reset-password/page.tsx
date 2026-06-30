'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthAlert from '@/components/auth/AuthAlert'
import { updatePassword } from '@/lib/auth'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  // Supabase sets a recovery session when the user arrives via the email link.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setReady(true)
      return
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError('')
    setLoading(true)
    const res = await updatePassword(password)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setDone(true)
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="You can now sign in with your new password">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-primary-500 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <Link href="/auth/signin" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-semibold text-sm hover:brightness-110 transition-all">
            Continue to sign in <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password you haven't used before">
      <AuthAlert type="error" message={error} />

      {!ready && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
          Open this page from the reset link in your email to continue.
        </div>
      )}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">New password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
            <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" required
              className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm focus:border-primary-500 focus:outline-none transition-colors" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
            <input id="confirm" type={showPassword ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" required
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm focus:border-primary-500 focus:outline-none transition-colors" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-base hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 mt-2">
          {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating…</> : <>Update password <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </AuthLayout>
  )
}
