'use client'

import { useState, useMemo } from 'react'
import {
  Calendar, Plus, Clock, Target, CheckCircle2, Circle,
  Sparkles, X, ChevronLeft, ChevronRight, Trophy,
  AlertCircle, TrendingUp, RotateCcw, Zap, BookOpen,
  Trash2, Edit, Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/lib/useLocalStorage'
import { useToast } from '@/components/ui/Toast'
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isToday, isPast, parseISO, startOfMonth, endOfMonth } from 'date-fns'

interface StudySession {
  id: string; date: string; startTime: string; endTime: string
  subject: string; topic: string; type: 'study'|'revision'|'practice'|'break'|'catchup'
  priority: 'high'|'medium'|'low'; completed: boolean; missed: boolean; notes: string
}

interface ExamEntry { subject: string; date: string; level: string; targetGrade: string }
interface Milestone { date: string; description: string; subject: string }

interface StudyPlan {
  studentName: string; createdAt: string; weeklyHours: number
  advice: string[]; milestones: Milestone[]
  sessions: StudySession[]; examEntries: ExamEntry[]
}

interface SetupForm {
  educationSystem: 'leaving-cert'|'junior-cycle'
  subjects: string[]; studyHoursPerDay: number
  sportsSchedule: string; workSchedule: string
  targetPoints: string
  examDates: ExamEntry[]
}

const SUBJECTS = [
  'Mathematics','English','Irish','Physics','Chemistry',
  'Biology','History','Geography','Business','Economics',
  'French','German','Spanish','Computer Science','Art',
  'Music','Home Economics','Agricultural Science',
]

const SESSION_COLORS: Record<string, string> = {
  study: 'bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800',
  revision: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  practice: 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  break: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
  catchup: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
}

const TYPE_LABELS: Record<string, string> = {
  study: '📚 Study', revision: '🔁 Revision', practice: '✏️ Practice Paper',
  break: '☕ Break', catchup: '🔧 Catch-up'
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500'
}

