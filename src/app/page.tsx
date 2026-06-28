'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import {
  ArrowRight, Sparkles, Brain, Layers, FileCheck, Headphones, Calendar,
  Star, Check, ChevronDown, Menu, X, Play,
  Zap, Shield, Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Animated counter
function Counter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const step = end / (duration / 16)
        let cur = 0
        const t = setInterval(() => {
          cur = Math.min(cur + step, end)
          setCount(Math.floor(cur))
          if (cur >= end) clearInterval(t)
        }, 16)
      }
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end, duration])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

const FEATURES = [
  { icon: Brain, title: 'AI Tutor', desc: 'Your personal Irish teacher available 24/7. Ask questions, get exam-focused answers with full markdown, tables and diagrams.', color: 'from-violet-500 to-purple-600', tag: 'Most Popular' },
  { icon: FileCheck, title: 'Exam Grader', desc: 'Upload any answer and get SEC-aligned grading with estimated grades, marks, feedback, and a model answer.', color: 'from-fuchsia-500 to-pink-600', tag: 'Game Changer' },
  { icon: Layers, title: 'AI Flashcards', desc: 'Upload notes and AI creates flashcards, MCQs, true/false, and fill-in-the-blank with spaced repetition.', color: 'from-blue-500 to-indigo-600', tag: 'Study Smarter' },
  { icon: BookOpen, title: 'AI Notes', desc: 'Upload PDFs, Word docs, or images. AI summarises, explains, extracts definitions, creates mind maps, and exports as PDF.', color: 'from-emerald-500 to-teal-600', tag: 'Time Saver' },
  { icon: Headphones, title: 'Audio Learning', desc: 'Turn any notes into a professional educational podcast with chapters, bookmarks, and transcript view.', color: 'from-orange-500 to-red-500', tag: 'On the Go' },
  { icon: Calendar, title: 'Study Planner', desc: 'Enter your subjects, exam dates, and schedule. AI builds your complete daily, weekly, and monthly revision plan.', color: 'from-cyan-500 to-blue-500', tag: 'Stay Organised' },
]

const TESTIMONIALS = [
  { name: 'Aoife Murphy', school: 'Leaving Cert 2025', grade: 'H1 Maths', text: "Bloom completely changed how I study. The AI Tutor explains things better than any YouTube video I've found. Got my first H1 mock result after two weeks.", avatar: '👩‍🎓' },
  { name: 'Ciarán Ó\'Brien', school: 'Coláiste Íde, Dublin', grade: '580 CAO Points', text: "The exam grader is unbelievable. It tells you exactly what the examiner is looking for. My English essays went from H3 to H1 in a month.", avatar: '🧑‍🎓' },
  { name: 'Siobhán Kelly', school: 'Junior Cycle 2025', grade: 'Distinction in Science', text: "I uploaded my science notes and it made flashcards, a quiz, AND a podcast. I listen while walking to school. Genuinely brilliant.", avatar: '👩‍🔬' },
  { name: 'Ms. Patricia Ryan', school: 'Secondary Teacher, Cork', grade: 'Teacher', text: "I recommend Bloom to all my students. The AI explanations are accurate and aligned to the curriculum. It's like having a top tutor for every student.", avatar: '👩‍🏫' },
  { name: 'Fionn Gallagher', school: 'DCU Engineering Student', grade: 'A-Level Equiv.', text: "Used Bloom through my Leaving Cert. The study planner kept me on track and the spaced repetition flashcards meant I actually retained information.", avatar: '👨‍💻' },
  { name: 'Mary Walsh', school: 'Parent, Galway', grade: 'Parent', text: "My daughter went from failing maths to getting H2s. The AI tutor is patient and explains every concept step by step. Worth every penny.", avatar: '👩' },
]

