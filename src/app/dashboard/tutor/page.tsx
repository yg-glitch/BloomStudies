'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Sparkles, BookOpen, User, Upload, FileText,
  Image as ImageIcon, Brain, Layers, FileCheck, AlignLeft,
  ChevronDown, X, Plus, Zap, Crown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer'
import { useSubscription } from '@/components/SubscriptionProvider'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { useToast } from '@/components/ui/Toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: Attachment[]
  isStreaming?: boolean
}

interface Attachment {
  name: string
  type: 'pdf' | 'image' | 'text'
  content: string
  preview?: string
}

const SUBJECTS = [
  'Mathematics', 'English', 'Irish', 'Physics', 'Chemistry',
  'Biology', 'History', 'Geography', 'Business', 'Economics',
  'French', 'German', 'Spanish', 'Music', 'Art', 'Computer Science',
  'Agricultural Science', 'Home Economics', 'Physical Education',
]

const QUICK_ACTIONS = [
  { label: 'Generate Quiz', icon: FileCheck, action: 'quiz', color: 'from-purple-500 to-pink-500' },
  { label: 'Flashcards', icon: Layers, action: 'flashcards', color: 'from-blue-500 to-cyan-500' },
  { label: 'Summarise', icon: AlignLeft, action: 'summary', color: 'from-green-500 to-emerald-500' },
  { label: 'Explain Simply', icon: Brain, action: 'explain-simple', color: 'from-orange-500 to-amber-500' },
  { label: 'Higher Level', icon: Zap, action: 'explain-advanced', color: 'from-red-500 to-rose-500' },
]

