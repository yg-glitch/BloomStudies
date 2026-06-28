'use client'

import { useState, useRef } from 'react'
import {
  FileCheck, Upload, Sparkles, ChevronDown, Trophy,
  TrendingUp, AlertCircle, CheckCircle, XCircle,
  BookOpen, Star, ArrowRight, RotateCcw, Download,
  BarChart3, Target, Brain, BookMarked, Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer'
import { useToast } from '@/components/ui/Toast'
import { useLocalStorage } from '@/lib/useLocalStorage'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, AreaChart, Area
} from 'recharts'

interface GraderResult {
  estimatedGrade: string
  estimatedMarks: number
  maxMarks: number
  percentageScore: number
  bloomScore: number
  examinerFeedback: string
  strengths: string[]
  weaknesses: string[]
  areasToImprove: string[]
  suggestedAnswer: string
  missingKeyPoints: string[]
  scores: {
    vocabulary: number
    structure: number
    knowledge: number
    evaluation: number
    criticalThinking: number
  }
  markingSchemeAlignment: string[]
}

interface Submission {
  id: string
  subject: string
  question: string
  studentAnswer: string
  result: GraderResult
  timestamp: Date
  educationSystem: string
  level: string
}

const SUBJECTS = [
  'Mathematics', 'English', 'Irish', 'Physics', 'Chemistry',
  'Biology', 'History', 'Geography', 'Business', 'Economics',
  'French', 'German', 'Spanish', 'Music', 'Art', 'Computer Science',
  'Agricultural Science', 'Home Economics',
]

const GRADE_COLORS: Record<string, string> = {
  H1: 'from-emerald-500 to-green-600', H2: 'from-green-500 to-teal-500',
  H3: 'from-teal-500 to-cyan-500', H4: 'from-cyan-500 to-blue-500',
  H5: 'from-blue-500 to-indigo-500', H6: 'from-indigo-500 to-violet-500',
  H7: 'from-violet-500 to-purple-500', H8: 'from-purple-500 to-pink-500',
  O1: 'from-emerald-500 to-green-600', O2: 'from-green-500 to-teal-500',
  O3: 'from-teal-500 to-cyan-500', O4: 'from-cyan-500 to-blue-500',
  O5: 'from-blue-500 to-indigo-500', O6: 'from-indigo-500 to-violet-500',
  O7: 'from-violet-500 to-purple-500', O8: 'from-purple-500 to-pink-500',
  Distinction: 'from-emerald-500 to-green-600',
  'Higher Merit': 'from-green-500 to-teal-500',
  Merit: 'from-teal-500 to-cyan-500',
  Achieved: 'from-cyan-500 to-blue-500',
  'Partially Achieved': 'from-amber-500 to-orange-500',
  'Not Achieved': 'from-red-500 to-rose-600',
}

function getGradeColor(grade: string): string {
  return GRADE_COLORS[grade] || 'from-primary-500 to-accent-500'
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-700" />
          <circle cx="32" cy="32" r={r} fill="none" stroke="url(#grad)" strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000" />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-900 dark:text-white">{score}</span>
        </div>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 text-center leading-tight">{label}</span>
    </div>
  )
}

