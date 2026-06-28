'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Check, ChevronDown, Star, Shield, Brain,
  TrendingUp, Clock, Heart, BookOpen, Sparkles, Award,
  Users, Lock, Eye, Bell, BarChart3, Target, Zap,
  GraduationCap, Menu, X, CheckCircle, Play
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Animated counter on scroll
function Counter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const step = end / 60
        let cur = 0
        const t = setInterval(() => { cur = Math.min(cur + step, end); setCount(Math.floor(cur)); if (cur >= end) clearInterval(t) }, 24)
      }
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end])
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

const FAQS = [
  { q: 'Is Bloom Studies safe for my child to use?', a: 'Yes. Bloom Studies is designed exclusively for educational use. All AI responses are filtered to remain appropriate and educational. We comply fully with GDPR and do not share student data with any third parties. Students interact only with study content.' },
  { q: 'What age is Bloom Studies designed for?', a: 'Bloom Studies is built specifically for Junior Cycle (ages 12–15) and Leaving Certificate students (ages 15–19) in Ireland. All content and AI responses are calibrated to the Irish curriculum and SEC marking schemes.' },
  { q: 'Can I see how my child is progressing?', a: 'Students can share their analytics dashboard with parents. A dedicated parent dashboard with progress reports and weekly summaries is coming in a future update — designed to give you visibility without invading your child\'s independence.' },
  { q: 'Will Bloom Studies do my child\'s homework for them?', a: 'No. Bloom Studies is designed to teach and support learning, not to replace it. The AI Tutor explains concepts and guides students to the answer rather than giving it directly. Exam grading gives feedback on the student\'s own work.' },
  { q: 'How is Bloom different from ChatGPT or Google?', a: 'Bloom is built specifically for Irish state exams. The AI knows the SEC marking schemes, curriculum topics, and exam styles. Generic AI tools don\'t understand the difference between a Leaving Cert H1 essay and a general response. Bloom does.' },
  { q: 'What does the Premium plan include?', a: 'Premium gives unlimited access to all features: unlimited AI Tutor messages, unlimited exam grading, unlimited flashcard creation, audio podcast learning, full analytics dashboard, exam grade predictions, and priority AI. All for €9.99/month — less than one grinds session.' },
  { q: 'Is there a free version?', a: 'Yes. The free plan includes 10 AI messages per day, 3 exam gradings per month, and basic flashcard creation. It\'s a genuine free tier — no credit card required and it never expires.' },
  { q: 'Can my child use it on their phone?', a: 'Absolutely. Bloom Studies works beautifully on all devices. The Audio Learning feature is particularly popular with students who listen to AI-generated revision podcasts on the go.' },
]

const TOOLS = [
  { icon: Brain, title: 'AI Tutor', desc: 'A patient, knowledgeable AI tutor available 24/7. Explains any concept at any difficulty level, aligned to Irish curriculum.', color: 'from-violet-500 to-purple-600', stat: '24/7', statLabel: 'availability' },
  { icon: CheckCircle, title: 'Exam Grader', desc: 'Students submit answers and receive detailed feedback based on actual SEC marking schemes — with estimated grades, strengths, and improvements.', color: 'from-fuchsia-500 to-pink-600', stat: 'H1–H8', statLabel: 'grade accuracy' },
  { icon: BookOpen, title: 'AI Notes', desc: 'Upload textbooks, notes, or past papers. AI creates concise summaries, definitions, revision notes, and mind maps automatically.', color: 'from-blue-500 to-indigo-600', stat: '90%', statLabel: 'time saved' },
  { icon: BarChart3, title: 'Flashcards', desc: 'Spaced repetition flashcards generated from any topic. Proven by science to improve long-term retention before exams.', color: 'from-emerald-500 to-teal-600', stat: '3×', statLabel: 'better retention' },
  { icon: Clock, title: 'Study Planner', desc: 'AI builds a personalised daily, weekly, and monthly revision schedule based on your child\'s exam dates, subjects, and available study time.', color: 'from-amber-500 to-orange-500', stat: '100%', statLabel: 'personalised' },
  { icon: TrendingUp, title: 'Analytics', desc: 'Track study hours, scores, streaks, and improvement across all subjects. AI predicts CAO points based on current performance.', color: 'from-cyan-500 to-blue-500', stat: 'Live', statLabel: 'progress data' },
]

