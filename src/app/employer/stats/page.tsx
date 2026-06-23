import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function EmployerStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileRaw } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = profileRaw as { role: string } | null
  if (profile?.role !== 'employer' && profile?.role !== 'admin') redirect('/')

  const { data: jobsRaw } = await supabase
    .from('jobs')
    .select('id, title, work_date, status, slots')
    .eq('employer_id', user.id)

  const jobs = (jobsRaw ?? []) as Array<{ id: string; title: string; work_date: string; status: string; slots: number }>
  const jobIds = jobs.map(j => j.id)

  const { data: appsRaw } = jobIds.length > 0
    ? await supabase.from('applications').select('id, job_id, status, created_at').in('job_id', jobIds)
    : { data: [] }

  const apps = (appsRaw ?? []) as Array<{ id: string; job_id: string; status: string; created_at: string }>

  const totalJobs = jobs.length
  const totalApps = apps.length
  const accepted = apps.filter(a => a.status === 'accepted').length
  const acceptanceRate = totalApps > 0 ? Math.round((accepted / totalApps) * 100) : 0
  const avgAppsPerJob = totalJobs > 0 ? (totalApps / totalJobs).toFixed(1) : '0'

  // monthly job postings
  const monthlyMap: Record<string, { posted: number; apps: number; hired: number }> = {}
  for (const j of jobs) {
    const month = j.work_date.slice(0, 7)
    if (!monthlyMap[month]) monthlyMap[month] = { posted: 0, apps: 0, hired: 0 }
    monthlyMap[month].posted++
  }
  for (const a of apps) {
    const job = jobs.find(j => j.id === a.job_id)
    if (!job) continue
    const month = job.work_date.slice(0, 7)
    if (!monthlyMap[month]) monthlyMap[month] = { posted: 0, apps: 0, hired: 0 }
    monthlyMap[month].apps++
    if (a.status === 'accepted') monthlyMap[month].hired++
  }
  const months = Object.entries(monthlyMap).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6)
  const maxApps = Math.max(...months.map(([, v]) => v.apps), 1)

  // top jobs by application count
  const appCountByJob: Record<string, number> = {}
  for (const a of apps) {
    appCountByJob[a.job_id] = (appCountByJob[a.job_id] ?? 0) + 1
  }
  const topJobs = jobs
    .map(j => ({ ...j, appCount: appCountByJob[j.id] ?? 0 }))
    .sort((a, b) => b.appCount - a.appCount)
    .slice(0, 5)

  return (
    <div className="space-y-5 pb-8">
      <Link href="/employer/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← ダッシュボード
      </Link>
      <h1 className="text-xl font-bold text-gray-900">採用統計</h1>

      {/* サマリー */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{totalJobs}</p>
          <p className="text-xs text-gray-500 mt-1">投稿案件数</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{totalApps}</p>
          <p className="text-xs text-gray-500 mt-1">総応募数</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{accepted}</p>
          <p className="text-xs text-gray-500 mt-1">採用人数</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{acceptanceRate}%</p>
          <p className="text-xs text-gray-500 mt-1">採用率</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">案件あたり平均応募数</span>
        <span className="text-xl font-bold text-gray-900">{avgAppsPerJob} 件</span>
      </div>

      {/* 月別推移 */}
      {months.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">月別推移</h2>
          <div className="space-y-4">
            {months.map(([month, data]) => (
              <div key={month} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{month.replace('-', '年')}月</span>
                  <span>投稿 {data.posted}件 · 応募 {data.apps}件 · 採用 {data.hired}名</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(data.apps / maxApps) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 人気案件TOP5 */}
      {topJobs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">応募数が多い案件</h2>
          <div className="space-y-3">
            {topJobs.map((job, i) => (
              <Link key={job.id} href={`/employer/jobs/${job.id}`}>
                <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-1 transition-colors">
                  <span className="text-lg font-bold text-gray-300 w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-400">{job.work_date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-blue-600">{job.appCount}件</p>
                    <p className="text-xs text-gray-400">応募</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {totalJobs === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm">案件を投稿するとデータが表示されます</p>
          <Link href="/employer/post-job" className="text-blue-600 text-sm underline mt-2 inline-block">案件を作成する</Link>
        </div>
      )}
    </div>
  )
}
