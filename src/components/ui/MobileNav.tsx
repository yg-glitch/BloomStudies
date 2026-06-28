'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Brain, FileCheck, Layers, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_NAV = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tutor', href: '/dashboard/tutor', icon: Brain },
  { name: 'Grader', href: '/dashboard/grader', icon: FileCheck },
  { name: 'Flashcards', href: '/dashboard/flashcards', icon: Layers },
  { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {MOBILE_NAV.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[56px]',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150',
                isActive ? 'bg-primary-100 dark:bg-primary-950/60' : ''
              )}>
                <item.icon className="w-[18px] h-[18px]" aria-hidden="true" />
              </div>
              <span className={cn('text-[10px] font-semibold', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500')}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
