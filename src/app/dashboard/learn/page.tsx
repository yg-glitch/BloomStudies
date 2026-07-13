'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen, Search, Star, Clock, Eye, Heart, Bookmark, Sparkles,
  Check, ArrowLeft, PauseCircle, PlayCircle, SkipForward, SkipBack
} from 'lucide-react'
import { cn } from '@/lib/utils'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer'
import { useLocalStorage } from '@/lib/useLocalStorage'
import { useToast } from '@/components/ui/Toast'
import { getLearningResources } from '@/lib/database/learning-resources'

export const dynamic = 'force-dynamic'

// ── Types ──────────────────────────────────────────────────────
type ContentType = 'video' | 'article' | 'notes' | 'guide' | 'podcast' | 'flashcards' | 'quiz' | 'sample-answer' | 'marking-scheme'
type ContentCategory = 'all' | 'leaving-cert' | 'junior-cycle' | 'study-skills' | 'exam-technique' | 'cao' | 'wellbeing' | 'ai-tips' | 'college'

interface Resource {
  id: string; type: ContentType; title: string; description: string | null
  subject: string; level: 'higher' | 'ordinary' | 'all' | 'Leaving Cert' | 'Junior Cycle' | 'Both'
  category: 'all' | 'leaving-cert' | 'junior-cycle' | 'study-skills' | 'exam-technique' | 'cao' | 'wellbeing' | 'ai-tips' | 'college'
  topics?: string[] | null; tags?: string[]
  duration?: number | null; views: number; likes: number
  rating: number; ratingCount?: number; thumbnailColor?: string; thumbnail_color?: string | null
  isFree?: boolean; publishedAt?: string; wordCount?: number
  creator?: { name: string; avatar: string; verified: boolean; type: string; followers: number }
  creator_name?: string | null; creator_avatar?: string | null; creator_verified?: boolean; creator_type?: string | null; creator_followers?: number
  content?: string | null; created_at?: string
  progress?: number
}

// ── Constants ──────────────────────────────────────────────────
const CATEGORIES: { key: ContentCategory; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '🌟' },
  { key: 'leaving-cert', label: 'Leaving Cert', emoji: '🎓' },
  { key: 'junior-cycle', label: 'Junior Cycle', emoji: '📚' },
  { key: 'study-skills', label: 'Study Skills', emoji: '🧠' },
  { key: 'exam-technique', label: 'Exam Technique', emoji: '✍️' },
  { key: 'cao', label: 'CAO Guide', emoji: '🎯' },
  { key: 'college', label: 'College Prep', emoji: '🏛️' },
  { key: 'wellbeing', label: 'Wellbeing', emoji: '💚' },
  { key: 'ai-tips', label: 'AI Study Tips', emoji: '🤖' },
]

