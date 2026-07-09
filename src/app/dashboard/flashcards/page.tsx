'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Layers, Plus, Check, X, Sparkles, Upload, FileText,
  Brain, ListChecks, ToggleLeft, PenLine, Clock, Star,
  ChevronLeft, ChevronRight, RotateCcw, Trophy, Target,
  Flame, BookOpen, Zap, Settings, Trash2, Eye, EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { getFlashcards, createFlashcard, updateFlashcard, deleteFlashcard, reviewFlashcard, getDueFlashcards, getFlashcardDecks, getFlashcardsByDeck, createFlashcardDeck, deleteFlashcardDeck } from '@/lib/database/flashcards'

interface Flashcard {
  id: string
  front: string
  back: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  mastery: number        // 0-100
  nextReview: string     // ISO date string
  reviewCount: number
  easeFactor: number     // spaced repetition factor
  interval: number       // days until next review
}

interface MCQ { id: string; question: string; options: string[]; correct: number; explanation: string }
interface TFQ { id: string; statement: string; answer: boolean; explanation: string }
interface FBQ { id: string; sentence: string; blanks: string[]; hint: string }

interface StudyDeck {
  id: string
  title: string
  subject: string
  createdAt: string
  flashcards: Flashcard[]
  multipleChoice: MCQ[]
  trueFalse: TFQ[]
  fillInBlanks: FBQ[]
}

type StudyMode = 'flashcard' | 'mcq' | 'truefalse' | 'fillblank' | 'spaced'
type Tab = 'decks' | 'study' | 'stats'

const SUBJECTS = [
  'Mathematics', 'English', 'Irish', 'Physics', 'Chemistry',
  'Biology', 'History', 'Geography', 'Business', 'Economics',
  'French', 'German', 'Spanish', 'Computer Science', 'Other',
]

// SM-2 spaced repetition algorithm
function sm2(card: Flashcard, rating: 0 | 1 | 2 | 3 | 4 | 5): Partial<Flashcard> {
  let { easeFactor = 2.5, interval = 1, reviewCount = 0 } = card
  let newInterval: number
  if (rating < 3) {
    newInterval = 1
    reviewCount = 0
  } else {
    if (reviewCount === 0) newInterval = 1
    else if (reviewCount === 1) newInterval = 6
    else newInterval = Math.round(interval * easeFactor)
    reviewCount++
  }
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  const mastery = Math.min(100, Math.round((reviewCount / 8) * 100))
  const nextReview = new Date(Date.now() + newInterval * 86400000).toISOString()
  return { easeFactor, interval: newInterval, reviewCount, mastery, nextReview }
}

