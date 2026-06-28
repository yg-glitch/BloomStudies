'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Brain, FileCheck, Layers, Calendar, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/lib/useLocalStorage'

const STEPS = [
  {
    emoji: '🌸',
    title: 'Welcome to Bloom Studies',
    subtitle: 'Ireland\'s smartest study platform',
    description: 'AI-powered tools built specifically for Junior Cycle and Leaving Certificate students. Let\'s get you set up in 30 seconds.',
    cta: 'Get Started',
  },
  {
    emoji: '🎓',
    title: 'What are you studying?',
    subtitle: 'We\'ll personalise everything for you',
    description: null,
    cta: 'Continue',
    isExamPicker: true,
  },
  {
    emoji: '🧠',
    title: 'Your AI toolkit is ready',
    subtitle: 'Here\'s what you can do',
    description: null,
    cta: 'Start Studying',
    isFeatures: true,
  },
]

const FEATURES = [
  { icon: Brain, label: 'AI Tutor', desc: 'Ask anything, get instant answers', color: 'from-violet-500 to-purple-600', href: '/dashboard/tutor' },
  { icon: FileCheck, label: 'Exam Grader', desc: 'Grade your answers with AI', color: 'from-fuchsia-500 to-pink-600', href: '/dashboard/grader' },
  { icon: Layers, label: 'Flashcards', desc: 'Spaced repetition that actually works', color: 'from-blue-500 to-indigo-600', href: '/dashboard/flashcards' },
  { icon: Calendar, label: 'Study Planner', desc: 'AI builds your revision schedule', color: 'from-emerald-500 to-teal-600', href: '/dashboard/planner' },
]

export function OnboardingModal() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [examSystem, setExamSystem] = useState<'leaving-cert' | 'junior-cycle' | null>(null)
  const [dismissed, setDismissed] = useLocalStorage('bloom-onboarding-done', false)

  if (dismissed) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const handleCta = () => {
    if (isLast) {
      setDismissed(true)
    } else {
      setStep(s => s + 1)
    }
  }

  const handleSkip = () => setDismissed(true)

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Skip button */}
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={handleSkip}
            aria-label="Skip onboarding"
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            Skip <X className="w-3 h-3" />
          </button>
        </div>

        <div className="px-8 pb-8 pt-4">
          {/* Step indicator */}
          <div className="flex gap-1.5 justify-center mb-6">
            {STEPS.map((_, i) => (
              <div key={i} className={cn('h-1.5 rounded-full transition-all duration-300', i === step ? 'w-6 bg-primary-500' : i < step ? 'w-3 bg-primary-300' : 'w-3 bg-slate-200 dark:bg-slate-700')} />
            ))}
          </div>

          {/* Emoji */}
          <div className="text-5xl text-center mb-4 animate-float">{current.emoji}</div>

          {/* Headings */}
          <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white text-center mb-1">
            {current.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">{current.subtitle}</p>

          {/* Step content */}
          {current.description && (
            <p className="text-slate-600 dark:text-slate-400 text-center text-sm leading-relaxed mb-6">{current.description}</p>
          )}

          {current.isExamPicker && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { id: 'leaving-cert', label: 'Leaving Cert', emoji: '🎓', desc: '5th & 6th Year' },
                { id: 'junior-cycle', label: 'Junior Cycle', emoji: '📚', desc: '1st, 2nd & 3rd Year' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setExamSystem(opt.id as any)}
                  className={cn(
                    'p-4 rounded-2xl border-2 text-left transition-all',
                    examSystem === opt.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                  )}
                >
                  <div className="text-2xl mb-2">{opt.emoji}</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{opt.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                  {examSystem === opt.id && (
                    <div className="mt-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {current.isFeatures && (
            <div className="space-y-2.5 mb-6">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', f.color)}>
                    <f.icon className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{f.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{f.desc}</p>
                  </div>
                  <Check className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleCta}
            disabled={current.isExamPicker && !examSystem}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all',
              current.isExamPicker && !examSystem
                ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed text-slate-400'
                : 'bg-gradient-to-r from-primary-600 to-accent-500 hover:brightness-110 hover:shadow-xl hover:shadow-primary-500/25 active:scale-[0.98]'
            )}
          >
            {current.cta}
            {!isLast && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
