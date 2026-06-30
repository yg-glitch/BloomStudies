'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  /** Optional footer rendered under the form (e.g. sign-up prompt). */
  footer?: ReactNode
}

const STATS = [
  { value: '15k+', label: 'Students' },
  { value: '95%', label: 'Improve grades' },
  { value: '38', label: 'Subjects' },
  { value: '24/7', label: 'AI support' },
]

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 70%, white 1px, transparent 1px), radial-gradient(circle at 70% 30%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Bloom Studies" width={40} height={40} className="rounded-xl" />
            <span className="font-display font-bold text-white text-xl">Bloom Studies</span>
          </Link>
        </div>
        <div className="relative space-y-6">
          <h2 className="font-display text-4xl font-black text-white leading-tight">
            Ireland&apos;s smartest<br />study platform.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            AI-powered tools built for Junior Cycle and Leaving Certificate students. Study smarter, score higher.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="font-display font-black text-white text-2xl">{s.value}</div>
                <div className="text-white/70 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg shrink-0">👩‍🎓</div>
              <div>
                <p className="text-white text-sm leading-relaxed italic">
                  &quot;Got H1 in my English mock after 2 weeks of using Bloom. The AI tutor is incredible.&quot;
                </p>
                <p className="text-white/60 text-xs mt-2">Aoife Murphy · Leaving Cert 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — content */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in-up py-6">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <Image src="/logo.png" alt="Bloom Studies" width={36} height={36} className="rounded-xl" />
            <span className="font-display font-bold text-slate-900 dark:text-white text-xl">Bloom Studies</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-black text-slate-900 dark:text-white mb-2">{title}</h1>
            {subtitle && <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>

          {children}

          {footer && <div className="mt-8">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
