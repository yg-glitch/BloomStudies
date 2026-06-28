'use client'

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, Zap, Trophy, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'xp' | 'achievement' | 'streak'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toast: (opts: Omit<Toast, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  xp: (amount: number, reason: string) => void
  achievement: (title: string, emoji?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const ICONS: Record<ToastType, { icon: any; bg: string; icon_color: string }> = {
  success: { icon: CheckCircle, bg: 'bg-emerald-500', icon_color: 'text-white' },
  error: { icon: AlertCircle, bg: 'bg-red-500', icon_color: 'text-white' },
  info: { icon: Info, bg: 'bg-blue-500', icon_color: 'text-white' },
  xp: { icon: Zap, bg: 'bg-amber-400', icon_color: 'text-amber-900' },
  achievement: { icon: Trophy, bg: 'bg-gradient-to-br from-amber-400 to-orange-500', icon_color: 'text-white' },
  streak: { icon: Flame, bg: 'bg-gradient-to-br from-orange-500 to-red-500', icon_color: 'text-white' },
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const { icon: Icon, bg, icon_color } = ICONS[toast.type]
  const duration = toast.duration ?? 4000

  useEffect(() => {
    // Mount animation
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, duration)
    return () => clearTimeout(t)
  }, [toast.id, duration, onRemove])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl shadow-black/10 border border-slate-200 dark:border-slate-700 transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon className={cn('w-5 h-5', icon_color)} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">{toast.title}</p>
        {toast.message && <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300) }}
        aria-label="Dismiss notification"
        className="btn-icon w-6 h-6 shrink-0 -mt-0.5 -mr-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const add = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random()}`
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]) // max 5 toasts
  }, [])

  const ctx: ToastContextType = {
    toast: add,
    success: (title, message) => add({ type: 'success', title, message }),
    error: (title, message) => add({ type: 'error', title, message }),
    info: (title, message) => add({ type: 'info', title, message }),
    xp: (amount, reason) => add({ type: 'xp', title: `+${amount} XP`, message: reason, duration: 3000 }),
    achievement: (title, emoji) => add({ type: 'achievement', title: `${emoji || '🏆'} ${title}`, message: 'Achievement unlocked!', duration: 5000 }),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast container */}
      <div
        aria-label="Notifications"
        className="fixed bottom-24 lg:bottom-6 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto w-full">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
