import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function EmployerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, created_at, role')
    .eq('id', id)
    .single()

  const profile = profileRaw as { id: string; name: string; avatar_url: string | null; created_at: string; role: string } | null
  if (!profile || (profile.role !== 'employer' && profile.role !== 'admin')) notFound()

  const [{ data: openJobsRaw }, { data: reviewsRaw }] = await Promise.all([
    supabase.from('jobs').select('id, title, work_date, start_time, end_time, hourly_rate, location, slots, remaining_slots')
      .eq('employer_id', id).eq('status', 'open').order('work_date', { ascending: true }),
    supabase.from('reviews').select('id, rating, comment, created_at')
      .eq('reviewee_id', id).eq('reviewer_role', 'worker').order('created_at', { ascending: false }),
  ])

  const openJobs = (openJobsRaw ?? []) as Array<{
    id: string; title: string; work_date: string; start_time: string; end_time: string
    hourly_rate: number; location: string; slots: number; remaining_slots: number
  }>
  const reviews = (reviewsRaw ?? []) as Array<{
    id: string; rating: number; comment: string | null; created_at: string
  }>

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const joinYear = new Date(profile.created_at).getFullYear()

  return (
    <div className="space-y-5 pb-8">
      <button onClick={() => history.back()} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← 戻る
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
            {profile.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profile.avatar_url} alt="logo" className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-blue-600">{profile.name.charAt(0)}</span>
            }
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              <Badge variant="default">企業</Badge>
            </div>
            <p className="text-sm text-gray-400">{joinYear}年登録</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xl font-bold text-gray-900">{openJobs.length}</p>
            <p className="text-xs text-gray-500">募集中案件</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-xl font-bold text-blue-600">{reviews.length}</p>
            <p className="text-xs text-gray-500">評価件数</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-xl">
            <p className="text-xl font-bold text-yellow-600">{avgRating ? `★${avgRating}` : '-'}</p>
            <p className="text-xs text-gray-500">平均評価</p>
          </div>
        </div>
      </div>

      {/* Open Jobs */}
      {openJobs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">募集中の案件</h2>
          <div className="space-y-3">
            {openJobs.map(job => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-1 -mx-1 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      📅 {formatDate(job.work_date)}　📍 {job.location}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-blue-600">{formatCurrency(job.hourly_rate)}</p>
                    <p className="text-xs text-gray-400">残{job.remaining_slots}枠</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">ワーカーからの評価</h2>
            {avgRating && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-yellow-400">★</span>
                <span className="font-bold">{avgRating}</span>
                <span className="text-gray-400">({reviews.length}件)</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={s <= r.rating ? 'text-yellow-400 text-sm' : 'text-gray-200 text-sm'}>★</span>
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {openJobs.length === 0 && reviews.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-sm">まだ情報がありません</p>
        </div>
      )}
    </div>
  )
}