export default function StudyPlannerPage() {
  const [plan, setPlan, , planLoaded] = useLocalStorage<StudyPlan | null>('bloom-study-plan', null)
  const [view, setView] = useState<'day'|'week'|'month'>('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'schedule'|'setup'|'progress'|'advice'>('schedule')
  const [showSetup, setShowSetup] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [form, setForm] = useState<SetupForm>({
    educationSystem: 'leaving-cert', subjects: [], studyHoursPerDay: 3,
    sportsSchedule: '', workSchedule: '', targetPoints: '',
    examDates: [{ subject: '', date: '', level: 'higher', targetGrade: 'H1' }],
  })

  const sessionsForDate = (date: Date) =>
    plan?.sessions.filter(s => isSameDay(parseISO(s.date), date)) || []

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end: addDays(start, 6) })
  }, [selectedDate])

  const monthDays = useMemo(() => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)
    return eachDayOfInterval({ start, end })
  }, [selectedDate])

  const todaySessions = sessionsForDate(selectedDate)
  const completedToday = todaySessions.filter(s => s.completed).length
  const totalToday = todaySessions.length
  const missedSessions = plan?.sessions.filter(s => !s.completed && isPast(parseISO(s.date)) && !isSameDay(parseISO(s.date), new Date())).length || 0

  const { xp: toastXP, success: toastSuccess, error: toastError } = useToast()

  const toggleComplete = (id: string) => {
    if (!plan) return
    const session = plan.sessions.find(s => s.id === id)
    const wasComplete = session?.completed
    const updated = { ...plan, sessions: plan.sessions.map(s => s.id === id ? { ...s, completed: !s.completed, missed: false } : s) }
    setPlan(updated)
    if (!wasComplete) {
      toastXP(10, `Completed ${session?.subject} session`)
      const completedCount = updated.sessions.filter(s => s.completed).length
      if (completedCount === 1) setTimeout(() => toastSuccess('First session done!', 'Keep the momentum going 🚀'), 500)
    }
  }

  const markMissed = (id: string) => {
    if (!plan) return
    const updated = { ...plan, sessions: plan.sessions.map(s => s.id === id ? { ...s, missed: true, completed: false } : s) }
    setPlan(updated)
  }

  // Auto-reschedule missed sessions
  const reschedule = () => {
    if (!plan) return
    const missed = plan.sessions.filter(s => s.missed)
    let nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + 1)
    const rescheduled = missed.map(s => {
      const newDate = format(nextDate, 'yyyy-MM-dd')
      nextDate = addDays(nextDate, 1)
      return { ...s, date: newDate, missed: false }
    })
    const updated = { ...plan, sessions: plan.sessions.map(s => {
      const r = rescheduled.find(r => r.id === s.id)
      return r || s
    })}
    setPlan(updated)
  }

  const addSubject = (s: string) => {
    if (!form.subjects.includes(s)) setForm(f => ({ ...f, subjects: [...f.subjects, s] }))
  }

  const addExamDate = () => setForm(f => ({ ...f, examDates: [...f.examDates, { subject: '', date: '', level: 'higher', targetGrade: 'H1' }] }))

  const handleGenerate = async () => {
    if (form.subjects.length === 0) { setGenerateError('Please select at least one subject.'); return }
    setIsGenerating(true); setGenerateError('')
    try {
      const res = await fetch('/api/ai/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, startDate: format(new Date(), 'yyyy-MM-dd') }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const data: StudyPlan = await res.json()
      setPlan(data)
      setShowSetup(false)
      setActiveTab('schedule')
      const sessionCount = data.sessions.filter((s: any) => s.type !== 'break').length
      toastSuccess('Study plan created!', `${sessionCount} sessions over 4 weeks`)
      toastXP(50, 'Created personalised study plan')
    } catch (err: any) {
      setGenerateError(err.message || 'Failed to generate plan.')
      toastError('Plan generation failed', 'Please try again')
    }
    finally { setIsGenerating(false) }
  }

  const progressStats = useMemo(() => {
    if (!plan) return null
    const total = plan.sessions.filter(s => s.type !== 'break').length
    const done = plan.sessions.filter(s => s.completed).length
    const missed = plan.sessions.filter(s => s.missed).length
    const bySubject: Record<string, { total: number; done: number }> = {}
    plan.sessions.forEach(s => {
      if (!bySubject[s.subject]) bySubject[s.subject] = { total: 0, done: 0 }
      bySubject[s.subject].total++
      if (s.completed) bySubject[s.subject].done++
    })
    return { total, done, missed, bySubject, pct: total ? Math.round((done / total) * 100) : 0 }
  }, [plan])

  return (
    <div className="page-container py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-heading flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            Study Planner
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">AI-powered timetable for Irish exam success</p>
        </div>
        <div className="flex gap-2">
          {missedSessions > 0 && (
            <button onClick={reschedule} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors border border-amber-200 dark:border-amber-800">
              <RotateCcw className="w-4 h-4" /> Reschedule {missedSessions} missed
            </button>
          )}
          <button onClick={() => setShowSetup(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all text-sm">
            <Sparkles className="w-4 h-4" /> {plan ? 'Regenerate Plan' : 'Create Plan'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 w-fit">
        {(['schedule', 'progress', 'advice'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all',
              activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            {tab === 'schedule' ? '📅 Schedule' : tab === 'progress' ? '📊 Progress' : '💡 Advice'}
          </button>
        ))}
      </div>

      {!plan && activeTab === 'schedule' && (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900 dark:to-accent-900 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-primary-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No study plan yet</h3>
          <p className="text-slate-400 max-w-sm mx-auto mb-6">Tell the AI your subjects, exam dates, and availability — it builds your entire revision schedule automatically</p>
          <button onClick={() => setShowSetup(true)}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-medium hover:shadow-lg transition-all inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> Create My Study Plan
          </button>
        </div>
      )}

      {/* SCHEDULE TAB */}
      {plan && activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl card text-center">
              <div className="text-2xl font-display font-bold text-gradient">{completedToday}/{totalToday}</div>
              <div className="text-xs text-slate-500 mt-1">Today's Sessions</div>
            </div>
            <div className="p-4 rounded-xl card text-center">
              <div className="text-2xl font-display font-bold text-gradient">{plan.weeklyHours}h</div>
              <div className="text-xs text-slate-500 mt-1">Weekly Target</div>
            </div>
            <div className="p-4 rounded-xl card text-center">
              <div className={cn('text-2xl font-display font-bold', missedSessions > 0 ? 'text-amber-500' : 'text-green-500')}>{missedSessions}</div>
              <div className="text-xs text-slate-500 mt-1">Missed Sessions</div>
            </div>
            <div className="p-4 rounded-xl card text-center">
              <div className="text-2xl font-display font-bold text-gradient">{plan.examEntries?.length || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Upcoming Exams</div>
            </div>
          </div>

          {/* View toggle + navigation */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              {(['day','week','month'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={cn('px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
                    view === v ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
                  {v}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedDate(d => view === 'day' ? addDays(d, -1) : view === 'week' ? addDays(d, -7) : addDays(d, -30))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {view === 'day' ? format(selectedDate, 'EEEE, d MMM') : view === 'week' ? `Week of ${format(weekDays[0], 'd MMM')}` : format(selectedDate, 'MMMM yyyy')}
              </span>
              <button onClick={() => setSelectedDate(d => view === 'day' ? addDays(d, 1) : view === 'week' ? addDays(d, 7) : addDays(d, 30))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1.5 rounded-xl text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors">Today</button>
            </div>
          </div>

          {/* DAY VIEW */}
          {view === 'day' && (
            <div className="space-y-3">
              {todaySessions.length === 0 ? (
                <div className="text-center py-12 text-slate-400"><BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No sessions scheduled for this day.</p></div>
              ) : todaySessions.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(session => (
                <div key={session.id} className={cn('p-4 rounded-xl border-2 transition-all', session.completed ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : session.missed ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20' : SESSION_COLORS[session.type])}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleComplete(session.id)} className="mt-0.5 shrink-0">
                      {session.completed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-400" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('font-semibold text-sm', session.completed && 'line-through text-slate-400')}>{session.subject}</span>
                        <span className="text-xs">{TYPE_LABELS[session.type]}</span>
                        <div className={cn('w-2 h-2 rounded-full shrink-0', PRIORITY_DOT[session.priority])} />
                      </div>
                      <p className={cn('text-sm mt-0.5', session.completed ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-400')}>{session.topic}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.startTime} – {session.endTime}</span>
                      </div>
                    </div>
                    {!session.completed && !session.missed && isPast(parseISO(`${session.date}T${session.endTime}`)) && (
                      <button onClick={() => markMissed(session.id)} className="text-xs text-red-500 hover:underline shrink-0">Mark missed</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* WEEK VIEW */}
          {view === 'week' && (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => {
                const daySessions = sessionsForDate(day)
                const isDayToday = isToday(day)
                const isSelected = isSameDay(day, selectedDate)
                return (
                  <div key={day.toISOString()} className={cn('min-h-[120px] p-2 rounded-xl border transition-all cursor-pointer',
                    isDayToday ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-primary-300')}
                    onClick={() => { setSelectedDate(day); setView('day') }}>
                    <div className={cn('text-center mb-2', isDayToday ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-slate-500')}>
                      <div className="text-xs uppercase">{format(day, 'EEE')}</div>
                      <div className={cn('text-sm font-semibold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto', isDayToday && 'bg-gradient-to-br from-primary-500 to-accent-500 text-white')}>{format(day, 'd')}</div>
                    </div>
                    <div className="space-y-1">
                      {daySessions.slice(0, 3).map(s => (
                        <div key={s.id} className={cn('text-xs px-1.5 py-1 rounded truncate font-medium', s.completed ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 line-through' : SESSION_COLORS[s.type])}>
                          {s.subject}
                        </div>
                      ))}
                      {daySessions.length > 3 && <div className="text-xs text-slate-400 text-center">+{daySessions.length - 3} more</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* MONTH VIEW */}
          {view === 'month' && (
            <div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                  <div key={d} className="text-center text-xs text-slate-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: (monthDays[0].getDay() + 6) % 7 }).map((_, i) => <div key={`e${i}`} />)}
                {monthDays.map(day => {
                  const ds = sessionsForDate(day)
                  const isDayToday = isToday(day)
                  return (
                    <div key={day.toISOString()} onClick={() => { setSelectedDate(day); setView('day') }}
                      className={cn('min-h-[60px] p-1 rounded-lg border cursor-pointer transition-all', isDayToday ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-950/20' : 'border-slate-100 dark:border-slate-800 hover:border-primary-300')}>
                      <div className={cn('text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full',
                        isDayToday ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white' : 'text-slate-600 dark:text-slate-400')}>
                        {format(day, 'd')}
                      </div>
                      {ds.slice(0, 2).map(s => <div key={s.id} className={cn('text-xs px-1 rounded truncate', SESSION_COLORS[s.type])}>{s.subject.slice(0, 4)}</div>)}
                      {ds.length > 2 && <div className="text-xs text-slate-400">+{ds.length-2}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Exam countdown + milestones */}
          {plan.examEntries && plan.examEntries.length > 0 && (
            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-primary-500" /> Upcoming Exams</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {plan.examEntries.filter(e => e.subject && e.date).map((exam, i) => {
                  const days = Math.ceil((parseISO(exam.date).getTime() - Date.now()) / 86400000)
                  return (
                    <div key={i} className={cn('p-3 rounded-xl border', days <= 7 ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20' : days <= 14 ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50')}>
                      <div className="font-medium text-slate-900 dark:text-white text-sm">{exam.subject}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{exam.date} • {exam.level} • Target: {exam.targetGrade}</div>
                      <div className={cn('text-lg font-display font-bold mt-1', days <= 7 ? 'text-red-600 dark:text-red-400' : days <= 14 ? 'text-amber-600 dark:text-amber-400' : 'text-primary-600 dark:text-primary-400')}>
                        {days > 0 ? `${days} days` : 'Today!'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROGRESS TAB */}
      {activeTab === 'progress' && progressStats && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-6 rounded-2xl card">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary-500" /> Overall Progress</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl font-display font-bold text-gradient">{progressStats.pct}%</div>
              <div className="flex-1">
                <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-1000 rounded-full" style={{ width: `${progressStats.pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{progressStats.done} completed</span>
                  <span>{progressStats.missed} missed</span>
                  <span>{progressStats.total - progressStats.done - progressStats.missed} remaining</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(progressStats.bySubject).map(([subj, stats]) => (
                <div key={subj} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-slate-600 dark:text-slate-400 truncate">{subj}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all" style={{ width: `${stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-16 text-right">{stats.done}/{stats.total}</span>
                </div>
              ))}
            </div>
          </div>
          {missedSessions > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-300 text-sm">You have {missedSessions} missed sessions</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Use the "Reschedule" button to automatically move them to upcoming days.</p>
              </div>
              <button onClick={reschedule} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors shrink-0">Reschedule</button>
            </div>
          )}
        </div>
      )}

      {/* ADVICE TAB */}
      {activeTab === 'advice' && plan && (
        <div className="space-y-4 max-w-2xl">
          {plan.milestones && plan.milestones.length > 0 && (
            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Milestones</h3>
              <div className="space-y-3">
                {plan.milestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0"><Trophy className="w-4 h-4 text-white" /></div>
                    <div><div className="font-medium text-slate-900 dark:text-white text-sm">{m.description}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{m.subject} • {m.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {plan.advice && (
            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-primary-500" /> AI Study Advice</h3>
              <ul className="space-y-3">
                {plan.advice.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 p-3 rounded-xl bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900">
                    <span className="text-primary-500 font-bold shrink-0">{i + 1}.</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* SETUP MODAL */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" /> Create Study Plan
              </h2>
              <button onClick={() => setShowSetup(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-5">
              {/* Exam type */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Exam Type</label>
                <div className="flex rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                  {(['leaving-cert','junior-cycle'] as const).map(sys => (
                    <button key={sys} onClick={() => setForm(f => ({ ...f, educationSystem: sys }))}
                      className={cn('flex-1 py-3 text-sm font-medium transition-colors', form.educationSystem === sys ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}>
                      {sys === 'leaving-cert' ? 'Leaving Certificate' : 'Junior Cycle'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Subjects</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.subjects.map(s => (
                    <span key={s} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm">
                      {s}<button onClick={() => setForm(f => ({ ...f, subjects: f.subjects.filter(x => x !== s) }))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <select onChange={e => { if (e.target.value) { addSubject(e.target.value); e.target.value = '' } }}
                  className="input text-sm">
                  <option value="">+ Add subject...</option>
                  {SUBJECTS.filter(s => !form.subjects.includes(s)).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Study hours */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Study Hours Available Per Day</label>
                <input type="number" min={1} max={12} value={form.studyHoursPerDay} onChange={e => setForm(f => ({ ...f, studyHoursPerDay: Number(e.target.value) }))}
                  className="input text-sm" />
              </div>

              {/* Target */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Target Points / Grade</label>
                <input type="text" value={form.targetPoints} onChange={e => setForm(f => ({ ...f, targetPoints: e.target.value }))} placeholder="e.g. 550 points, H1s, Medicine"
                  className="input text-sm" />
              </div>

              {/* Exam dates */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Exam Dates</label>
                <div className="space-y-2">
                  {form.examDates.map((exam, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 items-center">
                      <select value={exam.subject} onChange={e => setForm(f => ({ ...f, examDates: f.examDates.map((x, j) => j === i ? { ...x, subject: e.target.value } : x) }))}
                        className="px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none text-sm">
                        <option value="">Subject</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input type="date" value={exam.date} onChange={e => setForm(f => ({ ...f, examDates: f.examDates.map((x, j) => j === i ? { ...x, date: e.target.value } : x) }))}
                        className="px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none text-sm" />
                      <input type="text" value={exam.targetGrade} placeholder="Target" onChange={e => setForm(f => ({ ...f, examDates: f.examDates.map((x, j) => j === i ? { ...x, targetGrade: e.target.value } : x) }))}
                        className="px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none text-sm" />
                      <button onClick={() => setForm(f => ({ ...f, examDates: f.examDates.filter((_, j) => j !== i) }))} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={addExamDate} className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add exam</button>
                </div>
              </div>

              {/* Sports/Work */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Sports / Activities Schedule</label>
                  <input value={form.sportsSchedule} onChange={e => setForm(f => ({ ...f, sportsSchedule: e.target.value }))} placeholder="e.g. Football Tue/Thu 6pm"
                    className="input text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Work Schedule</label>
                  <input value={form.workSchedule} onChange={e => setForm(f => ({ ...f, workSchedule: e.target.value }))} placeholder="e.g. Sat 9am-5pm"
                    className="input text-sm" />
                </div>
              </div>

              {generateError && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{generateError}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleGenerate} disabled={isGenerating || form.subjects.length === 0}
                className={cn('flex-1 py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all',
                  isGenerating || form.subjects.length === 0 ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-primary-600 to-accent-500 hover:shadow-xl hover:shadow-primary-500/30')}>
                {isGenerating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Building your plan...</> : <><Sparkles className="w-5 h-5" />Generate My Plan</>}
              </button>
              <button onClick={() => setShowSetup(false)} className="px-5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}






