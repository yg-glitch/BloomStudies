'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface StreakCelebrationProps {
  streak: number
  onDismiss: () => void
}

const MILESTONES = [3, 7, 14, 21, 30, 60, 100]

export function StreakCelebration({ streak, onDismiss }: StreakCelebrationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 400) }, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const isMilestone = MILESTONES.includes(streak)
  const emoji = streak >= 30 ? '⚡' : streak >= 14 ? '🔥' : streak >= 7 ? '🎯' : '✨'

  return (
    <div className={cn(
      'fixed inset-0 z-[200] flex items-center justify-center p-6 transition-all duration-400',
      visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    )}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setVisible(false); setTimeout(onDismiss, 400) }} />

      {/* Card */}
      <div className={cn(
        'relative bg-gradient-to-br from-primary-600 via-accent-600 to-purple-700 rounded-3xl p-8 text-white text-center max-w-sm w-full shadow-2xl transition-all duration-400',
        visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'
      )}>
        {/* Dismiss */}
        <button onClick={() => { setVisible(false); setTimeout(onDismiss, 400) }} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>

        {/* Animated emoji */}
        <div className="text-7xl mb-4 animate-float">{emoji}</div>

        <div className="font-display text-6xl font-black mb-1">{streak}</div>
        <div className="text-white/80 text-lg mb-4">Day Streak!</div>

        {isMilestone && (
          <div className="bg-white/20 rounded-2xl px-4 py-3 mb-4 backdrop-blur-sm">
            <p className="font-bold text-sm">🎉 Milestone Reached!</p>
            <p className="text-white/80 text-xs mt-0.5">You've unlocked a new badge</p>
          </div>
        )}

        <p className="text-white/70 text-sm leading-relaxed">
          {streak >= 30 ? "You're unstoppable. Your dedication is extraordinary." :
           streak >= 14 ? "Two weeks of consistent studying. Your grades will show it." :
           streak >= 7 ? "One full week! You're building a powerful study habit." :
           "Keep going! Consistency is the key to exam success."}
        </p>

        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 400) }}
          className="mt-6 w-full py-3 rounded-2xl bg-white text-primary-700 font-bold hover:bg-white/90 transition-all active:scale-95"
        >
          Keep Studying 🚀
        </button>

        {/* Confetti dots */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none" aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={cn(
              'absolute w-2 h-2 rounded-full opacity-60',
              i % 3 === 0 ? 'bg-white' : i % 3 === 1 ? 'bg-yellow-300' : 'bg-pink-300'
            )} style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
