'use client'

import { useState, useRef, useEffect } from 'react'
import {
  BookOpen, Search, Play, FileText, Headphones, Layers,
  Star, Clock, Eye, Heart, Bookmark, Sparkles, Filter,
  ChevronRight, Crown, Check, TrendingUp, Users, Download,
  MessageSquare, X, ArrowLeft, Volume2, Maximize, SkipForward,
  SkipBack, PauseCircle, PlayCircle, BarChart2, Plus, Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/lib/useLocalStorage'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer'
import {
  LearnResource, Creator, ContentType, ContentCategory,
  CONTENT_TYPE_INFO, THUMBNAIL_GRADIENTS, generateMockResources
} from '@/lib/learn'

const CATEGORIES: { key: ContentCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '🌟' },
  { key: 'leaving-cert', label: 'Leaving Cert', emoji: '🎓' },
  { key: 'junior-cycle', label: 'Junior Cycle', emoji: '📚' },
  { key: 'study-skills', label: 'Study Skills', emoji: '🧠' },
  { key: 'exam-technique', label: 'Exam Technique', emoji: '✍️' },
  { key: 'cao', label: 'CAO Guide', emoji: '🎯' },
  { key: 'wellbeing', label: 'Wellbeing', emoji: '💚' },
  { key: 'ai-tips', label: 'AI Tips', emoji: '🤖' },
]

const CONTENT_FILTERS: (ContentType | 'all')[] = ['all', 'video', 'article', 'notes', 'guide', 'podcast', 'flashcards', 'quiz', 'sample-answer', 'marking-scheme']

type Tab = 'discover' | 'saved' | 'creator'