const PRICING = [
  {
    name: 'Free', price: 0, period: 'forever',
    color: 'border-slate-200 dark:border-slate-700',
    features: ['AI Tutor (10 messages/day)', 'Basic flashcards', '3 exam gradings/month', 'Study planner'],
    cta: 'Get Started Free', ctaStyle: 'border-2 border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30',
  },
  {
    name: 'Student', price: 9.99, period: 'per month',
    color: 'border-primary-500 shadow-2xl shadow-primary-500/20',
    badge: 'Most Popular',
    features: ['Unlimited AI Tutor', 'Unlimited flashcards', 'Unlimited exam grading', 'AI Notes + PDF export', 'Audio podcasts', 'Study planner', 'Analytics dashboard', 'Priority support'],
    cta: 'Start Free Trial', ctaStyle: 'bg-gradient-to-r from-primary-600 to-accent-500 text-white hover:shadow-xl hover:shadow-primary-500/30',
  },
  {
    name: 'School', price: 4.99, period: 'per student/month',
    color: 'border-slate-200 dark:border-slate-700',
    features: ['Everything in Student', 'Teacher dashboard', 'Class analytics', 'Custom branding', 'Bulk student management', 'Dedicated support', 'Training included'],
    cta: 'Contact Us', ctaStyle: 'border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
  },
]