export default function FlashcardsPage() {
  const supabase = createClient()
  const [decks, setDecks] = useState<StudyDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('decks')
  const [activeDeck, setActiveDeck] = useState<StudyDeck | null>(null)
  const [studyMode, setStudyMode] = useState<StudyMode>('flashcard')
  const [cardIndex, setCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [mcqSelected, setMcqSelected] = useState<number | null>(null)
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null)
  const [fbInputs, setFbInputs] = useState<string[]>([])
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, skipped: 0 })
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [uploadText, setUploadText] = useState('')
  const [uploadSubject, setUploadSubject] = useState('')
  const [cardCount, setCardCount] = useState(15)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load decks from Supabase on mount
  useEffect(() => {
    loadDecks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadDecks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const deckData = await getFlashcardDecks(user.id)
      const decksWithCards: StudyDeck[] = []

      for (const deck of deckData) {
        const cards = await getFlashcardsByDeck(deck.id)
        decksWithCards.push({
          id: deck.id,
          title: deck.title,
          subject: deck.subject || 'General',
          createdAt: deck.created_at,
          flashcards: cards.map(c => ({
            id: c.id,
            front: c.front,
            back: c.back,
            subject: c.subject || deck.subject || 'General',
            difficulty: c.difficulty,
            mastery: c.mastery,
            nextReview: c.next_review_date || new Date().toISOString(),
            reviewCount: c.review_count,
            easeFactor: c.ease_factor,
            interval: c.interval,
          })),
          multipleChoice: [],
          trueFalse: [],
          fillInBlanks: [],
        })
      }

      setDecks(decksWithCards)
    } catch (error) {
      console.error('Error loading decks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Build spaced repetition queue — cards due today first, then by mastery
  useEffect(() => {
    if (!activeDeck) return
    const now = new Date().toISOString()
    const due = activeDeck.flashcards
      .filter(c => !c.nextReview || c.nextReview <= now)
      .sort((a, b) => a.mastery - b.mastery)
    const notDue = activeDeck.flashcards
      .filter(c => c.nextReview && c.nextReview > now)
      .sort((a, b) => a.mastery - b.mastery)
    setStudyQueue([...due, ...notDue])
    setCardIndex(0)
    setIsFlipped(false)
    setShowAnswer(false)
    setSessionStats({ correct: 0, incorrect: 0, skipped: 0 })
  }, [activeDeck, studyMode])

  const currentCards = studyMode === 'spaced' ? studyQueue : activeDeck?.flashcards || []
  const currentCard = currentCards[cardIndex]
  const currentMCQ = activeDeck?.multipleChoice[cardIndex]
  const currentTF = activeDeck?.trueFalse[cardIndex]
  const currentFB = activeDeck?.fillInBlanks[cardIndex]

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
        else setGenerateError('Could not read PDF. Try pasting text directly.')
      } else if (file.type.includes('wordprocessingml') || file.name.endsWith('.docx')) {
        const fd = new FormData(); fd.append('file', file)
        const res = await fetch('/api/parse-docx', { method: 'POST', body: fd })
        if (res.ok) { const { text } = await res.json(); setUploadText(text) }
        else setGenerateError('Could not read Word doc. Try pasting text.')
      } else if (file.type.startsWith('image/')) {
        setGenerateError('Image upload noted. Please also paste any text content for best results.')
      }
    } finally {
      setIsUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const { xp: toastXP, achievement: toastAchievement, success: toastSuccess, error: toastError } = useToast()

  const handleGenerate = async () => {
    if (!uploadText.trim()) { setGenerateError('Please add some content first.'); return }
    setIsGenerating(true); setGenerateError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in')

      const res = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: uploadText, subject: uploadSubject, count: cardCount }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const data = await res.json()

      // Create deck in Supabase
      const newDeck = await createFlashcardDeck(user.id, data.title, data.subject)
      if (!newDeck) throw new Error('Failed to create deck')

      // Create flashcards in Supabase
      const createdCards = await Promise.all(
        data.flashcards.map((f: any) =>
          createFlashcard(user.id, {
            deck_id: newDeck.id,
            subject: data.subject,
            front: f.front,
            back: f.back,
            difficulty: 'medium',
            next_review_date: new Date().toISOString(),
          })
        )
      )

      const deck: StudyDeck = {
        id: newDeck.id,
        title: newDeck.title,
        subject: newDeck.subject || 'General',
        createdAt: newDeck.created_at,
        flashcards: createdCards.filter((c): c is NonNullable<typeof c> => c !== null).map(c => ({
          id: c.id,
          front: c.front,
          back: c.back,
          subject: c.subject || 'General',
          difficulty: c.difficulty,
          mastery: c.mastery,
          nextReview: c.next_review_date || new Date().toISOString(),
          reviewCount: c.review_count,
          easeFactor: c.ease_factor,
          interval: c.interval,
        })),
        multipleChoice: data.multipleChoice,
        trueFalse: data.trueFalse,
        fillInBlanks: data.fillInBlanks,
      }

      setDecks(prev => [deck, ...prev])
      setActiveDeck(deck)
      setActiveTab('study')
      setShowUploadModal(false)
      setUploadText('')
      toastSuccess('Deck created!', `${data.flashcards.length} flashcards · ${data.multipleChoice.length} MCQs · ${data.trueFalse.length} T/F`)
      toastXP(30, 'Created a new study deck')
      if (decks.length === 0) setTimeout(() => toastAchievement('First Deck Created', '🃏'), 1000)
    } catch (err: any) {
      setGenerateError(err.message || 'Generation failed. Try again.')
      toastError('Generation failed', 'Please try again')
    } finally { setIsGenerating(false) }
  }

  const handleFlashcardRating = useCallback(async (rating: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!activeDeck || !currentCard) return

    // Update in Supabase
    await reviewFlashcard(currentCard.id, rating)

    const updates = sm2(currentCard, rating)
    const updatedDeck = {
      ...activeDeck,
      flashcards: activeDeck.flashcards.map(c => c.id === currentCard.id ? { ...c, ...updates } : c),
    }
    setActiveDeck(updatedDeck)
    setDecks(prev => prev.map(d => d.id === activeDeck.id ? updatedDeck : d))
    setSessionStats(s => ({
      ...s,
      correct: rating >= 3 ? s.correct + 1 : s.incorrect + 1,
      incorrect: rating < 3 ? s.incorrect + 1 : s.incorrect
    }))

    // XP on correct answer
    if (rating >= 3) toastXP(2, 'Correct answer')

    // Mastery milestone
    const newMastery = (updates as any).mastery
    if (newMastery >= 80 && currentCard.mastery < 80) {
      toastAchievement('Card Mastered!', '⭐')
    }
    setIsFlipped(false)
    setTimeout(() => setCardIndex(i => (i + 1) % currentCards.length), 300)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeck, currentCard, currentCards.length, setDecks])

  const nextCard = () => { setIsFlipped(false); setShowAnswer(false); setMcqSelected(null); setTfAnswer(null); setFbInputs([]); setCardIndex(i => (i + 1) % (currentCards.length || 1)) }
  const prevCard = () => { setIsFlipped(false); setShowAnswer(false); setMcqSelected(null); setTfAnswer(null); setFbInputs([]); setCardIndex(i => (i - 1 + (currentCards.length || 1)) % (currentCards.length || 1)) }

  const deckStats = (deck: StudyDeck) => {
    const avg = deck.flashcards.length ? Math.round(deck.flashcards.reduce((a, c) => a + c.mastery, 0) / deck.flashcards.length) : 0
    const due = deck.flashcards.filter(c => !c.nextReview || c.nextReview <= new Date().toISOString()).length
    return { avg, due }
  }

  return (
    <div className="page-container py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="section-heading leading-none">AI Flashcards</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">Spaced repetition powered by AI</p>
          </div>
        </div>
        <button onClick={() => setShowUploadModal(true)}
          className="btn-primary shrink-0">
          <Sparkles className="w-4 h-4" /> Generate Deck
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 w-fit">
        {(['decks', 'study', 'stats'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all',
              activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            {tab === 'decks' ? '📚 My Decks' : tab === 'study' ? '🧠 Study' : '📊 Stats'}
          </button>
        ))}
      </div>

      {/* DECKS TAB */}
      {activeTab === 'decks' && (
        <div>
          {decks.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900 dark:to-accent-900 flex items-center justify-center mx-auto mb-4">
                <Layers className="w-10 h-10 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No decks yet</h3>
              <p className="text-slate-400 dark:text-slate-600 mb-6">Upload your notes and AI will create flashcards, quizzes, and more</p>
              <button onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-medium hover:shadow-lg transition-all inline-flex items-center gap-2">
                <Upload className="w-5 h-5" /> Upload Notes
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map(deck => {
                const { avg, due } = deckStats(deck)
                return (
                  <div key={deck.id} className="p-5 rounded-2xl card hover:shadow-lg transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <button onClick={async () => {
                        await deleteFlashcardDeck(deck.id)
                        setDecks(prev => prev.filter(d => d.id !== deck.id))
                        toastSuccess('Deck deleted')
                      }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-2">{deck.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{deck.subject}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      <span>🃏 {deck.flashcards.length} cards</span>
                      <span>❓ {deck.multipleChoice.length} MCQ</span>
                      {due > 0 && <span className="text-amber-500 font-medium">⏰ {due} due</span>}
                    </div>
                    {/* Mastery bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Mastery</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{avg}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500" style={{ width: `${avg}%` }} />
                      </div>
                    </div>
                    <button onClick={() => { setActiveDeck(deck); setActiveTab('study') }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2">
                      <Brain className="w-4 h-4" /> Study Now
                    </button>
                  </div>
                )
              })}
              <button onClick={() => setShowUploadModal(true)}
                className="p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-400 transition-colors flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-primary-500 min-h-[200px]">
                <Plus className="w-8 h-8" />
                <span className="text-sm font-medium">New Deck</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* STUDY TAB */}
      {activeTab === 'study' && (
        <div>
          {!activeDeck ? (
            <div className="text-center py-20 text-slate-400">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a deck from the Decks tab to start studying.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {/* Deck header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">{activeDeck.title}</h2>
                  <p className="text-sm text-slate-500">{activeDeck.subject}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Check className="w-4 h-4 text-green-500" />{sessionStats.correct}
                  <X className="w-4 h-4 text-red-500" />{sessionStats.incorrect}
                </div>
              </div>

              {/* Mode selector */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {([
                  { mode: 'flashcard', label: 'Flashcards', icon: Layers },
                  { mode: 'spaced', label: 'Spaced Review', icon: Clock },
                  { mode: 'mcq', label: 'Multiple Choice', icon: ListChecks },
                  { mode: 'truefalse', label: 'True/False', icon: ToggleLeft },
                  { mode: 'fillblank', label: 'Fill Blanks', icon: PenLine },
                ] as { mode: StudyMode; label: string; icon: any }[]).map(({ mode, label, icon: Icon }) => (
                  <button key={mode} onClick={() => setStudyMode(mode)}
                    className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition-all',
                      studyMode === mode ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md' : 'card text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>

              {/* FLASHCARD MODE */}
              {(studyMode === 'flashcard' || studyMode === 'spaced') && currentCard && (
                <div>
                  <div className="text-center text-sm text-slate-400 mb-3">
                    {cardIndex + 1} / {currentCards.length}
                    {studyMode === 'spaced' && <span className="ml-2 text-amber-500">⏰ Spaced Repetition</span>}
                  </div>
                  <div className="relative h-72 cursor-pointer mb-6" onClick={() => setIsFlipped(!isFlipped)}>
                    {/* Front */}
                    <div className={cn('absolute inset-0 rounded-2xl card p-8 flex flex-col items-center justify-center transition-all duration-300', isFlipped ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100')}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className={cn('px-3 py-1 rounded-full text-xs font-medium', currentCard.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : currentCard.difficulty === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300')}>
                          {currentCard.difficulty}
                        </span>
                        <span className="text-xs text-slate-400">Mastery: {currentCard.mastery}%</span>
                      </div>
                      <p className="text-xl font-semibold text-slate-900 dark:text-white text-center leading-relaxed">{currentCard.front}</p>
                      <p className="text-sm text-slate-400 mt-4">Tap to reveal answer</p>
                    </div>
                    {/* Back */}
                    <div className={cn('absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 p-8 flex flex-col items-center justify-center transition-all duration-300', isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none scale-95')}>
                      <p className="text-xl text-white text-center leading-relaxed font-medium">{currentCard.back}</p>
                    </div>
                  </div>

                  {/* Rating buttons — only show after flip */}
                  {isFlipped ? (
                    <div className="space-y-3 animate-fade-in">
                      <p className="text-center text-sm text-slate-500 dark:text-slate-400">How well did you know this?</p>
                      <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => handleFlashcardRating(1)} className="py-3 rounded-xl bg-red-100 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-medium hover:bg-red-200 dark:hover:bg-red-900 transition-colors">
                          <X className="w-5 h-5 mx-auto mb-1" /> Hard
                        </button>
                        <button onClick={() => handleFlashcardRating(3)} className="py-3 rounded-xl bg-amber-100 dark:bg-amber-950/50 border-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-medium hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors">
                          <Brain className="w-5 h-5 mx-auto mb-1" /> Got It
                        </button>
                        <button onClick={() => handleFlashcardRating(5)} className="py-3 rounded-xl bg-green-100 dark:bg-green-950/50 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 font-medium hover:bg-green-200 dark:hover:bg-green-900 transition-colors">
                          <Check className="w-5 h-5 mx-auto mb-1" /> Easy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={prevCard} className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                      <button onClick={() => setIsFlipped(true)} className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-medium hover:shadow-lg transition-all">Show Answer</button>
                      <button onClick={nextCard} className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                  )}
                </div>
              )}

              {/* MCQ MODE */}
              {studyMode === 'mcq' && currentMCQ && (
                <div>
                  <div className="text-center text-sm text-slate-400 mb-3">{cardIndex + 1} / {activeDeck.multipleChoice.length}</div>
                  <div className="p-6 rounded-2xl card mb-4">
                    <p className="text-lg font-semibold text-slate-900 dark:text-white mb-6">{currentMCQ.question}</p>
                    <div className="space-y-3">
                      {currentMCQ.options.map((opt, i) => (
                        <button key={i} onClick={() => setMcqSelected(i)} disabled={mcqSelected !== null}
                          className={cn('w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all font-medium',
                            mcqSelected === null ? 'border-slate-200 dark:border-slate-700 hover:border-primary-400 text-slate-700 dark:text-slate-300' :
                            i === currentMCQ.correct ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                            mcqSelected === i ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400' :
                            'border-slate-200 dark:border-slate-700 text-slate-400 opacity-60')}>
                          <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                        </button>
                      ))}
                    </div>
                    {mcqSelected !== null && (
                      <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400 animate-fade-in">
                        💡 {currentMCQ.explanation}
                      </div>
                    )}
                  </div>
                  {mcqSelected !== null && (
                    <button onClick={nextCard} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-medium hover:shadow-lg transition-all animate-fade-in">
                      Next Question →
                    </button>
                  )}
                </div>
              )}

              {/* TRUE/FALSE MODE */}
              {studyMode === 'truefalse' && currentTF && (
                <div>
                  <div className="text-center text-sm text-slate-400 mb-3">{cardIndex + 1} / {activeDeck.trueFalse.length}</div>
                  <div className="p-8 rounded-2xl card mb-4 text-center">
                    <p className="text-xl font-semibold text-slate-900 dark:text-white mb-8 leading-relaxed">{currentTF.statement}</p>
                    <div className="flex gap-4 justify-center">
                      {([true, false] as const).map(val => (
                        <button key={String(val)} onClick={() => setTfAnswer(val)} disabled={tfAnswer !== null}
                          className={cn('px-10 py-4 rounded-xl text-lg font-bold transition-all',
                            tfAnswer === null ? 'border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-400' :
                            val === currentTF.answer ? 'bg-green-500 text-white shadow-lg' :
                            tfAnswer === val ? 'bg-red-500 text-white' : 'border-2 border-slate-200 dark:border-slate-700 text-slate-300 opacity-50')}>
                          {val ? '✓ True' : '✗ False'}
                        </button>
                      ))}
                    </div>
                    {tfAnswer !== null && (
                      <div className={cn('mt-6 p-4 rounded-xl text-sm animate-fade-in', tfAnswer === currentTF.answer ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400')}>
                        {tfAnswer === currentTF.answer ? '✓ Correct! ' : '✗ Incorrect. '}{currentTF.explanation}
                      </div>
                    )}
                  </div>
                  {tfAnswer !== null && <button onClick={nextCard} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-medium hover:shadow-lg transition-all animate-fade-in">Next →</button>}
                </div>
              )}

              {/* FILL IN BLANK MODE */}
              {studyMode === 'fillblank' && currentFB && (
                <div>
                  <div className="text-center text-sm text-slate-400 mb-3">{cardIndex + 1} / {activeDeck.fillInBlanks.length}</div>
                  <div className="p-6 rounded-2xl card mb-4">
                    <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{currentFB.sentence.replace(/_+/g, '______')}</p>
                    <p className="text-sm text-slate-400 mb-6">💡 Hint: {currentFB.hint}</p>
                    <div className="space-y-3">
                      {currentFB.blanks.map((_, i) => (
                        <input key={i} value={fbInputs[i] || ''} onChange={e => { const n = [...fbInputs]; n[i] = e.target.value; setFbInputs(n) }}
                          disabled={showAnswer} placeholder={`Blank ${i + 1}`}
                          className={cn('w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none transition-colors',
                            showAnswer ? fbInputs[i]?.toLowerCase() === currentFB.blanks[i].toLowerCase() ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-slate-200 dark:border-slate-700 focus:border-primary-500')} />
                      ))}
                    </div>
                    {showAnswer && (
                      <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400">
                        Answers: {currentFB.blanks.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {!showAnswer && <button onClick={() => setShowAnswer(true)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Check / Reveal</button>}
                    {showAnswer && <button onClick={nextCard} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-medium hover:shadow-lg transition-all">Next →</button>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STATS TAB */}
      {activeTab === 'stats' && (
        <div className="space-y-6 max-w-3xl">
          {decks.length === 0 ? (
            <div className="text-center py-20 text-slate-400"><Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Complete some study sessions to see your stats.</p></div>
          ) : decks.map(deck => {
            const { avg, due } = deckStats(deck)
            return (
              <div key={deck.id} className="p-5 rounded-2xl card">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{deck.title}</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="text-2xl font-display font-bold text-gradient">{avg}%</div>
                    <div className="text-xs text-slate-500 mt-1">Avg Mastery</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="text-2xl font-display font-bold text-gradient">{deck.flashcards.filter(c => c.mastery >= 80).length}</div>
                    <div className="text-xs text-slate-500 mt-1">Mastered</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className={cn('text-2xl font-display font-bold', due > 0 ? 'text-amber-500' : 'text-green-500')}>{due}</div>
                    <div className="text-xs text-slate-500 mt-1">Due Today</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {deck.flashcards.slice(0, 5).map(card => (
                    <div key={card.id} className="flex items-center gap-3">
                      <p className="flex-1 text-sm text-slate-600 dark:text-slate-400 truncate">{card.front}</p>
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500" style={{ width: `${card.mastery}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-500 w-8 text-right shrink-0">{card.mastery}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* UPLOAD / GENERATE MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500" /> Generate Study Deck
            </h2>
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
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Number of Flashcards</label>
                <input type="number" value={cardCount} onChange={e => setCardCount(Number(e.target.value))} min={5} max={50}
                  className="input text-sm" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Upload File</label>
                  <span className="text-xs text-slate-400">PDF, Word, TXT, Image</span>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile}
                  className="w-full py-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-400 text-slate-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isUploadingFile ? <><div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /> Parsing...</> : <><Upload className="w-4 h-4" /> Click to upload</>}
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Or Paste Notes {uploadText && <span className="text-primary-500 normal-case font-normal">({uploadText.split(/\s+/).length} words)</span>}
                </label>
                <textarea value={uploadText} onChange={e => setUploadText(e.target.value)} rows={8}
                  placeholder="Paste your notes, textbook content, or any study material here..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-primary-500 focus:outline-none transition-colors resize-none text-sm" />
              </div>
              {generateError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{generateError}</div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleGenerate} disabled={isGenerating || !uploadText.trim()}
                className={cn('flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all',
                  isGenerating || !uploadText.trim() ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-primary-600 to-accent-500 hover:shadow-lg hover:shadow-primary-500/25')}>
                {isGenerating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Deck</>}
              </button>
              <button onClick={() => { setShowUploadModal(false); setGenerateError('') }}
                className="px-5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}






