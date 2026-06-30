'use client'

import { useState } from 'react'
import { signInWithProvider } from '@/lib/auth'

type ProviderId = 'google' | 'apple' | 'microsoft'

const GoogleIcon = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const AppleIcon = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.05 12.04c-.03-2.5 2.04-3.7 2.13-3.76-1.16-1.7-2.97-1.93-3.62-1.96-1.54-.16-3 .9-3.78.9-.78 0-1.98-.88-3.25-.86-1.67.03-3.22.97-4.08 2.47-1.74 3.02-.45 7.49 1.25 9.94.83 1.2 1.82 2.55 3.12 2.5 1.25-.05 1.72-.81 3.23-.81 1.51 0 1.93.81 3.25.78 1.34-.02 2.19-1.22 3.01-2.43.95-1.39 1.34-2.74 1.36-2.81-.03-.01-2.61-1-2.64-3.97zM14.6 4.7c.69-.83 1.15-1.99 1.02-3.15-.99.04-2.19.66-2.9 1.49-.64.73-1.2 1.91-1.05 3.03 1.1.09 2.24-.56 2.93-1.37z" />
  </svg>
)

const MicrosoftIcon = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
    <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
    <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
    <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
  </svg>
)

const PROVIDERS: { id: ProviderId; label: string; icon: JSX.Element }[] = [
  { id: 'google', label: 'Continue with Google', icon: GoogleIcon },
  { id: 'apple', label: 'Continue with Apple', icon: AppleIcon },
  { id: 'microsoft', label: 'Continue with Microsoft', icon: MicrosoftIcon },
]

interface SocialButtonsProps {
  redirectedFrom?: string
  onError?: (message: string) => void
}

export default function SocialButtons({ redirectedFrom, onError }: SocialButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<ProviderId | null>(null)

  const handleClick = async (id: ProviderId) => {
    setLoadingProvider(id)
    const result = await signInWithProvider(id, redirectedFrom)
    if (result.error) {
      onError?.(result.error)
      setLoadingProvider(null)
    }
    // On success the browser is redirected to the provider, so no reset needed.
  }

  return (
    <div className="space-y-2.5">
      {PROVIDERS.map(p => (
        <button
          key={p.id}
          type="button"
          onClick={() => handleClick(p.id)}
          disabled={loadingProvider !== null}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loadingProvider === p.id ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
          ) : (
            p.icon
          )}
          {p.label}
        </button>
      ))}
    </div>
  )
}
