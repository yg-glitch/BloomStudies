'use client'

import { useState } from 'react'
import { Wand2, Mail, ArrowRight } from 'lucide-react'
import { sendMagicLink } from '@/lib/auth'
import AuthAlert from './AuthAlert'

export default function MagicLinkForm({ onCancel }: { onCancel: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('Please enter your email.')
      return
    }
    setLoading(true)
    const res = await sendMagicLink(email)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setSent(true)
  }

  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4 animate-fade-in-down">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary-500" /> Magic link sign in
        </span>
        <button type="button" onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          Cancel
        </button>
      </div>

      <AuthAlert type="error" message={error} />

      {sent ? (
        <AuthAlert type="success" message={`Check ${email} for a sign-in link. It expires shortly.`} />
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-60"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send magic link <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      )}
    </div>
  )
}
