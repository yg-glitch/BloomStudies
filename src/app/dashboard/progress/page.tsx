'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp, BarChart3, Award, Target, Calendar,
  Brain, Flame, Clock, Star, Zap, AlertTriangle,
  CheckCircle, BookOpen, Layers, FileCheck, Sparkles,
  ChevronUp, ChevronDown, RefreshCw, Trophy, Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/lib/useLocalStorage'
import { useToast } from '@/components/ui/Toast'
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie
} from 'recharts'

interface AIInsights {
  predictedPoints: number
  predictedGrades: Record<string, string>
  weakTopics: string[]
  strongTopics: string[]
  consistencyScore: number
  recommendations: { priority: string; title: string; description: string; action: string }[]
  weeklyReport: string
  monthlyReport: string
  studyTip: string
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#8b5cf6', English: '#d946ef', Irish: '#06b6d4',
  Physics: '#f59e0b', Chemistry: '#10b981', Biology: '#3b82f6',
  History: '#f97316', Geography: '#84cc16', Business: '#ec4899',
  Economics: '#6366f1',
}

const GRADE_TO_POINTS: Record<string, number> = {
  H1: 100, H2: 88, H3: 77, H4: 66, H5: 56, H6: 46, H7: 37, H8: 0,
  O1: 56, O2: 46, O3: 37, O4: 28, O5: 20, O6: 12, O7: 0, O8: 0,
}

// Mock activity data — in production this would come from actual user actions
function generateActivityData() {
  const days = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    days.push({
      date: d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' }),
      hours: Math.random() > 0.3 ? +(Math.random() * 4 + 0.5).toFixed(1) : 0,
      score: Math.floor(Math.random() * 30 + 65),
    })
  }
  return days
}

