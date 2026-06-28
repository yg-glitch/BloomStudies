import { CardSkeleton } from '@/components/ui/Skeleton'

export default function GraderLoading() {
  return (
    <div className="page-container py-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="space-y-1.5">
          <div className="skeleton h-6 w-40 rounded-lg" />
          <div className="skeleton h-3.5 w-56 rounded-md" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0,1,2,3,4,5].map(i => <CardSkeleton key={i} lines={3} />)}
      </div>
    </div>
  )
}