export default function BloomLearnPage() {
  const [resources, setResources] = useLocalStorage<LearnResource[]>('bloom-learn-resources', generateMockResources())
  const [category, setCategory] = useState<ContentCategory | 'all'>('all')
  const [contentFilter, setContentFilter] = useState<ContentType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('discover')
  const [activeResource, setActiveResource] = useState<LearnResource | null>(null)
  const [bookmarks, setBookmarks] = useLocalStorage<string[]>('bloom-learn-bookmarks', [])
  const [aiResult, setAiResult] = useState('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiAction, setAiAction] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [videoProgress, setVideoProgress] = useState(0)
  const [showCreatorDash, setShowCreatorDash] = useState(false)
  const [watchNotes, setWatchNotes] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [videoBookmarks, setVideoBookmarks] = useState<number[]>([])
  const [watchHistory, setWatchHistory] = useLocalStorage<Record<string, number>>('bloom-watch-progress', {})

  const filtered = resources.filter(r => {
    if (category !== 'all' && r.category !== category) return false
    if (contentFilter !== 'all' && r.type !== contentFilter) return false
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase()) && !r.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (activeTab === 'saved' && !bookmarks.includes(r.id)) return false
    return true
  })

  const handleBookmark = (id: string) => {
    setBookmarks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id])
  }

  // Resume watching from saved progress
  useEffect(() => {
    if (activeResource) {
      const saved = watchHistory[activeResource.id]
      if (saved) setVideoProgress(saved)
      else setVideoProgress(0)
      setWatchNotes(''); setShowTranscript(false); setAiResult(''); setIsPlaying(false)
    }
  }, [activeResource])

  const handleAIAction = async (action: string, resource: LearnResource) => {
    setAiAction(action); setAiResult(''); setIsLoadingAI(true)
    const prompts: Record<string, string> = {
      summarise: `Summarise this educational resource in 5 bullet points for a student:\n\nTitle: ${resource.title}\n\nDescription: ${resource.description}`,
      flashcards: `Generate 8 exam-focused flashcard Q&A pairs from this resource:\n\nTitle: ${resource.title}\nSubject: ${resource.subject}\nLevel: ${resource.level}\n\nDescription: ${resource.description}`,
      quiz: `Create 5 exam-style questions with model answers about:\n\nTitle: ${resource.title}\nSubject: ${resource.subject}\nLevel: ${resource.level}`,
      notes: `Create structured revision notes from this resource:\n\nTitle: ${resource.title}\nSubject: ${resource.subject}\nDescription: ${resource.description}`,
    }
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompts[action] }], subject: resource.subject, level: 'higher', educationSystem: 'leaving-cert' }),
      })
      if (res.ok) {
        const reader = res.body?.getReader(); const decoder = new TextDecoder(); let text = ''
        if (reader) { while (true) { const { done, value } = await reader.read(); if (done) break; const chunk = decoder.decode(value); for (const line of chunk.split('\n')) { if (line.startsWith('data: ') && line.slice(6) !== '[DONE]') { try { text += JSON.parse(line.slice(6)).content || '' } catch {} } } setAiResult(text) } }
      }
    } finally { setIsLoadingAI(false) }
  }

  const formatDuration = (mins?: number) => mins ? `${mins} min` : ''
  const formatViews = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString()

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in">
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white/50 dark:bg-slate-900/50 overflow-y-auto">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0 shadow-md shadow-primary-500/20">
              <span className="text-sm" aria-hidden="true">🌸</span>
            </div>
            <span className="font-display font-bold text-slate-900 dark:text-white">Bloom Learn</span>
          </div>
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            {(['discover', 'saved', 'creator'] as Tab[]).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all', activeTab === t ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 space-y-1">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setCategory(cat.key)}
              className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all text-left', category === cat.key ? 'bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              <span>{cat.emoji}</span>{cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {activeResource ? (
            // RESOURCE DETAIL VIEW
            <div className="max-w-4xl mx-auto px-4 py-6">
              <button onClick={() => setActiveResource(null)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Bloom Learn
              </button>

              {/* Thumbnail / Video player */}
              <div className={cn('relative rounded-2xl overflow-hidden mb-6 aspect-video bg-gradient-to-br flex items-center justify-center', activeResource.thumbnailColor, isFullscreen && 'fixed inset-0 z-50 rounded-none')}>
                <div className="text-center text-white w-full h-full flex flex-col items-center justify-center">
                  <div className="text-6xl mb-3">{CONTENT_TYPE_INFO[activeResource.type].emoji}</div>
                  {activeResource.type === 'video' && (
                    <>
                      <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:scale-105">
                        {isPlaying ? <PauseCircle className="w-10 h-10 text-white" /> : <PlayCircle className="w-10 h-10 text-white" />}
                      </button>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="h-1.5 rounded-full bg-white/30 overflow-hidden cursor-pointer relative"
                          onClick={e => { const r = e.currentTarget.getBoundingClientRect(); const p = ((e.clientX - r.left) / r.width) * 100; setVideoProgress(p); if (activeResource) setWatchHistory(prev => ({ ...prev, [activeResource.id]: p })) }}>
                          <div className="h-full bg-white transition-all" style={{ width:`${videoProgress}%` }} />
                          {videoBookmarks.map((b, i) => <div key={i} className="absolute top-0 w-1 h-full bg-amber-400" style={{ left:`${b}%` }} />)}
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-white/80">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setVideoProgress(p => Math.max(0, p - (10 / (activeResource.duration || 30) * 100)))}><SkipBack className="w-4 h-4" /></button>
                            <button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}</button>
                            <button onClick={() => setVideoProgress(p => Math.min(100, p + (10 / (activeResource.duration || 30) * 100)))}><SkipForward className="w-4 h-4" /></button>
                          </div>
                          <div className="flex items-center gap-2">
                            {[0.75, 1, 1.25, 1.5, 2].map(s => <button key={s} onClick={() => setPlaybackSpeed(s)} className={cn('text-xs', playbackSpeed === s ? 'font-bold' : 'opacity-60')}>{s}x</button>)}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setVideoBookmarks(prev => [...prev, videoProgress])} title="Bookmark" className="opacity-80 hover:opacity-100"><Bookmark className="w-4 h-4" /></button>
                            <button onClick={() => setShowTranscript(!showTranscript)} title="Transcript" className="opacity-80 hover:opacity-100"><MessageSquare className="w-4 h-4" /></button>
                            <button onClick={() => setIsFullscreen(!isFullscreen)} title="Fullscreen"><Maximize className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Transcript panel */}
              {showTranscript && (
                <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary-500" /> Transcript</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    Welcome to {activeResource.title}. In this {CONTENT_TYPE_INFO[activeResource.type].label.toLowerCase()}, we'll explore {activeResource.description.toLowerCase()}. This content is specifically designed for {activeResource.level} students preparing for Irish state exams...
                    <br /><br />
                    [Full transcript available — click on any paragraph to jump to that point in the video.]
                  </p>
                </div>
              )}

              {/* Notes while watching */}
              {activeResource.type === 'video' && (
                <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-2">📝 Notes while watching</h4>
                  <textarea value={watchNotes} onChange={e => setWatchNotes(e.target.value)} rows={3} placeholder="Jot down key points as you watch..." className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none resize-none" />
                </div>
              )}

              {/* Resource info */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', CONTENT_TYPE_INFO[activeResource.type].color)}>
                      {CONTENT_TYPE_INFO[activeResource.type].emoji} {CONTENT_TYPE_INFO[activeResource.type].label}
                    </span>
                    <span className="text-xs text-slate-500">{activeResource.level}</span>
                  </div>
                  <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">{activeResource.title}</h1>
                  <p className="text-slate-600 dark:text-slate-400">{activeResource.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{formatViews(activeResource.views)}</span>
                    <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{activeResource.likes}</span>
                    <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400" />{activeResource.rating}</span>
                    {activeResource.duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDuration(activeResource.duration)}</span>}
                  </div>
                </div>
                <button onClick={() => handleBookmark(activeResource.id)}
                  className={cn('p-3 rounded-xl border-2 transition-all', bookmarks.includes(activeResource.id) ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary-400')}>
                  <Bookmark className={cn('w-5 h-5', bookmarks.includes(activeResource.id) && 'fill-current')} />
                </button>
              </div>

              {/* Creator */}
              <div className="flex items-center gap-3 p-4 rounded-xl card mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl shrink-0">
                  {activeResource.creator.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900 dark:text-white">{activeResource.creator.name}</span>
                    {activeResource.creator.verified && <Check className="w-4 h-4 text-primary-500" />}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 capitalize">{activeResource.creator.type}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeResource.creator.bio.slice(0, 80)}...</p>
                </div>
                <div className="text-center">
                  <div className="font-bold text-slate-900 dark:text-white">{(activeResource.creator.followers / 1000).toFixed(1)}k</div>
                  <div className="text-xs text-slate-500">followers</div>
                </div>
              </div>

              {/* AI Actions */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-200 dark:border-primary-800 mb-5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary-500" /> Bloom AI — Learn Smarter
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { action: 'summarise', label: '📝 Summarise', },
                    { action: 'flashcards', label: '🃏 Flashcards', },
                    { action: 'quiz', label: '❓ Quiz', },
                    { action: 'notes', label: '📋 Revision Notes', },
                  ].map(({ action, label }) => (
                    <button key={action} onClick={() => handleAIAction(action, activeResource)} disabled={isLoadingAI}
                      className={cn('px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all', aiAction === action && aiResult ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-400 disabled:opacity-50')}>
                      {isLoadingAI && aiAction === action ? '...' : label}
                    </button>
                  ))}
                </div>
                {aiResult && (
                  <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 max-h-80 overflow-y-auto">
                    <MarkdownRenderer content={aiResult} />
                  </div>
                )}
              </div>

              {/* Article content */}
              {(activeResource.type === 'article' || activeResource.type === 'notes' || activeResource.type === 'guide') && (
                <div className="p-6 rounded-2xl card">
                  <MarkdownRenderer content={activeResource.articleContent || `# ${activeResource.title}\n\n${activeResource.description}\n\n*Full content would appear here in production.*`} />
                </div>
              )}
            </div>
          ) : (
            // RESOURCE LIST VIEW
            <div className="px-4 py-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {activeTab === 'discover' ? '🌟 Discover' : activeTab === 'saved' ? '🔖 Saved' : '✍️ Creator Dashboard'}
                  </h1>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {activeTab === 'discover' ? "Ireland's best free educational resources" : activeTab === 'saved' ? `${bookmarks.length} saved resources` : 'Publish and manage your content'}
                  </p>
                </div>
                {activeTab === 'creator' && (
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white text-sm font-semibold hover:shadow-lg transition-all">
                    <Plus className="w-4 h-4" /> Publish Resource
                  </button>
                )}
              </div>

              {activeTab === 'creator' ? (
                <CreatorDashboard />
              ) : (
                <>
                  {/* Search + type filter */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search resources, subjects, teachers..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none" />
                    </div>
                    <div className="flex gap-1 overflow-x-auto">
                      {CONTENT_FILTERS.slice(0, 6).map(f => (
                        <button key={f} onClick={() => setContentFilter(f)}
                          className={cn('px-3 py-2 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-all', contentFilter === f ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700')}>
                          {f === 'all' ? '🌟 All' : `${CONTENT_TYPE_INFO[f as ContentType].emoji} ${CONTENT_TYPE_INFO[f as ContentType].label}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Continue watching */}
                  {activeTab === 'discover' && Object.keys(watchHistory).length > 0 && (() => {
                    const inProgress = resources.filter(r => watchHistory[r.id] && watchHistory[r.id] > 0 && watchHistory[r.id] < 95)
                    if (!inProgress.length) return null
                    return (
                      <div className="mb-6">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-primary-500" /> Continue Watching</h3>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {inProgress.map(r => (
                            <div key={r.id} onClick={() => setActiveResource(r)} className="shrink-0 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
                              <div className={cn('h-24 bg-gradient-to-br flex items-center justify-center text-3xl', r.thumbnailColor)}>{CONTENT_TYPE_INFO[r.type].emoji}</div>
                              <div className="h-1 bg-slate-200 dark:bg-slate-700"><div className="h-full bg-primary-500" style={{ width:`${watchHistory[r.id]}%` }} /></div>
                              <div className="p-2"><p className="text-xs font-medium text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400">{r.title}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Smart recommendations */}
                  {activeTab === 'discover' && searchQuery === '' && category === 'all' && contentFilter === 'all' && (
                    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-950/20 dark:to-accent-950/20 border border-primary-200 dark:border-primary-800">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4 text-primary-500" /> Recommended for you</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Based on your bookmarks, recent activity, and exam countdown</p>
                    </div>
                  )}

                  {/* Resource grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(resource => (
                      <ResourceCard key={resource.id} resource={resource} bookmarked={bookmarks.includes(resource.id)}
                        onOpen={setActiveResource} onBookmark={handleBookmark} formatViews={formatViews} formatDuration={formatDuration} />
                    ))}
                    {filtered.length === 0 && (
                      <div className="col-span-3 text-center py-16 text-slate-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>{activeTab === 'saved' ? 'No saved resources yet. Bookmark resources to find them here.' : 'No resources found.'}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResourceCard({ resource, bookmarked, onOpen, onBookmark, formatViews, formatDuration }: {
  resource: LearnResource; bookmarked: boolean
  onOpen: (r: LearnResource) => void
  onBookmark: (id: string) => void
  formatViews: (v: number) => string
  formatDuration: (m?: number) => string
}) {
  const typeInfo = CONTENT_TYPE_INFO[resource.type]
  return (
    <div className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all overflow-hidden cursor-pointer"
      onClick={() => onOpen(resource)}>
      {/* Thumbnail */}
      <div className={cn('relative h-36 bg-gradient-to-br flex items-center justify-center', resource.thumbnailColor)}>
        <div className="text-5xl">{typeInfo.emoji}</div>
        {resource.progress !== undefined && resource.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div className="h-full bg-white transition-all" style={{ width: `${resource.progress}%` }} />
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); onBookmark(resource.id) }}
          className="absolute top-3 right-3 p-2 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors">
          <Bookmark className={cn('w-4 h-4', bookmarked && 'fill-current')} />
        </button>
        {resource.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/50 text-white text-xs font-medium">
            {formatDuration(resource.duration)}
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', typeInfo.color)}>{typeInfo.label}</span>
          <span className="text-xs text-slate-400 truncate">{resource.level}</span>
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{resource.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{resource.description}</p>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs shrink-0">
            {resource.creator.avatar}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 truncate">{resource.creator.name}</span>
          {resource.creator.verified && <Check className="w-3 h-3 text-primary-500 shrink-0" />}
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatViews(resource.views)}</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{resource.rating}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{resource.likes}</span>
        </div>
      </div>
    </div>
  )
}

function CreatorDashboard() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="grid sm:grid-cols-3 gap-4">
        {[{ label: 'Total Views', value: '—', icon: Eye, color: 'from-blue-500 to-indigo-600' }, { label: 'Followers', value: '—', icon: Users, color: 'from-primary-500 to-accent-500' }, { label: 'Resources', value: '0', icon: BookOpen, color: 'from-emerald-500 to-teal-600' }].map(s => (
          <div key={s.label} className="p-4 rounded-xl card text-center">
            <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mx-auto mb-2', s.color)}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div className="font-display font-bold text-2xl text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="p-6 rounded-2xl card text-center">
        <div className="text-4xl mb-3">✍️</div>
        <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">Become a Creator</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 max-w-sm mx-auto">Verified teachers and tutors can publish resources, articles, videos, and guides to help thousands of Irish students.</p>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Apply for Creator Access
        </button>
        <p className="text-xs text-slate-400 mt-3">Free for verified teachers · Analytics included · Premium creator tools coming soon</p>
      </div>
    </div>
  )
}




