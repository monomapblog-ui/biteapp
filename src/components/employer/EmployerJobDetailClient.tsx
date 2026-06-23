'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast/ToastProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ReviewModal } from '@/components/reviews/ReviewModal'

interface Application {
  id: string; worker_id: string; status: string; message: string | null
  created_at: string; workerName: string; workerPhone: string | null
}

interface Job {
  id: string; title: string; work_date: string; start_time: string; end_time: string
  hourly_rate: number; slots: number; status: string; prefecture: string
  location: string; description: string; employer_id: string
}

interface Props { job: Job; applications: Application[] }

function appBadge(status: string) {
  if (status === 'pending') return <Badge variant="warning">審査待ち</Badge>
  if (status === 'accepted') return <Badge variant="success">採用</Badge>
  if (status === 'rejected') return <Badge variant="danger">不採用</Badge>
  if (status === 'cancelled') return <Badge variant="default">キャンセル</Badge>
  return <Badge variant="default">{status}</Badge>
}

export function EmployerJobDetailClient({ job: initialJob, applications: initialApps }: Props) {
  const [apps, setApps] = useState(initialApps)
  const [job, setJob] = useState(initialJob)
  const [loading, setLoading] = useState<string | null>(null)
  const [reviewTarget, setReviewTarget] = useState<Application | null>(null)
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const toast = useToast()

  const isJobPast = new Date(job.work_date) < new Date(new Date().toDateString())

  async function updateAppStatus(appId: string, status: 'accepted' | 'rejected', workerId: string, workerName: string) {
    setLoading(appId)
    const { error } = await supabase
      .from('applications')
      .update({ status } as never)
      .eq('id', appId)

    if (error) {
      toast.error('更新に失敗しました')
      setLoading(null)
      return
    }

    setApps(prev => prev.map(a => a.id === appId ? { ...a, status } : a))

    // notify worker
    await supabase.from('notifications').insert({
      user_id: workerId,
      type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
      title: status === 'accepted' ? '採用されました！' : '応募結果のお知らせ',
      body: status === 'accepted'
        ? `「${job.title}」に採用されました。当日は時間通りにお越しください。`
        : `「${job.title}」の応募は今回見送りとなりました。`,
      related_job_id: job.id,
    } as never)

    toast.success(status === 'accepted' ? `${workerName}さんを採用しました` : '不採用にしました')
    setLoading(null)
  }

  async function updateJobStatus(status: 'closed' | 'completed') {
    setLoading('job-' + status)
    const { error } = await supabase.from('jobs').update({ status } as never).eq('id', job.id)
    if (error) {
      toast.error('更新に失敗しました')
    } else {
      setJob(prev => ({ ...prev, status }))
      toast.success(status === 'closed' ? '募集を締め切りました' : '案件を完了にしました')
    }
    setLoading(null)
  }

  const acceptedCount = apps.filter(a => a.status === 'accepted').length
  const pendingCount = apps.filter(a => a.status === 'pending').length

  return (
    <div className="space-y-5 pb-8">
      <Link href="/employer/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← ダッシュボード
      </Link>

      {/* Job Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-bold text-gray-900 text-lg leading-snug flex-1">{job.title}</h1>
          {job.status === 'open' && <Badge variant="success">募集中</Badge>}
          {job.status === 'closed' && <Badge variant="default">締切</Badge>}
          {job.status === 'completed' && <Badge variant="default">完了</Badge>}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          <span>📅 {job.work_date}</span>
          <span>🕐 {job.start_time}〜{job.end_time}</span>
          <span>📍 {job.prefecture} {job.location}</span>
          <span>💴 ¥{job.hourly_rate.toLocaleString()}/h</span>
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-gray-50 text-sm">
          <span className="text-gray-500">採用状況</span>
          <span className="font-semibold text-gray-900">{acceptedCount} / {job.slots} 名</span>
          {pendingCount > 0 && <Badge variant="warning">{pendingCount}件 未対応</Badge>}
        </div>

        {/* Job lifecycle buttons */}
        {job.status === 'open' && (
          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary" size="sm" className="flex-1"
              onClick={() => updateJobStatus('closed')}
              disabled={!!loading}
            >
              募集を締め切る
            </Button>
            {isJobPast && (
              <Button
                size="sm" className="flex-1"
                onClick={() => updateJobStatus('completed')}
                disabled={!!loading}
              >
                完了にする
              </Button>
            )}
          </div>
        )}
        {job.status === 'closed' && isJobPast && (
          <Button
            size="sm" className="w-full"
            onClick={() => updateJobStatus('completed')}
            disabled={!!loading}
          >
            完了にする
          </Button>
        )}
      </div>

      {/* Applications */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">応募者一覧 ({apps.length}件)</h2>

        {apps.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm">まだ応募がありません</p>
          </div>
        ) : (
          apps.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/workers/${app.worker_id}`} className="font-semibold text-gray-900 text-sm hover:text-blue-600 hover:underline">
                    {app.workerName}
                  </Link>
                  {app.workerPhone && (
                    <a href={`tel:${app.workerPhone}`} className="block text-xs text-blue-600">{app.workerPhone}</a>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(app.created_at).toLocaleDateString('ja-JP')} 応募
                  </p>
                </div>
                {appBadge(app.status)}
              </div>

              {app.message && (
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">{app.message}</p>
              )}

              {app.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="secondary" size="sm" className="flex-1"
                    onClick={() => updateAppStatus(app.id, 'rejected', app.worker_id, app.workerName)}
                    disabled={loading === app.id}
                  >
                    不採用
                  </Button>
                  <Button
                    size="sm" className="flex-1"
                    onClick={() => updateAppStatus(app.id, 'accepted', app.worker_id, app.workerName)}
                    disabled={loading === app.id}
                  >
                    {loading === app.id ? '処理中...' : '採用する'}
                  </Button>
                </div>
              )}

              {app.status === 'accepted' && isJobPast && !reviewedIds.has(app.id) && (
                <Button
                  variant="secondary" size="sm" className="w-full"
                  onClick={() => setReviewTarget(app)}
                >
                  ⭐ {app.workerName}さんを評価する
                </Button>
              )}
              {reviewedIds.has(app.id) && (
                <p className="text-xs text-center text-gray-400">評価済み</p>
              )}
            </div>
          ))
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          applicationId={reviewTarget.id}
          jobId={job.id}
          revieweeId={reviewTarget.worker_id}
          revieweeName={reviewTarget.workerName}
          reviewerRole="employer"
          onDone={() => {
            setReviewedIds(prev => new Set([...prev, reviewTarget.id]))
            setReviewTarget(null)
          }}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  )
}
