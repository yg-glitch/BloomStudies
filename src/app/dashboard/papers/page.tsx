'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText, Download, Clock, Calendar, Search,
  ExternalLink, BookOpen, Sparkles, ChevronRight,
  GraduationCap, Filter, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { getPastPapers, getPastPaperYears, getPastPaperSubjects, type PastPaper } from '@/lib/database/past-papers'

const SUBJECTS = ['All', 'Mathematics', 'English', 'Irish', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Business', 'Economics', 'Accounting', 'French', 'German', 'Spanish', 'Computer Science', 'Agricultural Science']
const LEVELS = ['All', 'Higher', 'Ordinary']

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
  default: 'from-primary-500 to-accent-500',
}

export default function PastPapersPage() {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('All')
  const [year, setYear] = useState('All')
  const [level, setLevel] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [papers, setPapers] = useState<PastPaper[]>([])
  const [years, setYears] = useState<number[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Load papers from Supabase
  useEffect(() => {
    loadPapers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, year, level])

  const loadPapers = async () => {
    setLoading(true)
    try {
      const [papersData, yearsData, subjectsData] = await Promise.all([
        getPastPapers({
          subject: subject === 'All' ? undefined : subject,
          year: year === 'All' ? undefined : parseInt(year),
          level: level === 'All' ? undefined : level as 'Higher' | 'Ordinary',
        }),
        getPastPaperYears(),
        getPastPaperSubjects(),
      ])
      setPapers(papersData)
      setYears(yearsData)
      setSubjects(subjectsData)
    } catch (error) {
      console.error('Error loading papers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => papers.filter(p =>
    (!search || p.subject.toLowerCase().includes(search.toLowerCase()) || p.topics?.some(t => t.toLowerCase().includes(search.toLowerCase())))
  ), [search, papers])

  const activeFilters = [subject, year, level].filter(f => f !== 'All').length
  const clearFilters = () => { setSubject('All'); setYear('All'); setLevel('All'); setSearch('') }

  return (
    <div className="page-container py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="section-heading flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            Past Papers
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Practice with real SEC exam papers · {papers.length} papers available</p>
        </div>
        <Link href="/dashboard/grader" className="btn-primary text-sm shrink-0">
          <Sparkles className="w-4 h-4" />
          Grade My Answer
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
            placeholder="Search subjects or topics…"
            aria-label="Search papers"
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
        <div className="grid sm:grid-cols-3 gap-3 mb-5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-fade-in-down">
          {[
            { label: 'Subject', value: subject, onChange: setSubject, options: SUBJECTS },
            { label: 'Year', value: year, onChange: setYear, options: ['All', ...years.map(y => y.toString())] },
            { label: 'Level', value: level, onChange: setLevel, options: LEVELS },
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
        Showing {filtered.length} paper{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Papers grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No papers found"
          description="Try adjusting your search or filters to find what you're looking for."
          action={{ label: 'Clear filters', onClick: clearFilters }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map(paper => {
            const color = SUBJECT_COLORS[paper.subject] || SUBJECT_COLORS.default
            return (
              <div key={paper.id} className="group card card-hover flex flex-col overflow-hidden animate-fade-in-up">
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
                        paper.level === 'Higher'
                          ? 'bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      )}>
                        {paper.level}
                      </span>
                    </div>
                  </div>

                  {/* Subject + paper */}
                  <h3 className="font-display font-bold text-slate-900 dark:text-white mb-0.5">{paper.subject}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{paper.paper_number ? `Paper ${paper.paper_number}` : 'Paper'} · {paper.year}</p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{paper.duration ? `${Math.floor(paper.duration / 60)}h ${paper.duration % 60}m` : 'N/A'}</span>
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" aria-hidden="true" />{paper.question_count || 0} questions</span>
                  </div>

                  {/* Topics */}
                  <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
                    {paper.topics?.map(t => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{t}</span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <button className="btn-secondary text-xs justify-center gap-1.5 py-2.5">
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      Download
                    </button>
                    <Link href="/dashboard/grader" className="btn-primary text-xs justify-center gap-1.5 py-2.5">
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      Grade It
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-10 p-5 rounded-2xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-200/60 dark:border-primary-800/40 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Want AI feedback on your answers?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Upload your written answer and get instant SEC-aligned grading</p>
        </div>
        <Link href="/dashboard/grader" className="btn-primary shrink-0">
          Try Exam Grader <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}



