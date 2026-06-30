'use client'

import { useEffect, useState } from 'react'
import { Phone, ArrowRight, ArrowLeft } from 'lucide-react'
import { sendPhoneOtp, verifyPhoneOtp } from '@/lib/auth'
import AuthAlert from './AuthAlert'

const COUNTRY_CODES = [
  { code: '+353', label: 'IE' },
  { code: '+44', label: 'UK' },
  { code: '+1', label: 'US' },
  { code: '+61', label: 'AU' },
  { code: '+91', label: 'IN' },
  { code: '+49', label: 'DE' },
  { code: '+33', label: 'FR' },
  { code: '+34', label: 'ES' },
  { code: '+39', label: 'IT' },
  { code: '+351', label: 'PT' },
  { code: '+31', label: 'NL' },
  { code: '+971', label: 'AE' },
]

const RESEND_SECONDS = 30

export default function PhoneAuth({ onCancel }: { onCancel: () => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [countryCode, setCountryCode] = useState('+353')
  const [number, setNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const fullPhone = `${countryCode}${number.replace(/[^0-9]/g, '').replace(/^0+/, '')}`

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const requestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    setInfo('')
    if (!number) {
      setError('Please enter your phone number.')
      return
    }
    setLoading(true)
    const res = await sendPhoneOtp(fullPhone)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setStep('otp')
    setInfo(`We sent a code to ${fullPhone}.`)
    setCooldown(RESEND_SECONDS)
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!otp) {
      setError('Enter the code you received.')
      return
    }
    setLoading(true)
    const res = await verifyPhoneOtp(fullPhone, otp.trim())
    if (res.error) {
      setLoading(false)
      setError(res.error)
      return
    }
    window.location.href = '/dashboard'
  }

  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4 animate-fade-in-down">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary-500" /> Sign in with phone
        </span>
        <button type="button" onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          Cancel
        </button>
      </div>

      <AuthAlert type="error" message={error} />
      {info && !error && <AuthAlert type="success" message={info} />}

      {step === 'phone' ? (
        <form onSubmit={requestOtp} className="space-y-3" noValidate>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              aria-label="Country code"
              className="px-2.5 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:outline-none"
            >
              {COUNTRY_CODES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.label} {c.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={number}
              onChange={e => setNumber(e.target.value)}
              placeholder="87 123 4567"
              autoComplete="tel-national"
              className="flex-1 min-w-0 px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-60"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send code <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3" noValidate>
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            placeholder="Enter 6-digit code"
            autoComplete="one-time-code"
            autoFocus
            className="w-full px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm tracking-widest text-center focus:border-primary-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-60"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify & sign in <ArrowRight className="w-4 h-4" /></>}
          </button>
          <div className="flex items-center justify-between text-xs">
            <button type="button" onClick={() => { setStep('phone'); setOtp(''); setInfo('') }} className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <ArrowLeft className="w-3 h-3" /> Change number
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || loading}
              onClick={() => requestOtp()}
              className="text-primary-500 hover:text-primary-400 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
