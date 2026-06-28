import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  gradient?: string
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  action,
  gradient = 'from-primary-500 to-accent-500'
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20',
          gradient
        )}>
          <Icon className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="section-heading leading-none">{title}</h1>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