const STARTER_PROMPTS = [
  "Explain photosynthesis for Leaving Cert Biology Higher Level",
  "What are the key themes in Hamlet for Leaving Cert English?",
  "Show me how to differentiate x² + 3x + 2",
  "Explain the causes of World War I for Leaving Cert History",
  "What is osmosis? Give me examples for Biology",
  "Explain supply and demand with a diagram description",
]

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `# Welcome to Bloom AI Tutor! 🌸

I'm your personal AI teacher, here to help you ace your **Junior Cycle** and **Leaving Certificate** exams.

Here's what I can do for you:

| Feature | Description |
|---------|-------------|
| 📚 **Explain Topics** | Clear explanations at any difficulty level |
| ❓ **Generate Quizzes** | Exam-style questions with marking schemes |
| 🃏 **Create Flashcards** | Quick-revision Q&A pairs |
| 📝 **Summarise Notes** | Structured revision summaries |
| 📄 **Analyse Uploads** | Upload your notes, PDFs, or images |

**To get started**, select your subject and exam level above, then ask me anything!

> 📝 **Exam Tip:** The more specific your question, the better I can tailor my answer to the marking scheme!`,
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<'higher' | 'ordinary'>('higher')
  const [selectedSystem, setSelectedSystem] = useState<'leaving-cert' | 'junior-cycle'>('leaving-cert')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { checkLimit, incrementUsage, isPremium, usage, limits } = useSubscription()
  const { xp: toastXP, achievement: toastAchievement, error: toastError } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const autoResize = () => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments: Attachment[] = []
    setIsUploadingFile(true)

    for (const file of files) {
      if (file.type === 'application/pdf') {
        try {
          const formData = new FormData()
          formData.append('file', file)
          const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData })
          if (res.ok) {
            const { text, pages } = await res.json()
            newAttachments.push({
              name: file.name,
              type: 'pdf',
              content: `[PDF: ${file.name} — ${pages} page(s)]\n\n${text}`,
            })
          } else {
            newAttachments.push({
              name: file.name,
              type: 'pdf',
              content: `[PDF: ${file.name} — could not extract text]`,
            })
          }
        } catch {
          newAttachments.push({
            name: file.name,
            type: 'pdf',
            content: `[PDF: ${file.name}]`,
          })
        }
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        await new Promise<void>((resolve) => {
          reader.onload = () => {
            newAttachments.push({
              name: file.name,
              type: 'image',
              content: reader.result as string,
              preview: reader.result as string,
            })
            resolve()
          }
          reader.readAsDataURL(file)
        })
      } else if (file.type === 'text/plain') {
        const text = await file.text()
        newAttachments.push({
          name: file.name,
          type: 'text',
          content: text,
        })
      }
    }

    setAttachments(prev => [...prev, ...newAttachments])
    if (fileInputRef.current) fileInputRef.current.value = ''
    setIsUploadingFile(false)
  }

  const sendMessage = useCallback(async (messageContent?: string, action?: string) => {
    const content = messageContent || input.trim()
    if (!content && attachments.length === 0) return
    if (isLoading) return

    // Check free plan limit
    if (!checkLimit('aiMessagesPerDay')) {
      setShowUpgrade(true)
      return
    }
    incrementUsage('aiMessagesToday')

    // Build full content including attachments
    let fullContent = content
    if (attachments.length > 0) {
      const attText = attachments
        .map(a => {
          if (a.type === 'text') return `\n\n[Uploaded notes - ${a.name}]:\n${a.content}`
          if (a.type === 'image') return `\n\n[Uploaded image: ${a.name}]`
          return `\n\n[Uploaded file: ${a.name}]`
        })
        .join('')
      fullContent = content + attText
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: fullContent,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInput('')
    setAttachments([])
    setIsLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      abortRef.current = new AbortController()

      // Build message history for the API
      const history = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          subject: selectedSubject,
          level: selectedLevel,
          educationSystem: selectedSystem,
          action,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  accumulated += parsed.content
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMessage.id
                        ? { ...m, content: accumulated }
                        : m
                    )
                  )
                }
              } catch {}
            }
          }
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? { ...m, isStreaming: false }
            : m
        )
      )
      // Award XP for each AI interaction
      const msgCount = messages.filter(m => m.role === 'user').length + 1
      if (msgCount === 1) toastAchievement('First Question Asked!', '🧠')
      else if (msgCount % 10 === 0) { toastXP(25, `${msgCount} questions asked`) }
      else toastXP(5, 'AI Tutor session')
    } catch (error: any) {
      if (error.name === 'AbortError') return
      console.error('Tutor error:', error)
      toastError('AI response failed', 'Please try again')
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? { ...m, content: 'Sorry, something went wrong. Please try again.', isStreaming: false }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [input, attachments, messages, selectedSubject, selectedLevel, selectedSystem, isLoading])

  const handleQuickAction = (action: string) => {
    const topic = selectedSubject
      ? `${selectedSubject}${input ? ` — specifically: ${input}` : ''}`
      : input || 'the current topic'

    const prompts: Record<string, string> = {
      quiz: `Generate a ${selectedSystem === 'leaving-cert' ? 'Leaving Certificate' : 'Junior Cycle'} ${selectedLevel === 'higher' ? 'Higher Level' : 'Ordinary Level'} exam-style quiz on ${topic}`,
      flashcards: `Create 10 exam-focused flashcards on ${topic}`,
      summary: `Create a comprehensive study summary for ${topic}`,
      'explain-simple': `Explain ${topic} in very simple terms for a beginner`,
      'explain-advanced': `Give me a Higher Level in-depth explanation of ${topic}`,
    }

    sendMessage(prompts[action], action)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {showUpgrade && <UpgradePrompt feature="Unlimited AI Messages" description="You've used all 10 free messages today. Upgrade for unlimited access." onDismiss={() => setShowUpgrade(false)} />}
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0 shadow-md shadow-primary-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white leading-none">Bloom AI Tutor</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your personal Irish exam teacher
                {!isPremium && (
                  <span className="ml-2 text-amber-600 dark:text-amber-400">
                    {usage.aiMessagesToday}/{limits.aiMessagesPerDay} today ·{' '}
                    <button onClick={() => setShowUpgrade(true)} className="underline hover:no-underline focus-visible:ring-1">Upgrade</button>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Context selectors */}
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            {/* Education system */}
            <div className="flex rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setSelectedSystem('leaving-cert')}
                className={cn('px-3 py-2 text-xs font-semibold transition-colors', selectedSystem === 'leaving-cert' ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}
              >
                Leaving Cert
              </button>
              <button
                onClick={() => setSelectedSystem('junior-cycle')}
                className={cn('px-3 py-2 text-xs font-semibold transition-colors', selectedSystem === 'junior-cycle' ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}
              >
                Junior Cycle
              </button>
            </div>

            {/* Level */}
            {selectedSystem === 'leaving-cert' && (
              <div className="flex rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => setSelectedLevel('higher')}
                  className={cn('px-3 py-2 text-sm font-medium transition-colors', selectedLevel === 'higher' ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}
                >
                  Higher
                </button>
                <button
                  onClick={() => setSelectedLevel('ordinary')}
                  className={cn('px-3 py-2 text-sm font-medium transition-colors', selectedLevel === 'ordinary' ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}
                >
                  Ordinary
                </button>
              </div>
            )}

            {/* Subject */}
            <div className="relative">
              <button
                onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:border-primary-500 transition-colors min-w-[140px]"
              >
                <BookOpen className="w-4 h-4" />
                {selectedSubject || 'All Subjects'}
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
              {showSubjectDropdown && (
                <div className="absolute top-full right-0 mt-1 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-50 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedSubject(''); setShowSubjectDropdown(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    All Subjects
                  </button>
                  {SUBJECTS.map(s => (
                    <button
                      key={s}
                      onClick={() => { setSelectedSubject(s); setShowSubjectDropdown(false) }}
                      className={cn('w-full text-left px-4 py-2.5 text-sm transition-colors', selectedSubject === s ? 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_ACTIONS.map(({ label, icon: Icon, action, color }) => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium shrink-0 transition-all hover:shadow-lg disabled:opacity-50',
                `bg-gradient-to-r ${color}`
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Starter prompts — show only when just the welcome message */}
        {messages.length === 1 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-left p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex gap-3 animate-fade-in', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {message.role === 'assistant' && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-primary-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}

            <div
              className={cn(
                'max-w-[85%] rounded-2xl overflow-hidden',
                message.role === 'user'
                  ? 'bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-lg shadow-primary-500/20'
                  : 'card shadow-sm'
              )}
            >
              {/* Attachments preview */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 pb-0">
                  {message.attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 text-xs">
                      {att.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      {att.name}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4">
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-white/95 leading-relaxed">{message.content}</p>
                ) : (
                  <div>
                    {message.content ? (
                      <MarkdownRenderer content={message.content} />
                    ) : null}
                    {message.isStreaming && (
                      <span className="inline-flex gap-1 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className={cn('px-4 pb-2 text-xs', message.role === 'user' ? 'text-white/50' : 'text-slate-400 dark:text-slate-500')}>
                {message.timestamp.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
            )}
          </div>
        ))}

        {/* Loading state when waiting for first token */}
        {isLoading && messages[messages.length - 1]?.content === '' && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="card p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Bloom AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm px-4 sm:px-6 py-3">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700">
                {att.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={att.preview} alt={att.name} className="w-6 h-6 rounded object-cover" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-primary-500" />
                )}
                <span className="text-slate-700 dark:text-slate-300 max-w-[100px] truncate">{att.name}</span>
                <button
                  onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                  aria-label={`Remove ${att.name}`}
                  className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Upload files"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingFile}
            aria-label="Upload notes, PDF, or image"
            className="btn-icon w-10 h-10 shrink-0 border border-slate-200 dark:border-slate-700 hover:border-primary-400 disabled:opacity-50"
          >
            {isUploadingFile
              ? <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              : <Plus className="w-4 h-4" />
            }
          </button>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize() }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={`Ask anything${selectedSubject ? ` about ${selectedSubject}` : ''}… (Enter to send, Shift+Enter for new line)`}
              rows={1}
              aria-label="Message input"
              className="w-full px-4 py-3 pr-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-primary-500 focus:outline-none transition-colors resize-none min-h-[48px] max-h-[180px] overflow-y-auto text-sm"
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            aria-label="Send message"
            className={cn(
              'w-10 h-10 rounded-xl text-white shrink-0 transition-all flex items-center justify-center',
              (!input.trim() && attachments.length === 0) || isLoading
                ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 to-accent-500 hover:shadow-lg hover:shadow-primary-500/25 hover:scale-105 active:scale-95'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-600 text-center mt-2">
          Bloom AI can make mistakes. Verify important exam info with your teacher.
        </p>
      </div>
    </div>
  )
}





