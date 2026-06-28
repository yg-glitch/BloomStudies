'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Brain, FileCheck, Layers, BookOpen,
  Headphones, FileText, Calendar, TrendingUp, Settings,
  ChevronLeft, ChevronRight, Moon, Sun, Users, GraduationCap,
  Sparkles, Crown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import UpgradePrompt from '@/components/ui/UpgradePrompt'

const NAV_GROUPS = [
  {
    label: 'Learn',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'AI Tutor', href: '/dashboard/tutor', icon: Brain, badge: 'AI' },
      { name: 'Exam Grader', href: '/dashboard/grader', icon: FileCheck },
      { name: 'Flashcards', href: '/dashboard/flashcards', icon: Layers },
      { name: 'AI Notes', href: '/dashboard/notes', icon: BookOpen },
      { name: 'Audio Learning', href: '/dashboard/audio', icon: Headphones },
    ],
  },
  {
    label: 'Plan',
    items: [
      { name: 'Study Planner', href: '/dashboard/planner', icon: Calendar },
      { name: 'Past Papers', href: '/dashboard/papers', icon: FileText },
      { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp },
    ],
  },
  {
    label: 'Community',
    items: [
      { name: 'Community', href: '/dashboard/community', icon: Users, badge: 'New' },
      { name: 'Bloom Learn', href: '/dashboard/learn', icon: GraduationCap },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => { setIsMobileOpen(false) }, [pathname])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMobileOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open navigation"
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          'fixed left-0 top-0 h-screen flex flex-col',
          'bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800',
          'transition-all duration-300 ease-in-out z-40',
          isCollapsed ? 'w-[72px]' : 'w-64',
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo + collapse */}
        <div className={cn(
          'flex items-center border-b border-slate-200 dark:border-slate-800 shrink-0',
          isCollapsed ? 'h-16 justify-center px-3' : 'h-16 justify-between px-4'
        )}>
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <Image src="/logo.png" alt="Bloom Studies" width={32} height={32} className="rounded-lg shrink-0" />
              <span className="font-display font-bold text-slate-900 dark:text-white text-base truncate">Bloom Studies</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard" aria-label="Bloom Studies home">
              <Image src="/logo.png" alt="Bloom" width={32} height={32} className="rounded-lg" />
            </Link>
          )}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              aria-label="Collapse sidebar"
              className="btn-icon shrink-0 hidden lg:flex"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4 scrollbar-hide">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              {!isCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  return (
                    <div key={item.name} className="relative group/nav">
                      <Link
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-xl transition-all duration-150',
                          isCollapsed ? 'h-10 w-10 mx-auto justify-center' : 'px-3 py-2.5',
                          isActive
                            ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md shadow-primary-500/20'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                        )}
                      >
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span className="font-medium text-sm truncate">{item.name}</span>
                            {(item as any).badge && (
                              <span className={cn(
                                'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                                isActive
                                  ? 'bg-white/25 text-white'
                                  : 'bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
                              )}>
                                {(item as any).badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                      {/* Collapsed tooltip */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity z-50 shadow-lg">
                          {item.name}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-2 space-y-0.5">
          {/* Upgrade prompt — free users only */}
          {!isCollapsed && (
            <UpgradePrompt feature="Premium Features" description="Unlock unlimited AI access" inline />
          )}

          <Link
            href="/dashboard/settings"
            aria-label="Settings"
            className={cn(
              'flex items-center gap-3 rounded-xl transition-all duration-150',
              isCollapsed ? 'h-10 w-10 mx-auto justify-center' : 'px-3 py-2.5',
              pathname === '/dashboard/settings'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md shadow-primary-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Settings className="w-[18px] h-[18px] shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
          </Link>

          <div className={cn('flex', isCollapsed ? 'flex-col gap-0.5' : 'flex-row gap-1')}>
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className={cn(
                'btn-icon',
                isCollapsed ? 'mx-auto w-10 h-10' : 'flex-1'
              )}
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'btn-icon hidden lg:flex',
                isCollapsed ? 'mx-auto w-10 h-10' : 'flex-1'
              )}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
