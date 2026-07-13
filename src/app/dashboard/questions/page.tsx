'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText, Search, Filter, X, BookOpen, Clock,
  Star, Bookmark, ChevronRight, Sparkles, Calendar,
  Tag, Target, Brain
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import {
  getSubjects,
  getTopics,
  getExamQuestions,
  getQuestionYears,
  type Subject,
  type Topic,
  type ExamQuestion
} from '@/lib/database/exam-questions'

export const dynamic = 'force-dynamic'

const LEVELS = ['All', 'Higher', 'Ordinary', 'Common']
const DIFFICULTIES = ['All', 'easy', 'medium', 'hard']

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'from-violet-500 to-purple-600',
  English: 'from-blue-500 to-indigo-600',
  Irish: 'from-emerald-500 to-teal-600',
  Biology: 'from-green-500 to-emerald-600',
  Chemistry: 'from-orange-500 to-red-500',
  Physics: 'from-cyan-500 to-blue-600',
  History: 'from-amber-500 to-orange-500',
  Geography: 'from-teal-500 to-cyan-600',
  Business: 'from-fuchsia-500 to-pink-600',
  Economics: 'from-rose-500 to-pink-600',
  default: 'from-primary-500 to-accent-500',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400',
  hard: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400',
}

export default function TopicQuestionsPage() {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('All')
  const [topic, setTopic] = useState('All')
  const [year, setYear] = useState('All')
  const [level, setLevel] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [years, setYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState<ExamQuestion | null>(null)
  const [aiResult, setAiResult] = useState('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiAction, setAiAction] = useState('')
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())

  // Load data from Supabase
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData()
  }, [subject, topic, year, level, difficulty])

  const loadData = async () => {
    setLoading(true)
    try {
      const [questionsData, subjectsData, topicsData, yearsData] = await Promise.all([
        getExamQuestions({
          subjectId: subject === 'All' ? undefined : subject,
          topicId: topic === 'All' ? undefined : topic,
          year: year === 'All' ? undefined : parseInt(year),
          level: level === 'All' ? undefined : level as any,
          difficulty: difficulty === 'All' ? undefined : difficulty as any,
        }),
        getSubjects('leaving-cert'),
        subject === 'All' ? getTopics() : getTopics(subject),
        getQuestionYears(),
      ])
      setQuestions(questionsData)
      setSubjects(subjectsData)
      setTopics(topicsData)
      setYears(yearsData)
    } catch (error) {
      // Error loading data - handled silently
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => questions.filter(q =>
    (!search || q.question_text.toLowerCase().includes(search.toLowerCase()) || q.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())))
  ), [search, questions])

  const activeFilters = [subject, topic, year, level, difficulty].filter(f => f !== 'All').length
  const clearFilters = () => {
    setSubject('All')
    setTopic('All')
    setYear('All')
    setLevel('All')
    setDifficulty('All')
    setSearch('')
  }

  const handleAIAction = async (action: string, question: ExamQuestion) => {
    setAiAction(action)
    setAiResult('')
    setIsLoadingAI(true)
    setSelectedQuestion(question)

    const prompts: Record<string, string> = {
      explain: `Explain this exam question in simple terms for an Irish student:\n\nSubject: ${subjects.find(s => s.id === question.subject_id)?.display_name}\nLevel: ${question.level}\nYear: ${question.year}\n\nQuestion: ${question.question_text}\n\nMarks: ${question.marks_available}`,
      marking: `Explain the marking scheme for this question:\n\n${question.question_text}\n\nWhat key points would examiners look for?`,
      mistakes: `What are common mistakes students make on questions like this:\n\n${question.question_text}`,
      tips: `Give exam answering tips for this type of question:\n\n${question.question_text}`,
      similar: `Generate 2 similar practice questions to this one:\n\n${question.question_text}`,
      flashcards: `Generate 5 flashcard Q&A pairs from this question:\n\n${question.question_text}`,
      quiz: `Create a 3-question quiz based on this topic:\n\n${question.question_text}`,
      summarize: `Summarize the key concepts tested in this question:\n\n${question.question_text}`,
    }

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompts[action] }],
          subject: subjects.find(s => s.id === question.subject_id)?.display_name || 'General',
          level: question.level,
          educationSystem: 'leaving-cert',
        }),
      })

      if (!res.ok) throw new Error()

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let text = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          for (const line of decoder.decode(value).split('\n')) {
            if (line.startsWith('data: ') && line.slice(6) !== '[DONE]') {
              try {
                text += JSON.parse(line.slice(6)).content || ''
              } catch {}
            }
          }
          setAiResult(text)
        }
      }
    } catch {
      setAiResult('Failed to load AI response. Please try again.')
    } finally {
      setIsLoadingAI(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="section-heading flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            Topic Questions
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Browse exam questions by topic · {questions.length} questions available</p>
        </div>
        <Link href="/dashboard/papers" className="btn-secondary text-sm shrink-0">
          <FileText className="w-4 h-4" />
          View Past Papers
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions or topics…"
            aria-label="Search questions"
            className="input pl-10 text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          className={cn('btn-secondary text-sm gap-2 relative', activeFilters > 0 && 'border-primary-400 dark:border-primary-600')}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilters > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
        {activeFilters > 0 && (
          <button onClick={clearFilters} className="btn-ghost text-sm text-slate-500 gap-1.5">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-fade-in-down">
          {[
            { label: 'Subject', value: subject, onChange: setSubject, options: ['All', ...subjects.map(s => s.display_name)] },
            { label: 'Topic', value: topic, onChange: setTopic, options: ['All', ...topics.map(t => t.name)] },
            { label: 'Year', value: year, onChange: setYear, options: ['All', ...years.map(y => y.toString())] },
            { label: 'Level', value: level, onChange: setLevel, options: LEVELS },
            { label: 'Difficulty', value: difficulty, onChange: setDifficulty, options: DIFFICULTIES },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{f.label}</label>
              <select value={f.value} onChange={e => f.onChange(e.target.value)} className="input text-sm">
                {f.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-slate-400 mb-4" aria-live="polite">
        Showing {filtered.length} question{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Questions grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No questions found"
          description="Try adjusting your search or filters to find what you're looking for."
          action={{ label: 'Clear filters', onClick: clearFilters }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map(question => {
            const subjectData = subjects.find(s => s.id === question.subject_id)
            const color = SUBJECT_COLORS[subjectData?.display_name || ''] || SUBJECT_COLORS.default
            return (
              <div key={question.id} className="group card card-hover flex flex-col overflow-hidden animate-fade-in-up">
                {/* Colour band */}
                <div className={cn('h-1.5 w-full bg-gradient-to-r', color)} />
                <div className="p-5 flex flex-col flex-1">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200', color)}>
                      <FileText className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      <span className={cn(
                        'badge',
                        question.level === 'Higher'
                          ? 'bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      )}>
                        {question.level}
                      </span>
                      {question.difficulty && (
                        <span className={cn('badge', DIFFICULTY_COLORS[question.difficulty])}>
                          {question.difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subject + year */}
                  <h3 className="font-display font-bold text-slate-900 dark:text-white mb-0.5">{subjectData?.display_name || 'Subject'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    {question.year} · Paper {question.paper_number} · Q{question.question_number}{question.part_number && question.part_number}
                  </p>

                  {/* Question preview */}
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-3 flex-1">
                    {question.question_text}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                      {question.marks_available || 'N/A'} marks
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {question.question_type || 'Standard'}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {question.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <button
                      onClick={() => setSelectedQuestion(question)}
                      className="btn-secondary text-xs justify-center gap-1.5 py-2.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      View Question
                    </button>
                    <button
                      onClick={() => handleAIAction('explain', question)}
                      className="btn-primary text-xs justify-center gap-1.5 py-2.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      AI Explain
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Question detail modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedQuestion.year} {selectedQuestion.level} Paper {selectedQuestion.paper_number} Q{selectedQuestion.question_number}
                </h2>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="prose dark:prose-invert mb-6">
                <p className="text-lg text-slate-700 dark:text-slate-300">{selectedQuestion.question_text}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400" />
                  {selectedQuestion.marks_available} marks
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  {selectedQuestion.difficulty}
                </span>
              </div>

              {/* AI Actions */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-200 dark:border-primary-800 mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  Bloom AI Tools
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { action: 'explain', label: '💡 Explain' },
                    { action: 'marking', label: '📝 Marking Scheme' },
                    { action: 'mistakes', label: '⚠️ Common Mistakes' },
                    { action: 'tips', label: '✨ Exam Tips' },
                    { action: 'similar', label: '🔄 Similar Questions' },
                    { action: 'flashcards', label: '🃏 Flashcards' },
                    { action: 'quiz', label: '❓ Quiz' },
                    { action: 'summarize', label: '📋 Summarize' },
                  ].map(({ action, label }) => (
                    <button
                      key={action}
                      onClick={() => handleAIAction(action, selectedQuestion)}
                      disabled={isLoadingAI}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all disabled:opacity-50',
                        aiAction === action && aiResult
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-400'
                      )}
                    >
                      {isLoadingAI && aiAction === action ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        label
                      )}
                    </button>
                  ))}
                </div>
                {aiResult && (
                  <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 max-h-80 overflow-y-auto text-sm prose dark:prose-invert">
                    {aiResult}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button className="btn-primary flex-1">
                  <Brain className="w-4 h-4" />
                  Practice Answer
                </button>
                <button className="btn-secondary flex-1">
                  <Bookmark className="w-4 h-4" />
                  Bookmark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