const WEEKLY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ProgressPage() {
  const [period, setPeriod] = useState<'week'|'month'|'year'>('week')
  const [activeTab, setActiveTab] = useState<'overview'|'subjects'|'activity'|'ai'>('overview')
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [graderSubmissions] = useLocalStorage<any[]>('bloom-grader-submissions', [])
  const [flashcardDecks] = useLocalStorage<any[]>('bloom-flashcard-decks', [])

  const activityData = useMemo(() => generateActivityData(), [])

  // Derive stats from real stored data
  const graderStats = useMemo(() => {
    if (!graderSubmissions.length) return { avg: 0, best: 0, count: 0, bySubject: {} as Record<string, number[]> }
    const bySubject: Record<string, number[]> = {}
    graderSubmissions.forEach(s => {
      if (!bySubject[s.subject]) bySubject[s.subject] = []
      bySubject[s.subject].push(s.result.percentageScore)
    })
    const scores = graderSubmissions.map(s => s.result.percentageScore)
    return { avg: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length), best: Math.max(...scores), count: scores.length, bySubject }
  }, [graderSubmissions])

  const flashcardStats = useMemo(() => {
    const total = flashcardDecks.reduce((a, d) => a + d.flashcards.length, 0)
    const mastered = flashcardDecks.reduce((a, d) => a + d.flashcards.filter((c: any) => c.mastery >= 80).length, 0)
    return { total, mastered }
  }, [flashcardDecks])

  const studyHoursTotal = useMemo(() => activityData.reduce((a, d) => a + d.hours, 0).toFixed(1), [activityData])
  const streak = useMemo(() => {
    let s = 0
    for (let i = activityData.length - 1; i >= 0; i--) {
      if (activityData[i].hours > 0) s++; else break
    }
    return s
  }, [activityData])

  const weeklyHours = useMemo(() => {
    return WEEKLY_LABELS.map((day, i) => ({
      day,
      hours: activityData.slice(-7)[i]?.hours || 0,
    }))
  }, [activityData])

  const subjectRadarData = useMemo(() => {
    const subjects = Object.keys(graderStats.bySubject)
    if (subjects.length === 0) {
      return [
        { subject: 'Math', score: 82 }, { subject: 'English', score: 75 },
        { subject: 'Irish', score: 68 }, { subject: 'Science', score: 79 },
        { subject: 'History', score: 71 }, { subject: 'Business', score: 84 },
      ]
    }
    return subjects.map(s => ({
      subject: s.slice(0, 7),
      score: Math.round(graderStats.bySubject[s].reduce((a,b)=>a+b,0)/graderStats.bySubject[s].length),
    }))
  }, [graderStats])

  const subjectPerformance = useMemo(() => {
    const base = [
      { name: 'Mathematics', score: 82, change: 8 },
      { name: 'English', score: 76, change: 4 },
      { name: 'Irish', score: 68, change: -2 },
      { name: 'Physics', score: 79, change: 11 },
      { name: 'Chemistry', score: 74, change: 6 },
      { name: 'Biology', score: 85, change: 14 },
    ]
    // Override with real data if available
    return base.map(b => {
      const real = graderStats.bySubject[b.name]
      if (real && real.length) {
        const avg = Math.round(real.reduce((a,x)=>a+x,0)/real.length)
        return { ...b, score: avg, change: avg - b.score }
      }
      return b
    })
  }, [graderStats])

  const fetchAIInsights = async () => {
    setIsLoadingAI(true)
    try {
      const analyticsData = {
        studyHoursTotal, streak, graderStats, flashcardStats,
        subjectPerformance, recentActivity: activityData.slice(-7),
        period,
      }
      const res = await fetch('/api/ai/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyticsData }),
      })
      if (res.ok) setInsights(await res.json())
    } catch (e) { console.error(e) }
    finally { setIsLoadingAI(false) }
  }

  useEffect(() => { fetchAIInsights() }, [period])

  const statCards = [
    { label: 'Study Hours', value: `${studyHoursTotal}h`, icon: Clock, color: 'from-violet-500 to-purple-600', sub: 'last 30 days' },
    { label: 'Study Streak', value: `${streak} days`, icon: Flame, color: 'from-orange-500 to-red-500', sub: 'keep it up!' },
    { label: 'Avg Score', value: graderStats.avg ? `${graderStats.avg}%` : 'N/A', icon: Target, color: 'from-primary-500 to-accent-500', sub: `${graderStats.count} submissions` },
    { label: 'Cards Mastered', value: `${flashcardStats.mastered}`, icon: Layers, color: 'from-blue-500 to-cyan-500', sub: `of ${flashcardStats.total} total` },
    { label: 'Predicted Points', value: insights?.predictedPoints ? `${insights.predictedPoints}` : '—', icon: Trophy, color: 'from-amber-500 to-orange-500', sub: 'CAO estimate' },
    { label: 'Consistency', value: insights?.consistencyScore ? `${insights.consistencyScore}%` : '—', icon: Activity, color: 'from-emerald-500 to-teal-500', sub: 'regularity score' },
  ]

  return (
    <div className="page-container py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
            <TrendingUp className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="section-heading leading-none">Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">Your complete learning intelligence dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            {(['week','month','year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all', period === p ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={fetchAIInsights} disabled={isLoadingAI} className="btn-primary text-sm gap-1.5">
            {isLoadingAI ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Insights
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="p-4 rounded-2xl card card-hover">
            <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', color)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-display font-bold text-slate-900 dark:text-white">{value}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 w-fit overflow-x-auto">
        {([
          { id: 'overview', label: '📊 Overview' },
          { id: 'subjects', label: '📚 Subjects' },
          { id: 'activity', label: '📅 Activity' },
          { id: 'ai', label: '🤖 AI Report' },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Study hours area chart */}
            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" /> Daily Study Hours (30 days)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={activityData.slice(-14)}>
                  <defs>
                    <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }} />
                  <Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#hoursGrad)" name="Hours" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Score trend */}
            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-500" /> Score Trend
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={activityData.filter(d => d.score).slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }} />
                  <Line type="monotone" dataKey="score" stroke="#d946ef" strokeWidth={2.5} dot={false} name="Score %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly bar + Radar */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-500" /> This Week
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="hours" name="Hours" radius={[6, 6, 0, 0]}>
                    {weeklyHours.map((_, i) => (
                      <Cell key={i} fill={`hsl(${260 + i * 10}, 70%, 60%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary-500" /> Subject Radar
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={subjectRadarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} />
                  <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Predicted grades */}
          {insights?.predictedGrades && Object.keys(insights.predictedGrades).length > 0 && (
            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Predicted Leaving Cert Grades
                <span className="ml-auto text-xs text-slate-400 font-normal">AI estimate based on your performance</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(insights.predictedGrades).map(([subject, grade]) => (
                  <div key={subject} className={cn('px-4 py-3 rounded-xl text-center min-w-[90px]', grade.startsWith('H1') || grade.startsWith('H2') ? 'bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700' : grade.startsWith('H3') || grade.startsWith('H4') ? 'bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700' : 'bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700')}>
                    <div className="text-2xl font-display font-bold text-slate-900 dark:text-white">{grade}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{subject}</div>
                  </div>
                ))}
                <div className="px-4 py-3 rounded-xl text-center min-w-[90px] bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                  <div className="text-2xl font-display font-bold">{insights.predictedPoints}</div>
                  <div className="text-xs opacity-80 mt-0.5">CAO pts</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBJECTS TAB */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl card">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary-500" /> Subject Performance</h3>
            <div className="space-y-5">
              {subjectPerformance.map(s => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-slate-900 dark:text-white text-sm">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{s.score}%</span>
                      <span className={cn('text-xs flex items-center gap-0.5', s.change >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                        {s.change >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}{Math.abs(s.change)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.score}%`, background: SUBJECT_COLORS[s.name] || '#8b5cf6' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak/Strong topics */}
          {insights && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl card">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Weak Topics</h3>
                <div className="space-y-2">
                  {insights.weakTopics.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-2xl card">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Strong Topics</h3>
                <div className="space-y-2">
                  {insights.strongTopics.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Achievements */}
          <div className="p-5 rounded-2xl card">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Achievements</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { title: 'Week Warrior', desc: '7-day streak', emoji: '🔥', unlocked: streak >= 7 },
                { title: 'Flash Master', desc: '50 cards mastered', emoji: '🃏', unlocked: flashcardStats.mastered >= 50 },
                { title: 'Top Scorer', desc: '90%+ on any test', emoji: '⭐', unlocked: graderStats.best >= 90 },
                { title: 'Consistent', desc: '14-day streak', emoji: '💪', unlocked: streak >= 14 },
                { title: 'Scholar', desc: '10+ submissions', emoji: '📚', unlocked: graderStats.count >= 10 },
                { title: 'Perfectionist', desc: '100% mastery deck', emoji: '🏆', unlocked: flashcardDecks.some((d: any) => d.flashcards.every((c: any) => c.mastery >= 100)) },
                { title: 'Night Owl', desc: '20h in a week', emoji: '🦉', unlocked: false },
                { title: 'H1 Hunter', desc: 'Predicted H1', emoji: '🎯', unlocked: (insights?.predictedPoints || 0) >= 600 },
              ].map((a, i) => (
                <div key={i} className={cn('p-3 rounded-xl text-center border transition-all', a.unlocked ? 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50 grayscale')}>
                  <div className="text-2xl mb-1">{a.emoji}</div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">{a.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* GitHub-style heatmap */}
          <div className="p-5 rounded-2xl card">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-primary-500" /> 30-Day Activity Heatmap</h3>
            <div className="flex flex-wrap gap-1.5">
              {activityData.map((d, i) => (
                <div key={i} title={`${d.date}: ${d.hours}h`}
                  className={cn('w-8 h-8 rounded-md transition-all cursor-pointer hover:scale-110', d.hours === 0 ? 'bg-slate-100 dark:bg-slate-800' : d.hours < 1 ? 'bg-primary-200 dark:bg-primary-900' : d.hours < 2 ? 'bg-primary-300 dark:bg-primary-800' : d.hours < 3 ? 'bg-primary-400 dark:bg-primary-700' : 'bg-primary-500 dark:bg-primary-600')}
                  style={{ opacity: d.hours === 0 ? 0.4 : 1 }}>
                  <span className="sr-only">{d.date}: {d.hours}h</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map(l => <div key={l} className={cn('w-4 h-4 rounded', l === 0 ? 'bg-slate-100 dark:bg-slate-800' : `bg-primary-${l*100+100}`)} />)}
              <span>More</span>
            </div>
          </div>

          {/* Weekly + monthly reports */}
          {insights && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl card">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-500" /> Weekly Report</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{insights.weeklyReport}</p>
              </div>
              <div className="p-5 rounded-2xl card">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary-500" /> Monthly Report</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{insights.monthlyReport}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI REPORT TAB */}
      {activeTab === 'ai' && (
        <div className="space-y-5 max-w-3xl">
          {isLoadingAI ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <p className="text-slate-500">Generating AI insights...</p>
              <div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{animationDelay:`${i*150}ms`}}/>)}</div>
            </div>
          ) : insights ? (
            <>
              {insights.studyTip && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-xl shadow-primary-500/20">
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-lg mb-1">Today&apos;s AI Tip</div>
                      <p className="opacity-90 leading-relaxed">{insights.studyTip}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-5 rounded-2xl card">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Brain className="w-4 h-4 text-primary-500" /> AI Recommendations</h3>
                <div className="space-y-3">
                  {insights.recommendations.map((r, i) => (
                    <div key={i} className={cn('p-4 rounded-xl border', r.priority === 'high' ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20' : r.priority === 'medium' ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50')}>
                      <div className="flex items-start gap-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold shrink-0 mt-0.5', r.priority === 'high' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' : r.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400')}>{r.priority}</span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">{r.title}</div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{r.description}</p>
                          <div className="mt-2 text-xs font-medium text-primary-600 dark:text-primary-400">→ {r.action}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Click &quot;AI Insights&quot; to generate your personal report</p>
              <button onClick={fetchAIInsights} className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-medium hover:shadow-lg transition-all inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Generate Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}





