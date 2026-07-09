'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Headphones, Play, Pause, SkipForward, SkipBack,
  Sparkles, Clock, Upload, FileText, Download,
  BookOpen, Music, Bookmark, List, X, Plus,
  ChevronRight, Volume2, Repeat, Shuffle, Mic,
  FastForward, Rewind, AlignLeft, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { getAudioLessons, createAudioLesson, updateAudioLesson, deleteAudioLesson, updateAudioLessonProgress, addAudioLessonBookmark, type AudioLesson } from '@/lib/database/audio-lessons'

interface Chapter { title: string; startIndex: number; summary: string }

const VOICES = [
  { id: 'teacher-irl', label: 'Irish Teacher', description: 'Warm, encouraging', emoji: '👩‍🏫' },
  { id: 'tutor-calm', label: 'Calm Tutor', description: 'Clear and steady', emoji: '📚' },
  { id: 'exam-focus', label: 'Exam Focus', description: 'Direct and precise', emoji: '🎯' },
  { id: 'storyteller', label: 'Storyteller', description: 'Engaging narrative', emoji: '✨' },
]

const BG_MUSIC = [
  { id: 'none', label: 'No Music', emoji: '🔇' },
  { id: 'lofi', label: 'Lo-Fi Beats', emoji: '🎵' },
  { id: 'nature', label: 'Nature Sounds', emoji: '🌿' },
  { id: 'piano', label: 'Soft Piano', emoji: '🎹' },
  { id: 'rain', label: 'Rainfall', emoji: '🌧️' },
]

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