export default function ExamGraderPage() {
  const [educationSystem, setEducationSystem] = useState<'leaving-cert' | 'junior-cycle'>('leaving-cert')
  const [level, setLevel] = useState<'higher' | 'ordinary'>('higher')
  const [subject, setSubject] = useState('')
  const [question, setQuestion] = useState('')
  const [studentAnswer, setStudentAnswer] = useState('')
  const [maxMarks, setMaxMarks] = useState(100)
  const [isGrading, setIsGrading] = useState(false)
  const [result, setResult] = useState<GraderResult | null>(null)
  const [submissions, setSubmissions, , submissionsLoaded] = useLocalStorage<Submission[]>('bloom-grader-submissions', [])
  const [activeTab, setActiveTab] = useState<'grade' | 'history' | 'progress'>('grade')
  const [showSuggestedAnswer, setShowSuggestedAnswer] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const wordCount = studentAnswer.trim().split(/\s+/).filter(Boolean).length

  const { success: toastSuccess, error: toastError, xp: toastXP, achievement: toastAchievement } = useToast()

  const handleGrade = async () => {
    if (!subject || !question.trim() || !studentAnswer.trim()) {
      setError('Please fill in subject, question, and your answer.')
      return
    }
    setError('')
    setIsGrading(true)
    setResult(null)
    setShowSuggestedAnswer(false)

    try {
      const response = await fetch('/api/ai/grader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, educationSystem, level, question, studentAnswer, maxMarks }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to grade')

      setResult(data)
      const submission: Submission = {
        id: Date.now().toString(),
        subject, question, studentAnswer,
        result: data, timestamp: new Date(),
        educationSystem, level,
      }
      setSubmissions(prev => [submission, ...prev])

      // Toast feedback based on grade
      const grade = data.estimatedGrade
      if (grade === 'H1' || grade === 'O1' || grade === 'Distinction') {
        toastAchievement(`${grade} — Outstanding!`, '🌟')
        toastXP(150, `${grade} grade in ${subject}`)
      } else if (grade === 'H2' || grade === 'O2' || grade === 'Higher Merit') {
        toastSuccess(`${grade} in ${subject}!`, `${data.percentageScore}% — Excellent work`)
        toastXP(100, `Graded ${subject}`)
      } else {
        toastSuccess('Answer graded', `${grade} · ${data.percentageScore}% · ${data.estimatedMarks}/${data.maxMarks} marks`)
        toastXP(50, `Graded ${subject}`)
      }

      // First submission achievement
      if (submissions.length === 0) {
        setTimeout(() => toastAchievement('First Grading', '✍️'), 1500)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to grade answer. Please try again.')
      toastError('Grading failed', 'Please try again in a moment')
    } finally {
      setIsGrading(false)
    }
  }

  const radarData = result ? [
    { subject: 'Knowledge', score: result.scores.knowledge },
    { subject: 'Vocabulary', score: result.scores.vocabulary },
    { subject: 'Structure', score: result.scores.structure },
    { subject: 'Evaluation', score: result.scores.evaluation },
    { subject: 'Critical Thinking', score: result.scores.criticalThinking },
  ] : []

  const progressData = submissions.slice().reverse().map((s, i) => ({
    attempt: `Attempt ${i + 1}`,
    score: s.result.percentageScore,
    bloom: s.result.bloomScore,
    subject: s.subject,
  }))

  return (
    <div className="page-container py-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="section-heading flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <FileCheck className="w-6 h-6 text-white" />
          </div>
          Bloom Exam Grader
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">AI-powered grading aligned to SEC marking schemes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 w-fit">
        {(['grade', 'history', 'progress'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all',
              activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}>
            {tab === 'grade' ? '📝 Grade Answer' : tab === 'history' ? '📚 History' : '📈 Progress'}
          </button>
        ))}
      </div>

      {activeTab === 'grade' && (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-primary-500" /> Exam Setup</h2>

              {/* Education System */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Exam Type</label>
                <div className="flex rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                  {(['leaving-cert', 'junior-cycle'] as const).map(sys => (
                    <button key={sys} onClick={() => setEducationSystem(sys)}
                      className={cn('flex-1 py-2.5 text-sm font-medium transition-colors', educationSystem === sys ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}>
                      {sys === 'leaving-cert' ? 'Leaving Cert' : 'Junior Cycle'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level */}
              {educationSystem === 'leaving-cert' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Level</label>
                  <div className="flex rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                    {(['higher', 'ordinary'] as const).map(l => (
                      <button key={l} onClick={() => setLevel(l)}
                        className={cn('flex-1 py-2.5 text-sm font-medium capitalize transition-colors', level === l ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}>
                        {l} Level
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none transition-colors text-sm">
                  <option value="">Select subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Max Marks */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Max Marks</label>
                <input type="number" value={maxMarks} onChange={e => setMaxMarks(Number(e.target.value))} min={1} max={500}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none transition-colors text-sm" />
              </div>
            </div>

            {/* Question */}
            <div className="p-5 rounded-2xl card">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Exam Question</label>
              <textarea value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="Paste the exam question here..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-primary-500 focus:outline-none transition-colors resize-none text-sm" />
            </div>
          </div>

          {/* Answer + Results */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-5 rounded-2xl card">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Your Answer</label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{wordCount} words</span>
                  <input ref={fileInputRef} type="file" accept=".txt,.pdf" className="hidden" onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.type === 'text/plain') {
                      const text = await file.text()
                      setStudentAnswer(text)
                    } else if (file.type === 'application/pdf') {
                      try {
                        const fd = new FormData()
                        fd.append('file', file)
                        const res = await fetch('/api/parse-pdf', { method: 'POST', body: fd })
                        if (res.ok) {
                          const { text } = await res.json()
                          setStudentAnswer(text)
                        } else {
                          setError('Could not extract text from PDF. Try copying and pasting your answer instead.')
                        }
                      } catch {
                        setError('Failed to parse PDF.')
                      }
                    }
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }} />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    <Upload className="w-3 h-3" /> Upload
                  </button>
                </div>
              </div>
              <textarea value={studentAnswer} onChange={e => setStudentAnswer(e.target.value)}
                placeholder="Type or paste your exam answer here..."
                rows={14}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-primary-500 focus:outline-none transition-colors resize-none text-sm" />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button onClick={handleGrade} disabled={isGrading || !subject || !question.trim() || !studentAnswer.trim()}
              className={cn('w-full py-4 rounded-xl font-semibold text-lg text-white flex items-center justify-center gap-3 transition-all',
                isGrading || !subject || !question.trim() || !studentAnswer.trim()
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-accent-500 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.01]'
              )}>
              {isGrading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analysing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Grade My Answer
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {activeTab === 'grade' && result && (
        <div className="mt-6 space-y-6 animate-fade-in-up">
          {/* Grade Hero */}
          <div className={cn('p-6 rounded-2xl bg-gradient-to-br text-white shadow-2xl', getGradeColor(result.estimatedGrade))}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="text-center sm:text-left">
                <div className="text-7xl font-display font-black leading-none">{result.estimatedGrade}</div>
                <div className="text-2xl font-semibold opacity-90 mt-1">{result.estimatedMarks} / {result.maxMarks} marks</div>
                <div className="opacity-75 mt-1">{result.percentageScore}% — {subject} {level === 'higher' ? 'Higher Level' : 'Ordinary Level'}</div>
              </div>
              <div className="flex-1 flex flex-wrap gap-4 justify-center sm:justify-end">
                <ScoreRing score={result.scores.knowledge} label="Knowledge" color="text-green-300" />
                <ScoreRing score={result.scores.vocabulary} label="Vocabulary" color="text-blue-300" />
                <ScoreRing score={result.scores.structure} label="Structure" color="text-purple-300" />
                <ScoreRing score={result.scores.evaluation} label="Evaluation" color="text-orange-300" />
                <ScoreRing score={result.scores.criticalThinking} label="Critical Thinking" color="text-pink-300" />
              </div>
            </div>
            {/* Bloom Score */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium opacity-90 flex items-center gap-1.5"><Star className="w-4 h-4" /> Bloom Score</span>
                <span className="font-bold text-xl">{result.bloomScore}/100</span>
              </div>
              <div className="h-3 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${result.bloomScore}%` }} />
              </div>
            </div>
          </div>

          {/* Radar + Feedback */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Radar chart */}
            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary-500" /> Skills Radar
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Examiner Feedback */}
            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-primary-500" /> Examiner Feedback
              </h3>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed overflow-y-auto max-h-56">
                <MarkdownRenderer content={result.examinerFeedback} />
              </div>
            </div>
          </div>

          {/* Strengths / Weaknesses / Improvements */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Strengths
              </h3>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" /> Weaknesses
              </h3>
              <ul className="space-y-2">
                {result.weaknesses.map((w, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-red-500 mt-0.5 shrink-0">✗</span>{w}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5 rounded-2xl card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-amber-500" /> Improve
              </h3>
              <ul className="space-y-2">
                {result.areasToImprove.map((a, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-amber-500 mt-0.5 shrink-0">→</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Missing Key Points */}
          <div className="p-5 rounded-2xl card">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Missing Key Points
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.missingKeyPoints.map((p, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Marking Scheme Alignment */}
          <div className="p-5 rounded-2xl card">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-500" /> Marking Scheme Points Addressed
            </h3>
            <div className="space-y-2">
              {result.markingSchemeAlignment.map((p, i) => (
                <div key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-primary-500 mt-0.5 shrink-0">✓</span>{p}
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Answer */}
          <div className="p-5 rounded-2xl card">
            <button onClick={() => setShowSuggestedAnswer(!showSuggestedAnswer)}
              className="w-full flex items-center justify-between text-left">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" /> Model Answer (Full Marks)
              </h3>
              <span className="text-sm text-primary-600 dark:text-primary-400">
                {showSuggestedAnswer ? 'Hide' : 'Reveal'} →
              </span>
            </button>
            {showSuggestedAnswer && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-primary-200 dark:border-primary-700 text-sm animate-fade-in">
                <MarkdownRenderer content={result.suggestedAnswer} />
              </div>
            )}
          </div>

          <button onClick={() => { setResult(null); setStudentAnswer(''); setQuestion('') }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <RotateCcw className="w-4 h-4" /> Grade Another Answer
          </button>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {submissions.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => setSubmissions([])}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Clear History
              </button>
            </div>
          )}
          {submissions.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-600">
              <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No submissions yet. Grade your first answer!</p>
            </div>
          ) : (
            submissions.map(sub => (
              <div key={sub.id} className="p-5 rounded-2xl card hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <div className={cn('w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 text-white font-display font-bold text-lg', getGradeColor(sub.result.estimatedGrade))}>
                    {sub.result.estimatedGrade}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-white">{sub.subject}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{sub.educationSystem === 'leaving-cert' ? 'LC' : 'JC'} {sub.level === 'higher' ? 'HL' : 'OL'}</span>
                      <span className="text-xs text-slate-400 ml-auto">{new Date(sub.timestamp).toLocaleDateString('en-IE')}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{sub.question}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">{sub.result.estimatedMarks}/{sub.result.maxMarks} marks</span>
                      <span className="text-sm text-slate-500">⭐ Bloom: {sub.result.bloomScore}/100</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PROGRESS TAB */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {progressData.length < 2 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-600">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Submit at least 2 answers to see your progress chart.</p>
            </div>
          ) : (
            <>
              <div className="p-5 rounded-2xl card">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-500" /> Score Progress Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={progressData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="bloomGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="attempt" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }} />
                    <Legend />
                    <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5} fill="url(#scoreGrad)" name="Score %" dot={{ r: 5, fill: '#22c55e' }} />
                    <Area type="monotone" dataKey="bloom" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#bloomGrad)" name="Bloom Score" dot={{ r: 5, fill: '#0ea5e9' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl card text-center">
                  <div className="text-3xl font-display font-bold text-gradient mb-1">
                    {Math.round(progressData.reduce((a, b) => a + b.score, 0) / progressData.length)}%
                  </div>
                  <div className="text-sm text-slate-500">Average Score</div>
                </div>
                <div className="p-5 rounded-2xl card text-center">
                  <div className="text-3xl font-display font-bold text-gradient mb-1">
                    {Math.max(...progressData.map(d => d.score))}%
                  </div>
                  <div className="text-sm text-slate-500">Best Score</div>
                </div>
                <div className="p-5 rounded-2xl card text-center">
                  <div className="text-3xl font-display font-bold text-gradient mb-1">
                    {progressData.length}
                  </div>
                  <div className="text-sm text-slate-500">Total Attempts</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}






