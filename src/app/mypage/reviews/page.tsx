import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MyReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select('id, rating, comment, reviewer_role, created_at, reviewer_id, job_id')
    .eq('reviewee_id', user.id)
    .order('created_at', { ascending: false })

  const reviews = (reviewsRaw ?? []) as Array<{
    id: string; rating: number; comment: string | null; reviewer_role: string
    created_at: string; reviewer_id: string; job_id: string
  }>

  const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id))]
  const jobIds = [...new Set(reviews.map(r => r.job_id))]

  const [{ data: profilesRaw }, { data: jobsRaw }] = await Promise.all([
    reviewerIds.length > 0
      ? supabase.from('profiles').select('id, name').in('id', reviewerIds)
      : { data: [] },
    jobIds.length > 0
      ? supabase.from('jobs').select('id, title').in('id', jobIds)
      : { data: [] },
  ])

  const profileMap = Object.fromEntries(
    ((profilesRaw ?? []) as Array<{ id: string; name: string }>).map(p => [p.id, p])
  )
  const jobMap = Object.fromEntries(
    ((jobsRaw ?? []) as Array<{ id: string; title: string }>).map(j => [j.id, j])
  )

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="space-y-5 pb-8">
      <Link href="/mypage" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← マイページ
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">受け取った評価</h1>
        {avgRating && (
          <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-1.5">
            <span className="text-yellow-400 text-lg">★</span>
            <span className="font-bold text-gray-900">{avgRating}</span>
            <span className="text-xs text-gray-500">({reviews.length}件)</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">⭐</p>
          <p className="text-sm">まだ評価がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {profileMap[r.reviewer_id]?.name ?? '匿名'}
                    <span className="text-xs font-normal text-gray-400 ml-2">
                      {r.reviewer_role === 'employer' ? '企業' : 'ワーカー'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {jobMap[r.job_id]?.title ?? '案件'}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={s <= r.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                  ))}
                </div>
              </div>
              {r.comment && (
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">{r.comment}</p>
              )}
              <p className="text-xs text-gray-400">
                {new Date(r.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