const SUBJECTS = [
  'Mathematics', 'English', 'Irish', 'Physics', 'Chemistry',
  'Biology', 'History', 'Geography', 'Business', 'Economics',
  'French', 'German', 'Spanish', 'Computer Science', 'Other',
]

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioLearningPage() {
  const supabase = createClient()
  const [lessons, setLessons] = useState<AudioLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<AudioLesson | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [bgMusic, setBgMusic] = useState('none')
  const [volume, setVolume] = useState(0.8)
  const [activeTab, setActiveTab] = useState<'player' | 'transcript' | 'chapters' | 'playlist'>('player')
  const [showGenerate, setShowGenerate] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [uploadText, setUploadText] = useState('')
  const [uploadSubject, setUploadSubject] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('teacher-irl')
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load lessons from Supabase
  useEffect(() => {
    loadLessons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadLessons = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const lessonsData = await getAudioLessons(user.id)
      setLessons(lessonsData)
    } catch (error) {
      console.error('Error loading lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalChars = active?.script.length || 1
  const charProgress = Math.min(currentTime / (active?.duration || 1), 1)
  const currentCharPos = Math.floor(charProgress * totalChars)

  // Find current chapter (parse from transcript for now)
  const currentChapterTitle = active?.transcript.split('\n\n').find((_, i) => {
    const charStart = active.transcript.split('\n\n').slice(0, i).join('\n\n').length
    return charStart <= currentCharPos && currentCharPos < charStart + 100
  })?.slice(0, 50) || ''

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
      if (intervalRef.current) clearInterval(intervalRef.current)
      setIsPlaying(false)
    }
  }, [])

  const startSpeech = useCallback((fromChar = 0) => {
    if (!active || typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    if (intervalRef.current) clearInterval(intervalRef.current)

    const textToSpeak = active.script.slice(fromChar)
    const utter = new SpeechSynthesisUtterance(textToSpeak)
    utter.rate = speed
    utter.volume = volume

    // Pick voice based on selection
    const voices = window.speechSynthesis.getVoices()
    const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'))
      || voices.find(v => v.lang.startsWith('en'))
    if (enVoice) utter.voice = enVoice

    utter.onend = () => { setIsPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current) }
    utter.onerror = () => { setIsPlaying(false) }

    utteranceRef.current = utter
    window.speechSynthesis.speak(utter)
    setIsPlaying(true)

    // Simulate progress based on duration
    const charsRemaining = textToSpeak.length
    const estimatedMs = (charsRemaining / active.script.length) * active.duration * 1000 / speed
    const startTime = Date.now()
    const startSeconds = (fromChar / active.script.length) * active.duration

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const newTime = startSeconds + elapsed * speed
      setCurrentTime(Math.min(newTime, active.duration))
      if (newTime >= active.duration) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsPlaying(false)
      }
    }, 500)
  }, [active, speed, volume])

  const togglePlay = () => {
    if (isPlaying) { stopSpeech() }
    else { startSpeech(currentCharPos) }
  }

  const seek = (seconds: number) => {
    const newTime = Math.max(0, Math.min(seconds, active?.duration || 0))
    setCurrentTime(newTime)
    if (isPlaying) {
      const charPos = Math.floor((newTime / (active?.duration || 1)) * totalChars)
      startSpeech(charPos)
    }
  }

  const addBookmark = async () => {
    if (!active) return
    await addAudioLessonBookmark(active.id, currentCharPos)
    const updated = { ...active, bookmarks: [...(active.bookmarks || []), currentCharPos] }
    setActive(updated)
    setLessons(prev => prev.map(l => l.id === updated.id ? updated : l))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingFile(true)
    try {
      if (file.type === 'text/plain') {
        setUploadText(await file.text())
      } else if (file.type === 'application/pdf') {
        const fd = new FormData(); fd.append('file', file)
        const res = await fetch('/api/parse-pdf', { method: 'POST', body: fd })
        if (res.ok) { const { text } = await res.json(); setUploadText(text) }
      } else if (file.name.endsWith('.docx')) {
        const fd = new FormData(); fd.append('file', file)
        const res = await fetch('/api/parse-docx', { method: 'POST', body: fd })
        if (res.ok) { const { text } = await res.json(); setUploadText(text) }
      }
    } finally { setIsUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const { xp: toastXP, success: toastSuccess, error: toastError } = useToast()

  const handleGenerate = async () => {
    if (!uploadText.trim()) { setGenerateError('Please add some content first.'); return }
    setIsGenerating(true); setGenerateError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const res = await fetch('/api/ai/audio-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: uploadText, subject: uploadSubject, voice: selectedVoice }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const data = await res.json()

      const createdLesson = await createAudioLesson(user.id, {
        title: data.title || uploadSubject || 'Audio Lesson',
        subject: uploadSubject || 'General',
        duration: data.duration || 300,
        script: data.script || uploadText,
        transcript: data.transcript || uploadText,
        voice: selectedVoice,
        bookmarks: [],
        progress: 0,
      })

      if (!createdLesson) throw new Error('Failed to save lesson')

      setLessons(prev => [createdLesson, ...prev])
      setActive(createdLesson); setCurrentTime(0)
      setActiveTab('player'); setShowGenerate(false)
      setUploadText('')
      const mins = Math.round((data.duration || 300) / 60)
      toastSuccess('Podcast ready!', `${mins} min`)
      toastXP(20, 'Created audio lesson')
    } catch (err: any) {
      setGenerateError(err.message || 'Failed to generate.')
      toastError('Generation failed', 'Please try again')
    }
    finally { setIsGenerating(false) }
  }

  const handleDownload = () => {
    if (!active) return
    const blob = new Blob([active.transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${active.title}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => { return () => stopSpeech() }, [stopSpeech])

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in">
      {/* Sidebar — playlist */}
      <div className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white/50 dark:bg-slate-900/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary-500" /> Audio Learning
          </h1>
          <button onClick={() => setShowGenerate(true)}
            className="btn-primary w-full justify-center text-sm">
            <Sparkles className="w-4 h-4" /> Generate Podcast
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {lessons.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              <Headphones className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No lessons yet
            </div>
          )}
          {lessons.map(lesson => (
            <button key={lesson.id} onClick={() => { setActive(lesson); setCurrentTime(0); stopSpeech() }}
              className={cn('w-full text-left p-3 rounded-xl transition-all group',
                active?.id === lesson.id ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
              <div className="flex items-start gap-2">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', active?.id === lesson.id ? 'bg-white/20' : 'bg-primary-100 dark:bg-primary-900')}>
                  <Headphones className={cn('w-4 h-4', active?.id === lesson.id ? 'text-white' : 'text-primary-500')} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={cn('font-medium text-sm truncate', active?.id !== lesson.id && 'text-slate-700 dark:text-slate-300')}>{lesson.title}</div>
                  <div className={cn('text-xs mt-0.5', active?.id === lesson.id ? 'text-white/70' : 'text-slate-400')}>{lesson.subject} • {formatTime(lesson.duration)}</div>
                </div>
                <button onClick={async (e) => {
                  e.stopPropagation()
                  await deleteAudioLesson(lesson.id)
                  if (active?.id === lesson.id) { setActive(null); stopSpeech() }
                  setLessons(prev => prev.filter(l => l.id !== lesson.id))
                }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded shrink-0 hover:text-red-500 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {lesson.progress > 0 && (
                <div className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${lesson.progress * 100}%` }} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main player */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!active ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 text-slate-400">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900 dark:to-accent-900 flex items-center justify-center">
              <Headphones className="w-12 h-12 text-primary-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-1">No lesson selected</h3>
              <p className="text-sm">Upload your notes and AI will create a podcast for you</p>
            </div>
            <button onClick={() => setShowGenerate(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-medium hover:shadow-lg transition-all flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload Notes
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="shrink-0 flex gap-1 p-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              {(['player', 'transcript', 'chapters', 'playlist'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                    activeTab === tab ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')}>
                  {tab === 'player' ? '🎧 Player' : tab === 'transcript' ? '📄 Transcript' : tab === 'chapters' ? '📑 Chapters' : '🎵 Settings'}
                </button>
              ))}
              <button onClick={handleDownload} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-primary-500 transition-colors">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* PLAYER TAB */}
              {activeTab === 'player' && (
                <div className="p-6 max-w-2xl mx-auto">
                  {/* Album art style header */}
                  <div className="relative p-8 rounded-2xl bg-gradient-to-br from-primary-500 via-accent-500 to-purple-600 mb-6 text-white text-center shadow-2xl shadow-primary-500/30 overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="absolute rounded-full border border-white" style={{ width: `${(i + 1) * 20}%`, height: `${(i + 1) * 20}%`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                      ))}
                    </div>
                    <div className={cn('w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4', isPlaying && 'animate-pulse')}>
                      <Headphones className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-1">{active.title}</h2>
                    <p className="text-white/80">{active.subject}</p>
                    {currentChapterTitle && <p className="text-white/60 text-sm mt-1">📑 {currentChapterTitle}</p>}
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-slate-500 mb-2">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(active.duration)}</span>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer group"
                      onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * active.duration) }}>
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all" style={{ width: `${(currentTime / active.duration) * 100}%` }} />
                      {/* Bookmarks on timeline */}
                      {active.bookmarks?.map((bm, i) => (
                        <div key={i} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow cursor-pointer"
                          style={{ left: `${(bm / totalChars) * 100}%` }}
                          title="Bookmark" onClick={e => { e.stopPropagation(); const t = (bm / totalChars) * active.duration; seek(t) }} />
                      ))}
                    </div>
                  </div>

                  {/* Main controls */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <button onClick={() => seek(currentTime - 30)} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <Rewind className="w-5 h-5" />
                    </button>
                    <button onClick={() => seek(currentTime - 10)} className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button onClick={togglePlay}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 text-white shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105 transition-all flex items-center justify-center">
                      {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                    </button>
                    <button onClick={() => seek(currentTime + 10)} className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <SkipForward className="w-5 h-5" />
                    </button>
                    <button onClick={() => seek(currentTime + 30)} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <FastForward className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Speed + volume + bookmark */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Speed */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                      {SPEEDS.map(s => (
                        <button key={s} onClick={() => setSpeed(s)}
                          className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all', speed === s ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
                          {s}x
                        </button>
                      ))}
                    </div>
                    {/* Volume */}
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-slate-500" />
                      <input type="range" min={0} max={1} step={0.1} value={volume} onChange={e => setVolume(Number(e.target.value))}
                        className="w-20 accent-primary-500" />
                    </div>
                    {/* Bookmark */}
                    <button onClick={addBookmark} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-colors text-sm">
                      <Bookmark className="w-4 h-4" /> Bookmark
                    </button>
                  </div>
                </div>
              )}

              {/* TRANSCRIPT TAB */}
              {activeTab === 'transcript' && (
                <div className="p-6 max-w-3xl mx-auto">
                  <div className="p-6 rounded-2xl card">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <AlignLeft className="w-4 h-4 text-primary-500" /> Full Transcript
                    </h3>
                    <div className="space-y-3">
                      {active.transcript.split('\n\n').map((para, i) => {
                        const charStart = active.transcript.split('\n\n').slice(0, i).join('\n\n').length
                        const isCurrent = charStart <= currentCharPos && currentCharPos < charStart + para.length
                        return (
                          <p key={i} onClick={() => { const t = (charStart / totalChars) * active.duration; seek(t) }}
                            className={cn('text-sm leading-relaxed cursor-pointer rounded-lg px-3 py-2 transition-all', isCurrent ? 'bg-primary-100 dark:bg-primary-950/50 text-primary-900 dark:text-primary-100 border-l-4 border-primary-500' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800')}>
                            {para}
                          </p>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* CHAPTERS TAB */}
              {activeTab === 'chapters' && (
                <div className="p-6 max-w-2xl mx-auto space-y-3">
                  {active.transcript.split('\n\n').map((section, i) => {
                    const charStart = active.transcript.split('\n\n').slice(0, i).join('\n\n').length
                    const isActive = currentChapterTitle === section.slice(0, 50)
                    return (
                      <button key={i} onClick={() => { const t = (charStart / totalChars) * active.duration; seek(t) }}
                        className={cn('w-full text-left p-4 rounded-xl transition-all', isActive ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg' : 'card hover:shadow-md')}>
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0', isActive ? 'bg-white/20' : 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400')}>
                            {i + 1}
                          </div>
                          <div>
                            <div className="font-semibold line-clamp-1">{section.slice(0, 50)}</div>
                            <div className={cn('text-sm line-clamp-1', isActive ? 'text-white/70' : 'text-slate-500')}>{section.slice(50, 100) || 'Section'}</div>
                          </div>
                          {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />}
                        </div>
                      </button>
                    )
                  })}
                  {/* Bookmarks list */}
                  {active.bookmarks && active.bookmarks.length > 0 && (
                    <div className="mt-6 p-4 rounded-xl card">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Bookmark className="w-4 h-4 text-amber-500" /> Bookmarks</h4>
                      {active.bookmarks.map((bm, i) => {
                        const t = (bm / totalChars) * active.duration
                        return (
                          <button key={i} onClick={() => seek(t)} className="w-full text-left py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary-500 transition-colors flex items-center justify-between">
                            <span>Bookmark {i + 1}</span>
                            <span className="text-slate-400">{formatTime(t)}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'playlist' && (
                <div className="p-6 max-w-2xl mx-auto space-y-6">
                  <div className="p-5 rounded-2xl card">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Mic className="w-4 h-4 text-primary-500" /> Voice Style</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {VOICES.map(v => (
                        <button key={v.id} onClick={() => setSelectedVoice(v.id)}
                          className={cn('p-4 rounded-xl text-left transition-all border-2', selectedVoice === v.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-slate-200 dark:border-slate-700 hover:border-primary-300')}>
                          <div className="text-2xl mb-1">{v.emoji}</div>
                          <div className="font-medium text-slate-900 dark:text-white text-sm">{v.label}</div>
                          <div className="text-xs text-slate-500">{v.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl card">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Music className="w-4 h-4 text-primary-500" /> Background Music</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {BG_MUSIC.map(m => (
                        <button key={m.id} onClick={() => setBgMusic(m.id)}
                          className={cn('p-3 rounded-xl text-center transition-all border-2 text-sm', bgMusic === m.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 font-medium text-primary-600 dark:text-primary-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300')}>
                          <div className="text-lg mb-1">{m.emoji}</div>{m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* GENERATE MODAL */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" /> Generate Podcast
              </h2>
              <button onClick={() => setShowGenerate(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Subject</label>
                <select value={uploadSubject} onChange={e => setUploadSubject(e.target.value)}
                  className="input text-sm">
                  <option value="">Select subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Voice Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {VOICES.map(v => (
                    <button key={v.id} onClick={() => setSelectedVoice(v.id)}
                      className={cn('p-3 rounded-xl text-left text-sm border-2 transition-all', selectedVoice === v.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-slate-200 dark:border-slate-700')}>
                      {v.emoji} {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Upload File</label>
                  <span className="text-xs text-slate-400">PDF, Word, TXT</span>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx" className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile}
                  className="w-full py-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-400 text-slate-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                  {isUploadingFile ? <><div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />Parsing...</> : <><Upload className="w-4 h-4" />Upload notes</>}
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Or Paste Notes {uploadText && <span className="normal-case font-normal text-primary-500">({uploadText.split(/\s+/).length} words)</span>}
                </label>
                <textarea value={uploadText} onChange={e => setUploadText(e.target.value)} rows={8}
                  placeholder="Paste your study notes here..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-primary-500 focus:outline-none resize-none text-sm" />
              </div>
              {generateError && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{generateError}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleGenerate} disabled={isGenerating || !uploadText.trim()}
                className={cn('flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all',
                  isGenerating || !uploadText.trim() ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-primary-600 to-accent-500 hover:shadow-lg')}>
                {isGenerating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating podcast...</> : <><Sparkles className="w-4 h-4" />Generate</>}
              </button>
              <button onClick={() => setShowGenerate(false)} className="px-5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}







