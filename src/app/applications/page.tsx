import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

const STATUS_CONFIG = {
  applied:   { variant: 'warning'  as const, label: '⏳ 審査中' },
  accepted:  { variant: 'success'  as const, label: '✓ 採用決定' },
  rejected:  { variant: 'danger'   as const, label: '✗ 見送り' },
  cancelled: { variant: 'outline'  as const, label: 'キャンセル' },
  completed: { variant: 'default'  as const, label: '✓ 勤務完了' },
}

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: applicationsRaw } = await supabase
    .from('applications')
    .select('id, status, applied_at, message, job_id')
    .eq('worker_id', user.id)
    .order('applied_at', { ascending: false })

  const applications = applicationsRaw as Array<{
    id: string; status: string; applied_at: string; message: string | null; job_id: string
  }> | null

  // 案件情報を別途取得
  const jobIds = (applications ?? []).map(a => a.job_id)
  type JobRow = { id: string; title: string; work_date: string; hourly_rate: number; location: string; prefecture: string; employer_id: string }
  type EmployerRow = { id: string; name: string }

  const { data: jobsRaw } = jobIds.length > 0
    ? await supabase
        .from('jobs')
        .select('id, title, work_date, hourly_rate, location, prefecture, employer_id')
        .in('id', jobIds)
    : { data: [] as JobRow[] }

  const jobsData = jobsRaw as JobRow[] | null

  const employerIds = [...new Set((jobsData ?? []).map(j => j.employer_id))]
  const { data: employersRaw } = employerIds.length > 0
    ? await supabase.from('profiles').select('id, name').in('id', employerIds)
    : { data: [] as EmployerRow[] }

  const employersData = employersRaw as EmployerRow[] | null

  const jobMap = Object.fromEntries((jobsData ?? []).map(j => [j.id, j]))
  const employerMap = Object.fromEntries((employersData ?? []).map(e => [e.id, e]))

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold text-gray-900">応募履歴</h1>

      {!applications || applications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">まだ応募した案件はありません</p>
          <Link href="/" className="text-blue-600 text-sm underline mt-2 inline-block">案件を探す</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(applications ?? []).map(app => {
            const job = jobMap[app.job_id]
            if (!job) return null
            const employer = employerMap[job.employer_id]
            const { variant, label } = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.applied

            return (
              <Link key={app.id} href={`/jobs/${job.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs text-gray-500">{employer?.name}</p>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{job.title}</p>
                    </div>
                    <Badge variant={variant}>{label}</Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>📅 {formatDate(job.work_date)}</span>
                    <span>💰 {formatCurrency(job.hourly_rate)}/h</span>
                    <span>📍 {job.prefecture}</span>
                  </div>
                  {app.status === 'accepted' && (
                    <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-xs text-emerald-700">
                      🎉 採用されました！当日は時間通りにお越しください。
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
