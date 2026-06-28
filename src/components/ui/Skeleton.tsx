import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('skeleton-shimmer rounded-lg', className)} aria-hidden="true" />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl card animate-fade-in">
      <Skeleton className="w-10 h-10 rounded-xl mb-4" />
      <Skeleton className="w-16 h-7 mb-2" />
      <Skeleton className="w-24 h-4" />
    </div>
  )
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="p-5 rounded-2xl card animate-fade-in space-y-3">
      <Skeleton className="w-32 h-5" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}
