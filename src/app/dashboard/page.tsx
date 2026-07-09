'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Flame, Target, Clock, TrendingUp, Award, BookOpen,
  ArrowRight, Sparkles, Calendar, Brain, FileCheck,
  Layers, Headphones, ChevronRight, BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import { StreakCelebration } from '@/components/ui/StreakCelebration'
import { createClient } from '@/lib/supabase/client'
import { getProfile } from '@/lib/database/profiles'
import { getUpcomingExams } from '@/lib/database/exams'
import { getProgress } from '@/lib/database/progress'
import type { Profile } from '@/lib/database/profiles'

export default function Dashboard() {
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [showStreak, setShowStreak] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [upcomingExams, setUpcomingExams] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileData, examsData, progressData] = await Promise.all([
        getProfile(user.id),
        getUpcomingExams(user.id),
        getProgress(user.id),
      ])

      setProfile(profileData)
      setUpcomingExams(examsData)
      setProgress(progressData)

      // Show streak celebration on milestone days
      if (profileData) {
        const MILESTONES = [3, 7, 14, 21, 30, 60, 100]
        const lastStreakShown = localStorage.getItem('bloom-streak-shown')
        const today = new Date().toDateString()
        if (lastStreakShown !== today && MILESTONES.includes(profileData.streak)) {
          setTimeout(() => setShowStreak(true), 1200)
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStreakDismiss = () => {
    setShowStreak(false)
    localStorage.setItem('bloom-streak-shown', new Date().toDateString())
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const totalHours = progress.reduce((sum: number, p: any) => sum + (p.hours_studied || 0), 0)
  const totalLessons = progress.reduce((sum: number, p: any) => sum + (p.lessons_completed || 0), 0)
  const totalFlashcards = progress.reduce((sum: number, p: any) => sum + (p.flashcards_mastered || 0), 0)

  const stats = [
    { label: 'Study Streak', value: profile?.streak?.toString() || '0', unit: 'days', icon: Flame, gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', href: '/dashboard/progress' },
    { label: "Today's Goals", value: '0', unit: '/ 5', icon: Target, gradient: 'from-primary-500 to-accent-500', bg: 'bg-primary-50 dark:bg-primary-950/40', text: 'text-primary-600 dark:text-primary-400', href: '/dashboard/planner' },
    { label: 'Total Hours', value: totalHours.toFixed(1), unit: 'h', icon: Clock, gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', href: '/dashboard/progress' },
    { label: 'Bloom Score', value: profile?.bloom_score?.toString() || '0', unit: 'pts', icon: Award, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', href: '/dashboard/progress' },
  ]

  const quickActions = [
    { label: 'Ask AI Tutor', desc: 'Get instant help', icon: Brain, href: '/dashboard/tutor', gradient: 'from-primary-600 to-accent-500', primary: true },
    { label: 'Grade Answer', desc: 'Get SEC feedback', icon: FileCheck, href: '/dashboard/grader', gradient: '' },
    { label: 'Study Flashcards', desc: 'Spaced repetition', icon: Layers, href: '/dashboard/flashcards', gradient: '' },
    { label: 'Audio Learning', desc: 'Learn on the go', icon: Headphones, href: '/dashboard/audio', gradient: '' },
  ]

  const upcomingExamsData = upcomingExams.map(exam => {
    const examDate = new Date(exam.exam_date)
    const today = new Date()
    const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return {
      subject: exam.subject,
      date: examDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      daysLeft: Math.max(0, daysLeft),
      progress: 0, // Will be calculated based on progress data
      color: 'bg-violet-500',
    }
  })

  const recentActivity: Array<{
    type: string
    subject: string
    action: string
    time: string
    icon: any
    color: string
    bg: string
  }> = [] // Will be populated from activity logs

  const recommendations: Array<{
    title: string
    reason: string
    priority: string
    href: string
  }> = [] // Will be generated by AI based on user data

  if (!mounted || loading) {
    return (
      <div className="page-container py-6 space-y-6">
        <div className="space-y-2">
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-6 space-y-6 animate-fade-in">
      {showStreak && <StreakCelebration streak={profile?.streak || 0} onDismiss={handleStreakDismiss} />}

      {/* ── Welcome header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {greeting}, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
            You&apos;re on a <strong className="text-orange-500">{profile?.streak || 0}-day streak</strong> — keep the momentum going!
          </p>
        </div>
        <Link href="/dashboard/planner" className="btn-secondary text-sm shrink-0">
          <Calendar className="w-4 h-4" />
          View Planner
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger-children">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group p-4 sm:p-5 rounded-2xl card card-hover animate-fade-in-up"
          >
            <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200', stat.gradient)}>
              <stat.icon className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold text-slate-900 dark:text-white">{stat.value}</span>
              <span className={cn('text-xs font-semibold', stat.text)}>{stat.unit}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={cn(
              'group flex flex-col gap-2 p-4 rounded-2xl transition-all duration-200',
              action.primary
                ? 'bg-gradient-to-br from-primary-600 to-accent-500 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02]'
                : 'card card-hover'
            )}
          >
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110',
              action.primary ? 'bg-white/20' : 'bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-950/50 dark:to-accent-950/50'
            )}>
              <action.icon className={cn('w-[18px] h-[18px]', action.primary ? 'text-white' : 'text-primary-600 dark:text-primary-400')} aria-hidden="true" />
            </div>
            <div>
              <p className={cn('font-semibold text-sm', action.primary ? 'text-white' : 'text-slate-900 dark:text-white')}>{action.label}</p>
              <p className={cn('text-xs mt-0.5', action.primary ? 'text-white/70' : 'text-slate-500 dark:text-slate-400')}>{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Upcoming Exams */}
        <div className="lg:col-span-2 card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" aria-hidden="true" />
              Upcoming Exams
            </h2>
            <Link href="/dashboard/planner" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingExamsData.length > 0 ? (
              upcomingExamsData.map((exam) => (
                <div key={exam.subject} className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className={cn('w-1.5 h-12 rounded-full shrink-0', exam.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{exam.subject}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{exam.date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display font-bold text-slate-900 dark:text-white text-sm">{exam.daysLeft}d</p>
                    <p className="text-xs text-slate-400">left</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No upcoming exams</p>
                <Link href="/dashboard/planner" className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline mt-2 inline-block">
                  Add your first exam
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-primary-500" aria-hidden="true" />
            AI Recommendations
          </h2>
          <div className="space-y-2.5">
            {recommendations.length > 0 ? (
              recommendations.map((rec) => (
                <Link
                  key={rec.title}
                  href={rec.href}
                  className="group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full mt-1.5 shrink-0',
                    rec.priority === 'high' ? 'bg-red-500' : 'bg-amber-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{rec.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rec.reason}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">Start studying to get AI recommendations</p>
              </div>
            )}
          </div>
          <Link href="/dashboard/progress" className="btn-secondary w-full mt-4 text-sm justify-center">
            <BarChart3 className="w-4 h-4" />
            Full Analytics
          </Link>
        </div>
      </div>

      {/* ── Bottom grid ── */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Recent Activity */}
        <div className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-primary-500" aria-hidden="true" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', item.bg)}>
                    <item.icon className={cn('w-[18px] h-[18px]', item.color)} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{item.action}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.subject}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{item.time}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No recent activity</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Start studying to see your activity here</p>
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" aria-hidden="true" />
              Achievements
            </h2>
            <span className="text-xs text-slate-400">2 / 8 unlocked</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { title: 'Week Warrior', desc: '7-day streak', emoji: '🔥', unlocked: true },
              { title: 'Flash Master', desc: '100 cards done', emoji: '🃏', unlocked: true },
              { title: 'Perfect Score', desc: '100% on grader', emoji: '⭐', unlocked: false },
              { title: 'Scholar', desc: '10+ submissions', emoji: '📚', unlocked: false },
            ].map((a) => (
              <div
                key={a.title}
                className={cn(
                  'p-3 rounded-xl border transition-all',
                  a.unlocked
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50 grayscale'
                )}
              >
                <span className="text-xl" aria-hidden="true">{a.emoji}</span>
                <p className="font-semibold text-slate-900 dark:text-white text-xs mt-1.5">{a.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{a.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/dashboard/progress?tab=subjects" className="btn-ghost w-full mt-4 text-sm justify-center text-slate-500">
            View all achievements
          </Link>
        </div>
      </div>

    </div>
  )
}




