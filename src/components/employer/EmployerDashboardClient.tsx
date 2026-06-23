'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface JobWithCounts {
  id: string; title: string; work_date: string; start_time: string; end_time: string
  hourly_rate: number; slots: number; status: string; prefecture: string; location: string
  counts: { total: number; accepted: number; pending: number }
}

interface Props { jobs: JobWithCounts[]; employerName: string }

function statusBadge(status: string) {
  if (status === 'open') return <Badge variant="success">募集中</Badge>
  if (status === 'closed') return <Badge variant="default">締切</Badge>
  if (status === 'done') return <Badge variant="default">完了</Badge>
  if (status === 'cancelled') return <Badge variant="danger">キャンセル</Badge>
  return <Badge variant="default">{status}</Badge>
}

export function EmployerDashboardClient({ jobs, employerName }: Props) {
  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ダッシュボード</h1>
          {employerName && <p className="text-sm text-gray-500 mt-0.5">{employerName}</p>}
        </div>
        <div className="flex gap-2">
          <Link href="/employer/stats">
            <Button variant="secondary" size="sm">📊</Button>
          </Link>
          <Link href="/employer/post-job">
            <Button size="sm">＋ 案件を作成</Button>
          </Link>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-4xl">📋</p>
          <p className="text-gray-500 text-sm">まだ案件がありません</p>
          <Link href="/employer/post-job">
            <Button className="mt-2">最初の案件を作成する</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <Link key={job.id} href={`/employer/jobs/${job.id}`} className="block">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="font-semibold text-gray-900 text-sm leading-snug flex-1">{job.title}</h2>
                  {statusBadge(job.status)}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                  <span>📅 {job.work_date}</span>
                  <span>🕐 {job.start_time}〜{job.end_time}</span>
                  <span>📍 {job.prefecture} {job.location}</span>
                  <span>💴 ¥{job.hourly_rate.toLocaleString()}/h</span>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">{job.counts.total}</span>
                    <span>件の応募</span>
                  </div>
                  {job.counts.pending > 0 && (
                    <Badge variant="warning">{job.counts.pending}件 審査待ち</Badge>
                  )}
                  <div className="ml-auto text-xs text-gray-400">
                    採用 {job.counts.accepted} / 定員 {job.slots}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
