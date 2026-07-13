'use client'

import { useState, useRef, useEffect } from 'react'
import {
  BookOpen, Plus, Sparkles, Trash2, Search, Upload,
  FileText, Download, Brain, AlignLeft, Tag, HelpCircle,
  Network, Layers, ChevronRight, X, Eye, Copy, Check as CheckIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer'
import { createClient } from '@/lib/supabase/client'
import { getNotes, createNote, updateNote, deleteNote } from '@/lib/database/notes'

export const dynamic = 'force-dynamic'

type NotesAction = 'summarise' | 'explain' | 'key-concepts' | 'definitions' | 'revision-notes' | 'flashcards' | 'quiz' | 'mind-map'

interface Note {
  id: string
  title: string
  subject: string
  rawContent: string
  createdAt: string
  updatedAt: string
  results: Partial<Record<NotesAction, string>>
}

const SUBJECTS = [
  'Mathematics', 'English', 'Irish', 'Physics', 'Chemistry',
  'Biology', 'History', 'Geography', 'Business', 'Economics',
  'French', 'German', 'Spanish', 'Computer Science', 'Other',
]

const AI_ACTIONS: { action: NotesAction; label: string; icon: string; description: string; color: string }[] = [
  { action: 'summarise', label: 'Summarise', icon: '📝', description: 'Concise summary', color: 'from-blue-500 to-cyan-500' },
  { action: 'explain', label: 'Explain', icon: '💡', description: 'Simple explanation', color: 'from-yellow-500 to-amber-500' },
  { action: 'key-concepts', label: 'Key Concepts', icon: '⭐', description: 'Extract core ideas', color: 'from-purple-500 to-violet-500' },
  { action: 'definitions', label: 'Definitions', icon: '📖', description: 'All key terms', color: 'from-green-500 to-emerald-500' },
  { action: 'revision-notes', label: 'Revision Notes', icon: '📋', description: 'Exam-ready notes', color: 'from-primary-500 to-accent-500' },
  { action: 'flashcards', label: 'Flashcards', icon: '🃏', description: 'Q&A pairs', color: 'from-pink-500 to-rose-500' },
  { action: 'quiz', label: 'Quiz', icon: '❓', description: 'Practice questions', color: 'from-orange-500 to-red-500' },
  { action: 'mind-map', label: 'Mind Map', icon: '🗺️', description: 'Visual structure', color: 'from-teal-500 to-cyan-500' },
]

export default function AINotesPage() {
  const supabase = createClient()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [activeResult, setActiveResult] = useState<NotesAction | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<NotesAction | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newContent, setNewContent] = useState('')
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  // Load notes from Supabase on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const notesData = await getNotes(user.id)
      setNotes(notesData.map(n => ({
        id: n.id,
        title: n.title,
        subject: n.subject || 'General',
        rawContent: n.content,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
        results: {},
      })))
    } catch (error) {
      // Error loading notes - handled silently
    } finally {
      setLoading(false)
    }
  }

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingFile(true); setUploadError('')
    try {
      if (file.type === 'text/plain') {
        setNewContent(await file.text())
        if (!newTitle) setNewTitle(file.name.replace(/\.[^.]+$/, ''))
      } else if (file.type === 'application/pdf') {
        const fd = new FormData(); fd.append('file', file)
        const res = await fetch('/api/parse-pdf', { method: 'POST', body: fd })
        if (res.ok) {
          const { text } = await res.json()
          setNewContent(text)
          if (!newTitle) setNewTitle(file.name.replace('.pdf', ''))
        } else setUploadError('Could not read PDF. Try pasting content instead.')
      } else if (file.name.endsWith('.docx') || file.type.includes('wordprocessingml')) {
        const fd = new FormData(); fd.append('file', file)
        const res = await fetch('/api/parse-docx', { method: 'POST', body: fd })
        if (res.ok) {
          const { text } = await res.json()
          setNewContent(text)
          if (!newTitle) setNewTitle(file.name.replace('.docx', ''))
        } else setUploadError('Could not read Word document.')
      } else if (file.type.startsWith('image/')) {
        setUploadError('Image uploaded. Note: image text extraction requires manual copying for now.')
      }
    } finally {
      setIsUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const { xp: toastXP, success: toastSuccess } = useToast()

  const handleCreateNote = async () => {
    if (!newContent.trim() || !newTitle.trim()) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const createdNote = await createNote(user.id, {
        title: newTitle,
        content: newContent,
        subject: newSubject || 'General',
        tags: null,
      })

      if (!createdNote) throw new Error('Failed to create note')

      const note: Note = {
        id: createdNote.id,
        title: createdNote.title,
        subject: createdNote.subject || 'General',
        rawContent: createdNote.content,
        createdAt: createdNote.created_at,
        updatedAt: createdNote.updated_at,
        results: {},
      }
      setNotes(prev => [note, ...prev])
      setSelectedNote(note)
      setShowNewModal(false)
      setNewTitle(''); setNewSubject(''); setNewContent('')
      toastSuccess('Note created', `${newTitle} · ${newContent.split(/\s+/).length} words`)
      toastXP(10, 'Created a new note')
    } catch (error) {
      // Error creating note - handled silently
    }
  }

  const handleAIAction = async (action: NotesAction) => {
    if (!selectedNote) return
    // Return cached result if already generated
    if (selectedNote.results[action]) { setActiveResult(action); return }
    setIsProcessing(true); setProcessingAction(action)
    try {
      const res = await fetch('/api/ai/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: selectedNote.rawContent, action, subject: selectedNote.subject }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { result } = await res.json()
      const updated: Note = { ...selectedNote, results: { ...selectedNote.results, [action]: result }, updatedAt: new Date().toISOString() }
      setSelectedNote(updated)
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
      setActiveResult(action)

      // Save the AI result to the note content in Supabase (append as a section)
      await updateNote(selectedNote.id, {
        content: selectedNote.rawContent + `\n\n## ${action.toUpperCase()}\n\n${result}`,
      })
    } catch (err: any) {
      // AI action error - handled silently
    } finally {
      setIsProcessing(false); setProcessingAction(null)
    }
  }

  const handleExportPDF = async () => {
    if (!selectedNote || !activeResult) return
    const content = selectedNote.results[activeResult] || selectedNote.rawContent
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 20
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2
    // Clean markdown for PDF
    const plain = content
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^[-*]\s+/gm, '• ')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(selectedNote.title, margin, 25)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`${selectedNote.subject} — ${new Date().toLocaleDateString('en-IE')} — Bloom Studies`, margin, 33)
    doc.setTextColor(0)
    doc.setFontSize(11)
    const lines = doc.splitTextToSize(plain, pageWidth)
    let y = 45
    for (const line of lines) {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(line, margin, y)
      y += 6
    }
    doc.save(`${selectedNote.title.replace(/[^a-z0-9]/gi, '_')}.pdf`)
  }

  const handleCopy = async () => {
    if (!selectedNote || !activeResult) return
    await navigator.clipboard.writeText(selectedNote.results[activeResult] || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in">
      {/* Left sidebar — notes list */}
      <div className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white/50 dark:bg-slate-900/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-500" /> AI Notes
          </h1>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search notes…"
              aria-label="Search notes"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:outline-none transition-colors placeholder-slate-500 dark:placeholder-slate-400" />
          </div>
          <button onClick={() => setShowNewModal(true)}
            className="btn-primary w-full text-sm justify-center">
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              {notes.length === 0 ? 'No notes yet' : 'No results'}
            </div>
          )}
          {filtered.map(note => (
            <button key={note.id} onClick={() => { setSelectedNote(note); setActiveResult(null) }}
              className={cn('w-full text-left p-3 rounded-xl transition-all group',
                selectedNote?.id === note.id ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300')}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{note.title}</div>
                  <div className={cn('text-xs mt-0.5 truncate', selectedNote?.id === note.id ? 'text-white/70' : 'text-slate-400')}>{note.subject}</div>
                </div>
                <button onClick={async (e) => {
                  e.stopPropagation()
                  await deleteNote(note.id)
                  setNotes(prev => prev.filter(n => n.id !== note.id))
                  if (selectedNote?.id === note.id) setSelectedNote(null)
                  toastSuccess('Note deleted')
                }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-500 transition-all shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className={cn('flex gap-1 mt-1.5 flex-wrap', selectedNote?.id === note.id ? 'opacity-80' : '')}>
                {Object.keys(note.results).slice(0, 3).map(r => (
                  <span key={r} className={cn('text-xs px-1.5 py-0.5 rounded-full', selectedNote?.id === note.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500')}>{r}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedNote ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900 dark:to-accent-900 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-primary-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-1">Select a note or create one</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Upload PDFs, Word docs, or paste your notes — AI does the rest</p>
            </div>
            <button onClick={() => setShowNewModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-medium hover:shadow-lg transition-all flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload Notes
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Note header */}
            <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-white/50 dark:bg-slate-900/50">
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white truncate">{selectedNote.title}</h2>
                <p className="text-sm text-slate-500">{selectedNote.subject} • {selectedNote.rawContent.split(/\s+/).length} words</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activeResult && selectedNote.results[activeResult] && (
                  <>
                    <button onClick={handleCopy}
                      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
                      className="btn-icon border border-slate-200 dark:border-slate-700 w-9 h-9">
                      {copied ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={handleExportPDF}
                      className="btn-primary text-sm gap-1.5">
                      <Download className="w-4 h-4" /> Export PDF
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* AI Action buttons */}
            <div className="shrink-0 px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                <button onClick={() => setActiveResult(null)}
                  aria-pressed={activeResult === null}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all',
                    activeResult === null
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800')}>
                  <Eye className="w-3.5 h-3.5" /> Original
                </button>
                {AI_ACTIONS.map(({ action, label, icon, color }) => (
                  <button key={action} onClick={() => handleAIAction(action)} disabled={isProcessing}
                    aria-pressed={activeResult === action}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all disabled:opacity-40',
                      activeResult === action
                        ? `bg-gradient-to-r ${color} text-white shadow-sm`
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800')}>
                    {processingAction === action
                      ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <span className="text-xs">{icon}</span>}
                    {label}
                    {selectedNote.results[action] && activeResult !== action && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" aria-label="Generated" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content area */}
            <div ref={exportRef} className="flex-1 overflow-y-auto p-6">
              {activeResult === null ? (
                <div className="prose max-w-none">
                  <div className="p-6 rounded-2xl card">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide text-slate-400">Original Content</h3>
                    <pre className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-sans">{selectedNote.rawContent}</pre>
                  </div>
                </div>
              ) : isProcessing && processingAction === activeResult ? (
                <div className="flex items-center justify-center py-20 flex-col gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-slate-700 dark:text-slate-300">AI is working...</p>
                    <p className="text-sm text-slate-400 mt-1">Generating {AI_ACTIONS.find(a => a.action === activeResult)?.label?.toLowerCase()}</p>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                  </div>
                </div>
              ) : selectedNote.results[activeResult] ? (
                <div className="rounded-2xl card p-6">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-lg">{AI_ACTIONS.find(a => a.action === activeResult)?.icon}</span>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{AI_ACTIONS.find(a => a.action === activeResult)?.label}</h3>
                    <span className="ml-auto text-xs text-slate-400">Generated by Bloom AI</span>
                  </div>
                  <MarkdownRenderer content={selectedNote.results[activeResult]!} />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* NEW NOTE MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" /> Upload Notes
              </h2>
              <button onClick={() => setShowNewModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Title</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Cell Biology Chapter 3"
                  className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Subject</label>
                <select value={newSubject} onChange={e => setNewSubject(e.target.value)}
                  className="input text-sm">
                  <option value="">Select subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Upload File</label>
                  <span className="text-xs text-slate-400">PDF, Word (.docx), TXT, Image</span>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile}
                  className="w-full py-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-400 text-slate-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isUploadingFile ? <><div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /> Parsing file...</> : <><Upload className="w-4 h-4" /> Click to upload file</>}
                </button>
                {uploadError && <p className="text-xs text-red-500 mt-1.5">{uploadError}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Content {newContent && <span className="text-primary-500 normal-case font-normal">({newContent.split(/\s+/).filter(Boolean).length} words)</span>}
                </label>
                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={10}
                  placeholder="Paste your notes, textbook content, lecture slides, or any study material..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-primary-500 focus:outline-none transition-colors resize-none text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateNote} disabled={!newTitle.trim() || !newContent.trim()}
                className={cn('flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all',
                  !newTitle.trim() || !newContent.trim() ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-primary-600 to-accent-500 hover:shadow-lg hover:shadow-primary-500/25')}>
                <Plus className="w-4 h-4" /> Create Note
              </button>
              <button onClick={() => { setShowNewModal(false); setUploadError('') }}
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








