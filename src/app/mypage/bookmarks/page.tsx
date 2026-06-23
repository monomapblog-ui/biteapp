import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { BookmarkButton } from '@/components/jobs/BookmarkButton'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: bookmarksRaw } = await supabase
    .from('job_bookmarks')
    .select('job_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const bookmarks = (bookmarksRaw ?? []) as Array<{ job_id: string; created_at: string }>
  const jobIds = bookmarks.map(b => b.job_id)

  const { data: jobsRaw } = jobIds.length > 0
    ? await supabase
        .from('jobs_with_remaining')
        .select('id, title, work_date, start_time, end_time, hourly_rate, prefecture, location, status, remaining_slots, profiles!jobs_employer_id_fkey(name)')
        .in('id', jobIds)
    : { data: [] }

  const jobs = (jobsRaw ?? []) as Array<{
    id: string; title: string; work_date: string; start_time: string; end_time: string
    hourly_rate: number; prefecture: string; location: string; status: string; remaining_slots: number
    profiles: { name: string } | null
  }>

  const jobMap = Object.fromEntries(jobs.map(j => [j.id, j]))

  return (
    <div className="space-y-5 pb-8">
      <Link href="/mypage" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← マイページ
      </Link>
      <h1 className="text-xl font-bold text-gray-900">ブックマーク</h1>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">★</p>
          <p className="text-sm">ブックマークした案件はありません</p>
          <Link href="/" className="text-blue-600 text-sm underline mt-2 inline-block">案件を探す</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map(b => {
            const job = jobMap[b.job_id]
            if (!job) return null
            return (
              <div key={b.job_id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 relative">
                <div className="absolute top-3 right-3">
                  <BookmarkButton jobId={job.id} initialBookmarked={true} size="sm" />
                </div>
                <Link href={`/jobs/${job.id}`} className="block pr-10">
                  <p className="text-xs text-gray-400 mb-0.5">{job.profiles?.name}</p>
                  <p className="font-semibold text-gray-900 text-sm leading-snug mb-2">{job.title}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                    <span>📅 {formatDate(job.work_date)}</span>
                    <span>🕐 {job.start_time.slice(0,5)}〜{job.end_time.slice(0,5)}</span>
                    <span>📍 {job.prefecture}</span>
                    <span>💴 {formatCurrency(job.hourly_rate)}/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    {job.status !== 'open'
                      ? <Badge variant="default">募集終了</Badge>
                      : <Badge variant="success">募集中 残{job.remaining_slots}枠</Badge>
                    }
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
