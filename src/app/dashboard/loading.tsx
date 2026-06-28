import { StatCardSkeleton, CardSkeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="page-container py-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-8 w-56 rounded-xl" />
          <div className="skeleton h-4 w-72 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-32 rounded-xl" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <StatCardSkeleton key={i} />)}
      </div>
      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0,1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><CardSkeleton lines={4} /></div>
        <CardSkeleton lines={3} />
      </div>
    </div>
  )
}
