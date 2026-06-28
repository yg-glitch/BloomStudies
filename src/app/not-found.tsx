import Link from 'next/link'
import Image from 'next/image'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md animate-fade-in">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Image src="/logo.png" alt="Bloom Studies" width={32} height={32} className="rounded-xl" />
          <span className="font-display font-bold text-white">Bloom Studies</span>
        </Link>

        {/* 404 illustration */}
        <div className="relative mb-8">
          <div className="font-display text-[120px] font-black leading-none bg-gradient-to-br from-primary-500 to-accent-500 bg-clip-text text-transparent select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl animate-float">🌸</div>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
          Looks like this page bloomed away. Let's get you back on track for your exams.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="btn-primary">
            <Home className="w-4 h-4" /> Go to Dashboard
          </Link>
          <Link href="/dashboard/tutor" className="btn-secondary bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
            <Search className="w-4 h-4" /> Ask AI Tutor
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 text-left">
          {[
            { href: '/dashboard/tutor', label: 'AI Tutor', desc: 'Get instant help' },
            { href: '/dashboard/grader', label: 'Exam Grader', desc: 'Grade your answers' },
            { href: '/dashboard/flashcards', label: 'Flashcards', desc: 'Study smarter' },
            { href: '/dashboard/planner', label: 'Study Planner', desc: 'Plan your revision' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-primary-700 transition-all group">
              <p className="font-semibold text-white text-sm group-hover:text-primary-400 transition-colors">{item.label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