const FAQS = [
  { q: 'Is Bloom Studies aligned to the Irish curriculum?', a: 'Yes — every feature is built specifically for Junior Cycle and Leaving Certificate students. Our AI is trained on SEC marking schemes, past papers, and the National Curriculum.' },
  { q: 'How accurate is the exam grader?', a: 'Our AI grader is calibrated against actual SEC marking schemes and has been validated by qualified Irish teachers. It provides grade estimates, mark breakdowns, and detailed feedback aligned to what examiners look for.' },
  { q: 'Can I use Bloom on my phone?', a: 'Absolutely. Bloom is fully responsive and works beautifully on all devices. The Audio Learning feature is perfect for studying on the go.' },
  { q: 'Is my data private and secure?', a: 'Your data is encrypted and never shared with third parties. We are GDPR compliant and your notes, submissions, and conversations are completely private.' },
  { q: 'Does the free plan expire?', a: 'No — the free plan is free forever with generous daily limits. You only need to upgrade if you want unlimited access to all features.' },
  { q: 'Can teachers use Bloom with their classes?', a: 'Yes! Our School plan gives teachers a dashboard to monitor class progress, assign tasks, and see individual student analytics. Contact us for a free school demo.' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState('students')

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Bloom Studies" width={36} height={36} className="rounded-xl" />
              <span className="font-display font-bold text-xl text-slate-900 dark:text-white">Bloom Studies</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Pricing', 'Schools', 'FAQ'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{item}</a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/signin" className="hidden md:block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Sign In</Link>
              <Link href="/auth/signup" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all">
                Get Started Free
              </Link>
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400">
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-3">
            {['Features', 'Pricing', 'Schools', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-700 dark:text-slate-300 py-2">{item}</a>
            ))}
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary-400/20 to-accent-400/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-primary-300/15 to-accent-300/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-primary-500/5 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              Ireland's #1 AI Study Platform for State Exams
              <span className="ml-1 px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs">New</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 dark:text-white mb-6 leading-[0.95] tracking-tight animate-fade-in-up">
              Study Smarter.
              <br />
              <span className="bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 bg-clip-text text-transparent">
                Score Higher.
              </span>
              <br />
              <span className="text-slate-400 dark:text-slate-500 text-4xl sm:text-5xl lg:text-6xl font-bold">Every Single Time.</span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Bloom is the AI-powered learning platform built for <strong className="text-slate-900 dark:text-white">Junior Cycle</strong> and <strong className="text-slate-900 dark:text-white">Leaving Certificate</strong> students. Your personal tutor, grader, and revision tool — all in one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/auth/signup" className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold text-lg hover:shadow-2xl hover:shadow-primary-500/30 hover:scale-[1.02] transition-all">
                Start For Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/dashboard" className="flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-primary-300 transition-all">
                <Play className="w-5 h-5 text-primary-500" />
                View Demo
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />Free forever plan</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />No credit card required</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />Built for Irish students</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />GDPR compliant</div>
            </div>
          </div>

          {/* Hero visual — dashboard preview */}
          <div className="mt-16 relative max-w-5xl mx-auto animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary-500/10 border border-slate-200 dark:border-slate-800">
              <div className="bg-gradient-to-br from-primary-500 via-accent-500 to-purple-600 p-8 text-white">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Study Streak', value: '12 days', icon: '🔥' },
                    { label: 'Bloom Score', value: '847', icon: '⭐' },
                    { label: 'Predicted', value: '565 pts', icon: '🎯' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/15 rounded-xl p-4 backdrop-blur-sm">
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <div className="text-2xl font-display font-bold">{s.value}</div>
                      <div className="text-white/70 text-xs">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-sm opacity-80 mb-2">🤖 Bloom AI Tutor</div>
                  <div className="text-sm leading-relaxed">Photosynthesis is the process by which plants use sunlight, water, and CO₂ to produce glucose and oxygen. For your Leaving Cert Biology, remember the <strong>light-dependent</strong> and <strong>light-independent</strong> reactions...</div>
                </div>
              </div>
            </div>
            {/* Floating cards */}
            <div className="absolute -left-8 top-8 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-700 hidden lg:block animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="text-2xl font-display font-bold text-emerald-500">H1</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Maths prediction</div>
            </div>
            <div className="absolute -right-8 bottom-8 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-700 hidden lg:block animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
              <div className="text-2xl font-display font-bold text-primary-500">+23%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Grade improvement</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { end: 15000, suffix: '+', label: 'Active Students' },
            { end: 95, suffix: '%', label: 'Improved Grades' },
            { end: 50, suffix: '+', label: 'Subjects Covered' },
            { end: 2500000, suffix: '+', label: 'Questions Answered' },
          ].map(s => (
            <div key={s.label}>
              <div className="font-display text-4xl sm:text-5xl font-black bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                <Counter end={s.end} suffix={s.suffix} />
              </div>
              <div className="text-slate-500 dark:text-slate-400 mt-2 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" /> Everything You Need
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Six powerful tools.<br />
              <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">One platform.</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Built specifically for the Irish curriculum by educators and AI engineers who understand what it takes to get top grades.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="group relative p-7 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-slate-900 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300">
                {f.tag && <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 text-xs font-semibold border border-primary-200 dark:border-primary-800">{f.tag}</span>}
                <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5 group-hover:scale-110 transition-transform', f.color)}>
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-3">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                <Link href="/auth/signup" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:gap-3 transition-all">
                  Try it free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IS IT FOR */}
      <section id="schools" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4">Built for everyone in education</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">Whether you're a student, teacher, parent, or school — Bloom works for you.</p>
          </div>
          <div className="flex gap-3 justify-center mb-10 flex-wrap">
            {['students', 'teachers', 'parents', 'schools'].map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={cn('px-6 py-3 rounded-xl text-sm font-semibold capitalize transition-all', activeSection === s ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-lg shadow-primary-500/25' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-400')}>
                {s === 'students' ? '🎓 Students' : s === 'teachers' ? '👩‍🏫 Teachers' : s === 'parents' ? '👨‍👩‍👧 Parents' : '🏫 Schools'}
              </button>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              {activeSection === 'students' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Get the grades you deserve</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400">Bloom is like having a private tutor, a marking examiner, and a study coach — all working for you 24/7, for less than the price of one grinds session.</p>
                  {['AI Tutor that knows the Irish curriculum inside out', 'Exam grader calibrated to SEC marking schemes', 'Spaced repetition flashcards for long-term retention', 'Study planner that works around your schedule', 'Audio podcasts for passive learning on the go'].map((item, i) => (
                    <div key={i} className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-white" /></div><span className="text-slate-700 dark:text-slate-300">{item}</span></div>
                  ))}
                </div>
              )}
              {activeSection === 'teachers' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Empower your students</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400">Bloom gives teachers powerful tools to extend learning beyond the classroom and track every student's progress in real time.</p>
                  {['Class analytics dashboard to identify struggling students', 'Assign AI-generated quizzes and flashcard sets', 'Track study hours, scores, and engagement', 'Curriculum-aligned content for every subject', 'Easy to set up — no technical knowledge needed'].map((item, i) => (
                    <div key={i} className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-white" /></div><span className="text-slate-700 dark:text-slate-300">{item}</span></div>
                  ))}
                </div>
              )}
              {activeSection === 'parents' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Give your child every advantage</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400">Bloom gives your child access to expert-level study tools at a fraction of the cost of private grinds — available whenever they need it.</p>
                  {['Safer, more effective than random YouTube videos', 'Progress reports you can view at any time', 'Encourages independent, self-directed learning', 'Study streaks and achievements keep kids motivated', 'Less than €10/month — cheaper than one grinds hour'].map((item, i) => (
                    <div key={i} className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-white" /></div><span className="text-slate-700 dark:text-slate-300">{item}</span></div>
                  ))}
                </div>
              )}
              {activeSection === 'schools' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Transform your school's results</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400">School-wide access to Bloom creates a culture of consistent, effective revision that measurably improves CAO points and state exam results.</p>
                  {['School-wide dashboard with all student data', 'Discounted bulk pricing for whole-school rollout', 'Teacher training and onboarding included', 'Custom school branding available', 'Dedicated account manager and support'].map((item, i) => (
                    <div key={i} className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-white" /></div><span className="text-slate-700 dark:text-slate-300">{item}</span></div>
                  ))}
                </div>
              )}
              <Link href="/auth/signup" className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold hover:shadow-xl hover:shadow-primary-500/25 transition-all">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            {/* Visual */}
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-200 dark:border-primary-800 flex items-center justify-center p-10">
                <div className="grid grid-cols-2 gap-4 w-full">
                  {[
                    { icon: '🧠', label: 'AI Tutor', val: '24/7' },
                    { icon: '📝', label: 'Exam Grader', val: 'Instant' },
                    { icon: '🃏', label: 'Flashcards', val: '10,000+' },
                    { icon: '🎧', label: 'Podcasts', val: 'Auto-gen' },
                  ].map(item => (
                    <div key={item.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-100 dark:border-slate-700 text-center">
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="font-display font-bold text-primary-600 dark:text-primary-400">{item.val}</div>
                      <div className="text-xs text-slate-500 mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />)}
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4">Loved by Irish students</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">Join thousands of students already transforming their results</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-lg">{t.avatar}</div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.school} · <span className="text-primary-600 dark:text-primary-400 font-medium">{t.grade}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4">Simple, honest pricing</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">Less than one grinds session. Unlimited access to everything.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING.map((plan, i) => (
              <div key={i} className={cn('relative p-7 rounded-2xl bg-white dark:bg-slate-800 border-2 transition-all', plan.color)}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary-600 to-accent-500 text-white text-xs font-bold whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-4xl font-display font-black text-slate-900 dark:text-white">€{plan.price}</span>
                    <span className="text-slate-500 dark:text-slate-400 mb-1 text-sm">/{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-7">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <Check className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className={cn('block w-full text-center py-3.5 rounded-xl font-bold transition-all', plan.ctaStyle)}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <span className="font-semibold text-slate-900 dark:text-white pr-4">{faq.q}</span>
                  <ChevronDown className={cn('w-5 h-5 text-slate-400 shrink-0 transition-transform', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-accent-600 to-purple-700" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="text-6xl mb-6">🌸</div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            Your best results start here.
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join 15,000+ Irish students already using Bloom to study smarter and achieve grades they're proud of.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="group flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-white text-primary-700 font-black text-lg hover:shadow-2xl hover:scale-[1.02] transition-all">
              Start Free Today <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/dashboard" className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl border-2 border-white/30 text-white font-bold text-lg hover:bg-white/10 transition-all">
              Explore the App
            </Link>
          </div>
          <p className="mt-6 text-white/60 text-sm">Free forever · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo.png" alt="Bloom" width={36} height={36} className="rounded-xl" />
                <span className="font-display font-bold text-xl text-white">Bloom Studies</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">Ireland's AI-powered learning platform for Junior Cycle and Leaving Certificate students.</p>
              <div className="flex items-center gap-1">{[...Array(5)].map((_, i)=><Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400"/>)}<span className="text-xs ml-1">4.9/5 from 2,000+ reviews</span></div>
            </div>
            {[
              { title: 'Product', links: ['AI Tutor', 'Exam Grader', 'Flashcards', 'AI Notes', 'Audio Learning', 'Study Planner', 'Analytics'] },
              { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Press', 'Contact', 'Privacy Policy', 'Terms of Service'] },
              { title: 'For Schools', links: ['School Plans', 'Teacher Tools', 'Parent Portal', 'Case Studies', 'Demo Request', 'Partnerships'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}><a href="#" className="text-sm hover:text-primary-400 transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p>© 2025 Bloom Studies Ltd. All rights reserved. Made with 🌸 in Ireland.</p>
            <div className="flex items-center gap-4">
              <Shield className="w-4 h-4 text-primary-400" /><span>GDPR Compliant</span>
              <Globe className="w-4 h-4 text-primary-400" /><span>Irish Curriculum</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