const TESTIMONIALS = [
  { name: 'Mary Walsh', role: 'Parent · Galway', avatar: '👩', quote: 'My daughter went from failing maths to getting H2s. The AI tutor is patient and explains every concept step by step. Worth every penny — it\'s cheaper than one grinds session.', rating: 5 },
  { name: 'Aoife Murphy', role: 'Leaving Cert Student · Dublin', avatar: '👩‍🎓', quote: 'Bloom completely changed how I study. I got my first H1 mock result two weeks after starting. The AI explains things better than any YouTube video I\'ve found.', rating: 5 },
  { name: 'Ms. Patricia Ryan', role: 'Secondary Teacher · Cork', avatar: '👩‍🏫', quote: 'I recommend Bloom to all my students. The AI explanations are accurate and aligned to the curriculum. It\'s like having a top grinds tutor for every student.', rating: 5 },
  { name: 'Pádraig Kelly', role: 'Parent · Limerick', avatar: '👨', quote: 'My son used to hate studying. Now he actually looks forward to using Bloom. The gamification keeps him motivated and the streak system works brilliantly.', rating: 5 },
  { name: 'Ciarán O\'Brien', role: 'Leaving Cert Student · Mayo', avatar: '🧑‍💻', quote: 'The exam grader is unbelievable. It tells you exactly what the examiner is looking for. My English essays went from H3 to H1 in a month.', rating: 5 },
  { name: 'Sinéad Brennan', role: 'Parent · Kildare', avatar: '👩', quote: 'Safer and more effective than letting them loose on ChatGPT. Bloom stays focused on education and the content is appropriate. Highly recommend.', rating: 5 },
]

