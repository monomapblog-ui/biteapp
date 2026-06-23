import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function WorkerStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // accepted applications with past work dates
  const { data: appsRaw } = await supabase
    .from('applications')
    .select('id, job_id, created_at')
    .eq('worker_id', user.id)
    .eq('status', 'accepted')

  const apps = (appsRaw ?? []) as Array<{ id: string; job_id: string; created_at: string }>
  const jobIds = apps.map(a => a.job_id)

  const { data: jobsRaw } = jobIds.length > 0
    ? await supabase
        .from('jobs')
        .select('id, title, work_date, start_time, end_time, hourly_rate, prefecture')
        .in('id', jobIds)
    : { data: [] }

  const jobs = (jobsRaw ?? []) as Array<{
    id: string; title: string; work_date: string; start_time: string
    end_time: string; hourly_rate: number; prefecture: string
  }>

  const today = new Date().toISOString().split('T')[0]
  const jobMap = Object.fromEntries(jobs.map(j => [j.id, j]))

  function calcHours(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
  }

  const completedJobs = apps
    .map(a => ({ ...a, job: jobMap[a.job_id] }))
    .filter(a => a.job && a.job.work_date < today)

  const totalEarnings = completedJobs.reduce((sum, a) => {
    const h = calcHours(a.job.start_time.slice(0, 5), a.job.end_time.slice(0, 5))
    return sum + a.job.hourly_rate * h
  }, 0)

  const totalHours = completedJobs.reduce((sum, a) => {
    return sum + calcHours(a.job.start_time.slice(0, 5), a.job.end_time.slice(0, 5))
  }, 0)

  // monthly breakdown
  const monthlyMap: Record<string, { earnings: number; count: number; hours: number }> = {}
  for (const a of completedJobs) {
    const month = a.job.work_date.slice(0, 7)
    if (!monthlyMap[month]) monthlyMap[month] = { earnings: 0, count: 0, hours: 0 }
    const h = calcHours(a.job.start_time.slice(0, 5), a.job.end_time.slice(0, 5))
    monthlyMap[month].earnings += a.job.hourly_rate * h
    monthlyMap[month].hours += h
    monthlyMap[month].count++
  }
  const months = Object.entries(monthlyMap).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6)
  const maxEarnings = Math.max(...months.map(([, v]) => v.earnings), 1)

  // upcoming accepted jobs
  const upcoming = apps
    .map(a => ({ ...a, job: jobMap[a.job_id] }))
    .filter(a => a.job && a.job.work_date >= today)
    .sort((a, b) => a.job.work_date.localeCompare(b.job.work_date))
    .slice(0, 3)

  return (
    <div className="space-y-5 pb-8">
      <Link href="/mypage" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← マイページ
      </Link>
      <h1 className="text-xl font-bold text-gray-900">稼ぎ統計</h1>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{completedJobs.length}</p>
          <p className="text-xs text-gray-500 mt-1">勤務回数</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{Math.round(totalHours)}</p>
          <p className="text-xs text-gray-500 mt-1">総勤務時間</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xl font-bold text-gray-900">{formatCurrency(Math.round(totalEarnings))}</p>
          <p className="text-xs text-gray-500 mt-1">総収入（目安）</p>
        </div>
      </div>

      {/* 月別収入グラフ */}
      {months.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">月別収入</h2>
          <div className="space-y-3">
            {months.map(([month, data]) => (
              <div key={month} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{month.replace('-', '年')}月</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(Math.round(data.earnings))}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(data.earnings / maxEarnings) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{data.count}件 · {Math.round(data.hours)}時間</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 次の勤務 */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">今後の勤務予定</h2>
          <div className="space-y-3">
            {upcoming.map(a => (
              <Link key={a.id} href={`/jobs/${a.job.id}`}>
                <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-1 transition-colors">
                  <div className="bg-blue-50 rounded-xl p-2 text-center min-w-14">
                    <p className="text-xs font-bold text-blue-600">{a.job.work_date.slice(5).replace('-', '/')}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{a.job.title}</p>
                    <p className="text-xs text-gray-500">{a.job.start_time.slice(0,5)}〜{a.job.end_time.slice(0,5)} · {a.job.prefecture}</p>
                  </div>
                  <p className="text-sm font-semibold text-blue-600 shrink-0">
                    {formatCurrency(Math.round(a.job.hourly_rate * calcHours(a.job.start_time.slice(0,5), a.job.end_time.slice(0,5))))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {completedJobs.length === 0 && upcoming.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm">勤務実績がまだありません</p>
          <Link href="/" className="text-blue-600 text-sm underline mt-2 inline-block">案件を探す</Link>
        </div>
      )}
    </div>
  )
}