const TYPE_INFO: Record<ContentType, { label: string; emoji: string; color: string }> = {
  video: { label: 'Video', emoji: '🎬', color: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' },
  article: { label: 'Article', emoji: '📄', color: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' },
  notes: { label: 'Notes', emoji: '📝', color: 'bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400' },
  guide: { label: 'Study Guide', emoji: '📚', color: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' },
  podcast: { label: 'Podcast', emoji: '🎧', color: 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400' },
  pdf: { label: 'PDF', emoji: '📋', color: 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' },
  flashcards: { label: 'Flashcards', emoji: '🃏', color: 'bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400' },
  quiz: { label: 'Quiz', emoji: '❓', color: 'bg-cyan-100 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400' },
  'sample-answer': { label: 'Sample Answer', emoji: '✍️', color: 'bg-teal-100 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400' },
  'marking-scheme': { label: 'Marking Scheme', emoji: '🎯', color: 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400' },
} as any

const GRADIENTS = [
  'from-violet-500 to-purple-600', 'from-fuchsia-500 to-pink-600',
  'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-500', 'from-cyan-500 to-blue-500',
  'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600',
]

const CREATORS = [
  { name: 'Ms. Patricia Ryan', avatar: '👩‍🏫', verified: true, type: 'teacher', followers: 4230 },
  { name: 'Mr. Seán Walsh', avatar: '👨‍🏫', verified: true, type: 'teacher', followers: 3180 },
  { name: 'Dr. Aoife Ní Bhriain', avatar: '👩‍🔬', verified: true, type: 'tutor', followers: 2940 },
  { name: 'Bloom Studies', avatar: '🌸', verified: true, type: 'bloom', followers: 18500 },
]

const MOCK_RESOURCES: Resource[] = [
  { id: 'r1', type: 'video', title: 'How to Write a Perfect Leaving Cert English Essay', description: 'Step-by-step walkthrough of the H1 essay structure with live annotation of a top student answer.', subject: 'English', level: 'Leaving Cert', category: 'leaving-cert', tags: ['english', 'essay', 'h1'], duration: 28, views: 12400, likes: 892, rating: 4.9, ratingCount: 234, thumbnailColor: GRADIENTS[0], isFree: true, publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(), creator: CREATORS[0], progress: 45 },
  { id: 'r2', type: 'notes', title: 'Complete Calculus Notes — Higher Level Leaving Cert', description: 'All differentiation and integration topics with worked examples, common mistakes, and exam tips.', subject: 'Mathematics', level: 'Leaving Cert', category: 'leaving-cert', tags: ['maths', 'calculus', 'higher'], wordCount: 4200, views: 8930, likes: 674, rating: 4.8, ratingCount: 189, thumbnailColor: GRADIENTS[2], isFree: true, publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(), creator: CREATORS[1] },
  { id: 'r3', type: 'guide', title: 'Cell Biology Mastery Guide — Everything for Paper 1', description: 'The definitive resource for Leaving Cert Biology Cell Biology. Covers all mandatory experiments and exam questions.', subject: 'Biology', level: 'Leaving Cert', category: 'leaving-cert', tags: ['biology', 'cells', 'revision'], wordCount: 6100, views: 7420, likes: 543, rating: 4.9, ratingCount: 156, thumbnailColor: GRADIENTS[3], isFree: true, publishedAt: new Date(Date.now() - 14 * 86400000).toISOString(), creator: CREATORS[2] },
  { id: 'r4', type: 'article', title: '10 Study Techniques Backed by Science', description: 'Stop wasting time on ineffective study. Evidence-based techniques that transform your revision sessions.', subject: 'Study Skills', level: 'Both', category: 'study-skills', tags: ['study-skills', 'productivity', 'tips'], wordCount: 2800, views: 23100, likes: 1890, rating: 5.0, ratingCount: 467, thumbnailColor: GRADIENTS[5], isFree: true, publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(), creator: CREATORS[3] },
  { id: 'r5', type: 'sample-answer', title: 'H1 Shakespeare Sample Answer — Hamlet', description: 'Full annotated H1 answer for the Hamlet single text question with examiner commentary.', subject: 'English', level: 'Leaving Cert', category: 'leaving-cert', tags: ['english', 'hamlet', 'sample-answer'], wordCount: 1800, views: 9870, likes: 723, rating: 4.8, ratingCount: 201, thumbnailColor: GRADIENTS[7], isFree: true, publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(), creator: CREATORS[0] },
  { id: 'r6', type: 'podcast', title: 'CAO Points Guide 2025 — Everything You Need to Know', description: 'Full breakdown of CAO points, popular courses, and how to maximise your CAO application.', subject: 'CAO Guidance', level: 'Leaving Cert', category: 'cao', tags: ['cao', 'points', '2025'], duration: 45, views: 31200, likes: 2140, rating: 4.9, ratingCount: 589, thumbnailColor: GRADIENTS[4], isFree: true, publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(), creator: CREATORS[3] },
  { id: 'r7', type: 'quiz', title: 'Leaving Cert Chemistry — Organic Chemistry Quiz', description: '20 exam-style questions on organic chemistry with full model answers and mark schemes.', subject: 'Chemistry', level: 'Leaving Cert', category: 'leaving-cert', tags: ['chemistry', 'organic', 'quiz'], views: 5600, likes: 412, rating: 4.7, ratingCount: 98, thumbnailColor: GRADIENTS[6], isFree: true, publishedAt: new Date(Date.now() - 8 * 86400000).toISOString(), creator: CREATORS[2] },
  { id: 'r8', type: 'guide', title: 'Managing Exam Stress & Study Anxiety', description: 'Practical, science-backed strategies for managing exam pressure and staying mentally strong.', subject: 'Wellbeing', level: 'Both', category: 'wellbeing', tags: ['mental-health', 'stress', 'exams'], wordCount: 3100, views: 18500, likes: 1560, rating: 4.9, ratingCount: 342, thumbnailColor: GRADIENTS[3], isFree: true, publishedAt: new Date(Date.now() - 4 * 86400000).toISOString(), creator: CREATORS[3] },
]

export default function AcademyPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const dbResources = await getLearningResources()
        const formatted = dbResources.map((r: any) => ({
          id: r.id,
          type: r.type as ContentType,
          title: r.title,
          description: r.description || '',
          subject: r.subject,
          level: (r.level === 'higher' ? 'Leaving Cert' : r.level === 'ordinary' ? 'Junior Cycle' : 'Both') as "Junior Cycle" | "Leaving Cert" | "Both",
          category: (r.category === 'all' ? 'study-skills' : r.category) as Resource['category'],
          tags: r.topics || [],
          duration: r.duration || undefined,
          views: r.views,
          likes: r.likes,
          rating: r.rating,
          ratingCount: 0,
          thumbnailColor: r.thumbnail_color || 'from-violet-500 to-purple-600',
          isFree: true,
          publishedAt: r.created_at,
          creator: {
            name: r.creator_name || 'Bloom Studies',
            avatar: r.creator_avatar || '🌸',
            verified: r.creator_verified || false,
            type: r.creator_type || 'bloom',
            followers: r.creator_followers || 0
          },
          content: r.content || undefined
        }))
        setResources(formatted)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const [category, setCategory] = useState<ContentCategory>('all')
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [activeResource, setActiveResource] = useState<Resource | null>(null)
  const [bookmarks, setBookmarks] = useLocalStorage<string[]>('bloom-academy-bookmarks', [])
  const [watchHistory, setWatchHistory] = useLocalStorage<Record<string, number>>('bloom-watch-progress', {})
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [aiResult, setAiResult] = useState('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiAction, setAiAction] = useState('')
  const [activeTab, setActiveTab] = useState<'discover' | 'saved' | 'continue'>('discover')
  const { xp: toastXP } = useToast()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadResources()
  }, [category, typeFilter, search])

  const loadResources = async () => {
    setIsLoading(true)
    try {
      const data = await getLearningResources({
        category: category === 'all' ? undefined : category,
        type: typeFilter === 'all' ? undefined : typeFilter,
        search: search || undefined,
      })
      setResources(data.map(r => ({
        id: r.id,
        type: r.type as ContentType,
        title: r.title,
        description: r.description,
        subject: r.subject,
        level: r.level,
        category: r.category as any,
        topics: r.topics,
        duration: r.duration,
        views: r.views,
        likes: r.likes,
        rating: r.rating,
        thumbnail_color: r.thumbnail_color || GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
        creator_name: r.creator_name,
        creator_avatar: r.creator_avatar,
        creator_verified: r.creator_verified,
        creator_type: r.creator_type,
        creator_followers: r.creator_followers,
        content: r.content,
        created_at: r.created_at,
      })))
    } catch (error) {
      // Error loading resources - handled silently
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = useMemo(() => resources.filter(r => {
    if (category !== 'all' && r.category !== category) return false
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    if (activeTab === 'saved' && !bookmarks.includes(r.id)) return false
    if (activeTab === 'continue' && (!watchHistory[r.id] || watchHistory[r.id] === 0 || watchHistory[r.id] >= 95)) return false
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.subject.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [category, typeFilter, search, bookmarks, watchHistory, activeTab, resources])

  const inProgress = useMemo(() => resources.filter(r => watchHistory[r.id] && watchHistory[r.id] > 0 && watchHistory[r.id] < 95), [resources, watchHistory])

  const openResource = (r: Resource) => {
    setActiveResource(r)
    setVideoProgress(watchHistory[r.id] || 0)
    setAiResult(''); setAiAction(''); setIsPlaying(false)
    toastXP(5, `Opened ${r.subject} resource`)
  }

  const handleAIAction = async (action: string, resource: Resource) => {
    setAiAction(action); setAiResult(''); setIsLoadingAI(true)
    const prompts: Record<string, string> = {
      summarise: `Summarise this ${resource.type} resource in 5 bullet points for an Irish student:\n\nTitle: ${resource.title}\n\nDescription: ${resource.description}`,
      flashcards: `Generate 8 exam-focused flashcard Q&A pairs from:\n\nTitle: ${resource.title}\nSubject: ${resource.subject}\nLevel: ${resource.level}`,
      quiz: `Create 5 exam-style questions with model answers from:\n\nTitle: ${resource.title}\nSubject: ${resource.subject}`,
      notes: `Create structured revision notes from:\n\nTitle: ${resource.title}\nSubject: ${resource.subject}\nDescription: ${resource.description}`,
      explain: `Explain the key concepts from this resource in simple terms for an Irish student:\n\n${resource.title} — ${resource.description}`,
    }
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompts[action] }], subject: resource.subject, level: 'higher', educationSystem: 'leaving-cert' }),
      })
      if (!res.ok) throw new Error()
      const reader = res.body?.getReader(); const decoder = new TextDecoder(); let text = ''
      if (reader) { while (true) { const { done, value } = await reader.read(); if (done) break; for (const line of decoder.decode(value).split('\n')) { if (line.startsWith('data: ') && line.slice(6) !== '[DONE]') { try { text += JSON.parse(line.slice(6)).content || '' } catch {} } } setAiResult(text) } }
    } catch { setAiResult('Failed to load AI response. Please try again.') }
    finally { setIsLoadingAI(false) }
  }

  const toggleBookmark = (id: string) => setBookmarks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id])
  const formatViews = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
  const formatDuration = (m: number | null | undefined) => m ? `${m} min` : ''

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading Academy...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading academy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in">
      {/* Sidebar */}
      <div className="w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-slate-900 dark:text-white">Academy</span>
          </div>
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            {(['discover', 'saved', 'continue'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={cn('flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all', activeTab === t ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 space-y-0.5">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setCategory(cat.key)} className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all text-left', category === cat.key ? 'bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              <span>{cat.emoji}</span><span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        {activeResource ? (
          // ── Resource detail view ──────────────────────────
          <div className="max-w-4xl mx-auto px-4 py-6">
            <button onClick={() => setActiveResource(null)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 mb-5 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Academy
            </button>

            {/* Thumbnail / player */}
            <div className={cn('relative rounded-2xl overflow-hidden mb-6 aspect-video bg-gradient-to-br flex items-center justify-center text-white', activeResource.thumbnail_color)}>
              <div className="text-center">
                <div className="text-6xl mb-3">{(TYPE_INFO as any)[activeResource.type]?.emoji}</div>
                {activeResource.type === 'video' && (
                  <>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:scale-105">
                      {isPlaying ? <PauseCircle className="w-10 h-10" /> : <PlayCircle className="w-10 h-10" />}
                    </button>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="h-1.5 rounded-full bg-white/30 cursor-pointer" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); const p = ((e.clientX - r.left) / r.width) * 100; setVideoProgress(p); setWatchHistory(prev => ({ ...prev, [activeResource.id]: p })) }}>
                        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-white/70">
                        <div className="flex gap-2"><SkipBack className="w-4 h-4 cursor-pointer" /><SkipForward className="w-4 h-4 cursor-pointer" /></div>
                        <span>{formatDuration(activeResource.duration || null)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <span className={cn('badge text-xs mb-2 inline-flex', (TYPE_INFO as any)[activeResource.type]?.color)}>{(TYPE_INFO as any)[activeResource.type]?.emoji} {(TYPE_INFO as any)[activeResource.type]?.label}</span>
                <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">{activeResource.title}</h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{activeResource.description || ''}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{formatViews(activeResource.views)}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" />{activeResource.rating}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{activeResource.likes}</span>
                  {activeResource.duration && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(activeResource.duration)}</span>}
                </div>
              </div>
              <button onClick={() => toggleBookmark(activeResource.id)} className={cn('p-3 rounded-xl border-2 transition-all shrink-0', bookmarks.includes(activeResource.id) ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary-400')}>
                <Bookmark className={cn('w-5 h-5', bookmarks.includes(activeResource.id) && 'fill-current')} />
              </button>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 p-4 rounded-xl card mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl shrink-0">{activeResource.creator_avatar || '👤'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="font-semibold text-slate-900 dark:text-white text-sm">{activeResource.creator_name || 'Unknown'}</span>{activeResource.creator_verified && <Check className="w-4 h-4 text-primary-500" />}<span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 capitalize">{activeResource.creator_type || 'creator'}</span></div>
                <p className="text-xs text-slate-500 mt-0.5">{((activeResource.creator_followers || 0) / 1000).toFixed(1)}k followers</p>
              </div>
            </div>

            {/* Bloom AI panel */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-200 dark:border-primary-800 mb-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4 text-primary-500" /> Bloom AI — Learn Smarter</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {[{ action: 'summarise', label: '📝 Summarise' }, { action: 'flashcards', label: '🃏 Flashcards' }, { action: 'quiz', label: '❓ Quiz' }, { action: 'notes', label: '📋 Notes' }, { action: 'explain', label: '💡 Explain' }].map(({ action, label }) => (
                  <button key={action} onClick={() => handleAIAction(action, activeResource)} disabled={isLoadingAI}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all disabled:opacity-50', aiAction === action && aiResult ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-400')}>
                    {isLoadingAI && aiAction === action ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : label}
                  </button>
                ))}
              </div>
              {aiResult && <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 max-h-80 overflow-y-auto text-sm"><MarkdownRenderer content={aiResult} /></div>}
            </div>

            {/* Article content */}
            {(['article', 'notes', 'guide', 'sample-answer'] as ContentType[]).includes(activeResource.type) && (
              <div className="p-6 rounded-2xl card">
                <MarkdownRenderer content={activeResource.content || `# ${activeResource.title}\n\n${activeResource.description || ''}\n\n*Full content would appear here. Connect to your database to display real content.*`} />
              </div>
            )}
          </div>
        ) : (
          // ── Resource list view ────────────────────────────
          <div className="px-4 py-6">
            <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
              <div>
                <h1 className="section-heading">
                  {activeTab === 'discover' ? `${CATEGORIES.find(c => c.key === category)?.emoji || '🌟'} ${CATEGORIES.find(c => c.key === category)?.label || 'Discover'}` : activeTab === 'saved' ? '🔖 Saved' : '▶️ Continue Watching'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Ireland&apos;s best free educational resources</p>
              </div>
            </div>

            {/* Search + type filter */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects, teachers, topics…" className="input pl-10 text-sm" />
              </div>
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {(['all', 'video', 'article', 'notes', 'guide', 'podcast', 'quiz'] as const).map(f => (
                  <button key={f} onClick={() => setTypeFilter(f as any)} className={cn('px-3 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all shrink-0', typeFilter === f ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700')}>
                    {f === 'all' ? '🌟 All' : `${(TYPE_INFO as any)[f]?.emoji || ''} ${(TYPE_INFO as any)[f]?.label || f}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Continue watching strip */}
            {activeTab === 'discover' && inProgress.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-primary-500" /> Continue Watching</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {inProgress.map(r => (
                    <div key={r.id} onClick={() => openResource(r)} className="shrink-0 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
                      <div className={cn('h-20 bg-gradient-to-br flex items-center justify-center text-3xl', r.thumbnail_color)}>{(TYPE_INFO as any)[r.type]?.emoji}</div>
                      <div className="h-1 bg-slate-200 dark:bg-slate-700"><div className="h-full bg-primary-500" style={{ width: `${watchHistory[r.id]}%` }} /></div>
                      <div className="p-2"><p className="text-xs font-medium text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400">{r.title}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{activeTab === 'saved' ? 'No saved resources yet.' : 'No resources found.'}</p></div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
                {filtered.map(r => (
                  <div key={r.id} onClick={() => openResource(r)} className="group card card-hover cursor-pointer overflow-hidden flex flex-col animate-fade-in-up">
                    <div className={cn('relative h-32 bg-gradient-to-br flex items-center justify-center text-4xl', r.thumbnail_color)}>
                      {(TYPE_INFO as any)[r.type]?.emoji}
                      <button onClick={e => { e.stopPropagation(); toggleBookmark(r.id) }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors">
                        <Bookmark className={cn('w-3.5 h-3.5', bookmarks.includes(r.id) && 'fill-current')} />
                      </button>
                      {r.duration && <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/50 text-white text-xs">{formatDuration(r.duration)}</div>}
                      {watchHistory[r.id] > 0 && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20"><div className="h-full bg-white" style={{ width: `${watchHistory[r.id]}%` }} /></div>}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <span className={cn('badge text-[11px] mb-1.5 w-fit', (TYPE_INFO as any)[r.type]?.color)}>{(TYPE_INFO as any)[r.type]?.label}</span>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-1">{r.title}</h3>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[11px] shrink-0">{r.creator_avatar || '👤'}</div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.creator_name || 'Unknown'}</span>
                        {r.creator_verified && <Check className="w-3 h-3 text-primary-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatViews(r.views)}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{r.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

