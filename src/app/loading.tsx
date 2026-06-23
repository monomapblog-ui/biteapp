import { JobCardSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-3 pb-4">
      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5">
        <div className="h-6 w-36 bg-white/30 rounded-lg mb-2" />
        <div className="h-4 w-48 bg-white/20 rounded mb-3" />
        <div className="flex gap-3">
          <div className="bg-white/20 rounded-xl px-4 py-2 w-16 h-14" />
          <div className="bg-white/20 rounded-xl px-4 py-2 w-16 h-14" />
        </div>
      </div>
      {/* Filter skeleton */}
      <div className="flex gap-2">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-8 w-16 bg-gray-200 rounded-full animate-pulse" />
        ))}
      </div>
      {/* Cards */}
      {[1,2,3,4,5].map(i => <JobCardSkeleton key={i} />)}
    </div>
  )
}