const WHY_BLOOM = [
  { icon: Shield, title: 'Safe by design', desc: 'Built exclusively for education. AI content is filtered and appropriate. GDPR compliant. No ads, no data selling.', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { icon: GraduationCap, title: 'Irish curriculum aligned', desc: 'Not generic AI. Every feature is built specifically for Junior Cycle and Leaving Certificate students and SEC marking schemes.', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  { icon: Heart, title: 'Student independence', desc: 'Bloom teaches students how to learn, not just gives them answers. Your child builds genuine understanding.', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  { icon: Target, title: 'Replaces expensive grinds', desc: 'Premium access costs less than one grinds hour per month — and your child can use it at 2am the night before an exam.', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { icon: TrendingUp, title: 'Measurable improvement', desc: '95% of students report grade improvement within 4 weeks. Analytics make progress visible and motivating.', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { icon: Bell, title: 'Study consistency', desc: 'Daily streaks, reminders, and a study planner keep students revising consistently — not just cramming the night before.', color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30' },
]

export default function ParentsPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Bloom Studies" width={34} height={34} className="rounded-xl" />
            <span className="font-display font-bold text-lg text-slate-900 dark:text-white">Bloom Studies</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
            {['Why Bloom', 'Tools', 'Safety', 'Pricing', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="hidden md:block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Sign In</Link>
            <Link href="/auth/signup" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white text-sm font-bold hover:shadow-lg hover:shadow-primary-500/25 transition-all">Get Started Free</Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-slate-600 dark:text-slate-400">{menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden px-4 py-4 space-y-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            {['Why Bloom', 'Tools', 'Safety', 'Pricing', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-slate-700 dark:text-slate-300">{item}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary-300/20 to-accent-300/15 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-primary-400/15 to-accent-300/10 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6 animate-fade-in">
                <Heart className="w-4 h-4" /> Designed for Irish Families
              </div>
              <h1 className="font-display text-5xl sm:text-6xl font-black text-slate-900 dark:text-white leading-[0.95] mb-6 animate-fade-in-up">
                Give your child the
                <span className="block bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 bg-clip-text text-transparent">
                  best chance to succeed.
                </span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                Bloom Studies is Ireland's AI-powered learning platform built specifically for <strong className="text-slate-900 dark:text-white">Junior Cycle</strong> and <strong className="text-slate-900 dark:text-white">Leaving Certificate</strong> students. Like having a private tutor, exam grader, and study coach — available 24/7 for less than the price of one grinds session.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <Link href="/auth/signup" className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-lg hover:shadow-2xl hover:shadow-primary-500/25 hover:scale-[1.02] transition-all">
                  Start Free for Your Child <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#tools" className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-lg hover:border-primary-400 transition-all">
                  See How It Works
                </a>
              </div>
              <div className="flex flex-wrap gap-4 mt-6 text-sm text-slate-500 dark:text-slate-400">
                {['Free plan available', 'No credit card needed', 'Cancel anytime', 'GDPR compliant'].map(item => (
                  <div key={item} className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />{item}</div>
                ))}
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative animate-scale-in hidden lg:block" style={{ animationDelay: '0.3s' }}>
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl shadow-primary-500/10 bg-gradient-to-br from-primary-500 via-accent-500 to-purple-600 p-6">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[{ icon:'🔥', label:'Study Streak', val:'12 days' }, { icon:'⭐', label:'Bloom Score', val:'847' }, { icon:'🎯', label:'Predicted', val:'H1 Maths' }, { icon:'📈', label:'Improvement', val:'+23%' }].map(s => (
                    <div key={s.label} className="bg-white/15 rounded-xl p-3 backdrop-blur-sm text-white">
                      <div className="text-xl mb-1">{s.icon}</div>
                      <div className="font-display font-bold">{s.val}</div>
                      <div className="text-white/70 text-xs">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm text-white text-sm">
                  <div className="flex items-center gap-2 mb-2 text-white/70 text-xs"><Sparkles className="w-3 h-3" /> Bloom AI Tutor</div>
                  <p className="leading-relaxed">Great question about calculus! Let me break down differentiation step by step. First, think of the derivative as the <strong>instantaneous rate of change</strong>…</p>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -left-6 top-8 bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-xl border border-slate-200 dark:border-slate-700 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="text-xl font-display font-black text-emerald-500">H1</div>
                <div className="text-xs text-slate-500">Grade prediction</div>
              </div>
              <div className="absolute -right-6 bottom-8 bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-xl border border-slate-200 dark:border-slate-700 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                <div className="text-xl font-display font-black text-primary-500">95%</div>
                <div className="text-xs text-slate-500">of students improve</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[{ end:15000, suffix:'+', label:'Active Students' }, { end:95, suffix:'%', label:'Report Grade Improvement' }, { end:38, suffix:'', label:'Subjects Covered' }, { end:9, suffix:'.99', prefix:'€', label:'Per Month for Premium' }].map(s => (
            <div key={s.label}>
              <div className="font-display text-4xl sm:text-5xl font-black bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                <Counter end={s.end} suffix={s.suffix} prefix={s.prefix} />
              </div>
              <div className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY BLOOM ── */}
      <section id="why-bloom" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4">
              <Star className="w-4 h-4" /> Why parents choose Bloom
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4">
              More than a study app.<br />
              <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">A complete learning partner.</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Built specifically for the Irish education system — not a generic AI tool repurposed for students.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_BLOOM.map((item, i) => (
              <div key={i} className={cn('p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all group')}>
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform', item.bg)}>
                  <item.icon className={cn('w-6 h-6', item.color)} />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section id="tools" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" /> AI-powered tools
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Six tools. One platform.<br />
              <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Unlimited support.</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Everything your child needs to study smarter, stay organised, and build genuine exam confidence.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOOLS.map((tool, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all">
                <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5 group-hover:scale-110 transition-transform', tool.color)}>
                  <tool.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{tool.title}</h3>
                  <div className="text-right shrink-0 ml-2">
                    <div className="font-display font-black text-lg bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">{tool.stat}</div>
                    <div className="text-xs text-slate-400">{tool.statLabel}</div>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROGRESS TRACKING ── */}
      <section id="progress" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
                <BarChart3 className="w-4 h-4" /> Progress & consistency
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-5">
                Know exactly how<br />
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">your child is doing.</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">Bloom's analytics dashboard shows study hours, subject performance, quiz scores, and consistency over time. AI predicts CAO points based on current progress — giving your family a realistic, data-driven view of exam readiness.</p>
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, label: 'Subject-by-subject performance tracking', color: 'text-violet-500' },
                  { icon: Clock, label: 'Study hours and daily streak monitoring', color: 'text-amber-500' },
                  { icon: Target, label: 'Predicted Leaving Cert grades and CAO points', color: 'text-emerald-500' },
                  { icon: Bell, label: 'AI-identified weak topics needing attention', color: 'text-blue-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className={cn('w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm', item.color)}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{item.label}</span>
                    <Check className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
                  </div>
                ))}
              </div>
              {/* Future-proof notice */}
              <div className="mt-6 p-4 rounded-xl border border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-950/20">
                <p className="text-sm text-primary-700 dark:text-primary-400"><strong>Coming soon:</strong> Parent accounts with weekly progress reports, subject alerts, and shared analytics — so you can stay involved without hovering. Your child's privacy and independence remain protected.</p>
              </div>
            </div>
            {/* Visual */}
            <div className="relative">
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl shadow-primary-500/5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display font-bold text-slate-900 dark:text-white">Your Child's Progress</h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium">↑ Improving</span>
                </div>
                <div className="space-y-4">
                  {[{ subject:'Mathematics', score:84, change:'+12%', color:'from-violet-500 to-purple-600' }, { subject:'English', score:78, change:'+8%', color:'from-fuchsia-500 to-pink-600' }, { subject:'Biology', score:91, change:'+15%', color:'from-emerald-500 to-teal-600' }, { subject:'Chemistry', score:72, change:'+6%', color:'from-amber-500 to-orange-500' }].map(s => (
                    <div key={s.subject}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{s.subject}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{s.score}%</span>
                          <span className="text-emerald-500 text-xs font-semibold">{s.change}</span>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', s.color)} style={{ width:`${s.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3">
                  {[['Streak','14 days','🔥'],['This Week','12.5h','⏱️'],['Predicted','575 pts','🎯']].map(([l,v,e])=>(
                    <div key={l} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <div className="text-lg">{e}</div>
                      <div className="font-display font-bold text-slate-900 dark:text-white text-sm mt-0.5">{v}</div>
                      <div className="text-xs text-slate-400">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SAFETY ── */}
      <section id="safety" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" /> Safe & trusted
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-5">
            AI that parents can trust.
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">Bloom is not a general-purpose AI. It is a focused, safe educational tool designed to support learning — nothing else.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Lock, title: 'GDPR Compliant', desc: 'Student data is never sold, shared, or used for advertising. Full EU data protection compliance.', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
              { icon: Eye, title: 'Educational Focus', desc: 'AI responses are filtered to remain educationally appropriate. No off-topic, harmful, or inappropriate content.', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
              { icon: GraduationCap, title: 'Curriculum Aligned', desc: 'Every feature is built to Irish curriculum standards. No generic content. No misinformation about exam requirements.', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30' },
              { icon: Users, title: 'No Social Risk', desc: 'No public social features expose your child to strangers. The Community section connects only with other verified Irish students.', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all text-left">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', item.bg)}>
                  <item.icon className={cn('w-6 h-6', item.color)} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="flex justify-center gap-1 mb-4">{[...Array(5)].map((_,i)=><Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />)}</div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4">What families are saying</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">Real results from Irish students, parents, and teachers</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all">
                <div className="flex gap-1 mb-4">{[...Array(t.rating)].map((_,j)=><Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-lg">{t.avatar}</div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4">Simple, honest pricing</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">Less than one grinds session. Unlimited access for your child.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700">
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-1">Free Plan</h3>
              <div className="text-4xl font-display font-black text-slate-900 dark:text-white mb-1">€0</div>
              <div className="text-slate-400 text-sm mb-6">Forever free · No credit card</div>
              <ul className="space-y-3 mb-8">
                {['10 AI messages per day', '3 exam gradings per month', 'Basic flashcard creation', 'Study planner', 'Community access'].map((f,i)=>(
                  <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300"><Check className="w-4 h-4 text-emerald-500 shrink-0" />{f}</li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full text-center py-3.5 rounded-xl border-2 border-primary-500 text-primary-600 dark:text-primary-400 font-bold hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all">Get Started Free</Link>
            </div>
            {/* Premium */}
            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 text-white border-2 border-primary-400 shadow-2xl shadow-primary-500/20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-400 text-amber-900 text-xs font-black">MOST POPULAR</div>
              <h3 className="font-display text-xl font-bold mb-1">Premium</h3>
              <div className="flex items-end gap-2 mb-1">
                <div className="text-4xl font-display font-black">€9.99</div>
                <div className="text-white/70 mb-1.5 text-sm">/month</div>
              </div>
              <div className="text-white/70 text-sm mb-6">Less than one grinds hour</div>
              <ul className="space-y-3 mb-8">
                {['Unlimited AI Tutor messages', 'Unlimited exam grading', 'Unlimited flashcard decks', 'AI Notes with PDF export', 'Audio podcast learning', 'Full analytics dashboard', 'Exam grade predictions', 'Priority AI responses', 'Community + Bloom Learn'].map((f,i)=>(
                  <li key={i} className="flex items-center gap-2.5 text-sm text-white/90"><div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Check className="w-2.5 h-2.5 text-white" /></div>{f}</li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full text-center py-3.5 rounded-xl bg-white text-primary-700 font-black hover:shadow-xl transition-all hover:scale-[1.01]">Start Free Trial</Link>
              <p className="text-white/60 text-xs text-center mt-3">Cancel anytime · Secure checkout via Stripe</p>
            </div>
          </div>
          {/* School plan teaser */}
          <div className="mt-6 p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm"><strong className="text-slate-900 dark:text-white">School plans available.</strong> Discounted whole-school access with teacher dashboards, class analytics, and dedicated support. <a href="mailto:schools@bloomstudies.ie" className="text-primary-600 dark:text-primary-400 hover:underline">Contact us →</a></p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4">Questions from parents</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">Everything you need to know before your child gets started</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors gap-4">
                  <span className="font-semibold text-slate-900 dark:text-white">{faq.q}</span>
                  <ChevronDown className={cn('w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed animate-fade-in border-t border-slate-100 dark:border-slate-700 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-accent-600 to-purple-700" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage:'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize:'32px 32px' }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="text-5xl mb-6">🌸</div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5">
            Give your child the best<br />possible start.
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Bloom Studies is Ireland's most comprehensive AI study platform — designed for Junior Cycle and Leaving Certificate students. Start free today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="group flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-white text-primary-700 font-black text-lg hover:shadow-2xl hover:scale-[1.02] transition-all">
              Start Free for Your Child <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/" className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl border-2 border-white/30 text-white font-bold text-lg hover:bg-white/10 transition-all">
              View Full Platform
            </Link>
          </div>
          <p className="text-white/50 text-sm mt-5">Free plan available · GDPR compliant · Cancel anytime · Made in Ireland 🇮🇪</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Bloom" width={28} height={28} className="rounded-lg" />
            <span className="font-display font-semibold text-white">Bloom Studies</span>
            <span>© 2025</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">Get Started</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span className="text-slate-500">Made with 🌸 in Ireland</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

