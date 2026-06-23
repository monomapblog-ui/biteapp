'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ReviewModal } from '@/components/reviews/ReviewModal'

const STATUS_CONFIG = {
  applied:   { variant: 'warning'  as const, label: '⏳ 審査中' },
  pending:   { variant: 'warning'  as const, label: '⏳ 審査中' },
  accepted:  { variant: 'success'  as const, label: '✓ 採用決定' },
  rejected:  { variant: 'danger'   as const, label: '✗ 見送り' },
  cancelled: { variant: 'outline'  as const, label: 'キャンセル' },
  completed: { variant: 'default'  as const, label: '✓ 勤務完了' },
}

interface JobRow { id: string; title: string; work_date: string; hourly_rate: number; location: string; prefecture: string; employer_id: string }

interface Item {
  id: string; status: string; applied_at: string; message: string | null; job_id: string
  job: JobRow; employerName: string; employerId: string; alreadyReviewed: boolean
}

interface Props { items: Item[]; workerId: string }

export function ApplicationsClient({ items: initial, workerId }: Props) {
  const [items, setItems] = useState(initial)
  const [reviewTarget, setReviewTarget] = useState<Item | null>(null)

  function markReviewed(appId: string) {
    setItems(prev => prev.map(i => i.id === appId ? { ...i, alreadyReviewed: true } : i))
    setReviewTarget(null)
  }

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold text-gray-900">応募履歴</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">まだ応募した案件はありません</p>
          <Link href="/" className="text-blue-600 text-sm underline mt-2 inline-block">案件を探す</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(app => {
            const { job } = app
            const { variant, label } = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.applied
            const isPast = new Date(job.work_date) < new Date(new Date().toDateString())
            const canReview = app.status === 'accepted' && isPast && !app.alreadyReviewed

            return (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <Link href={`/jobs/${job.id}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs text-gray-500">{app.employerName}</p>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{job.title}</p>
                    </div>
                    <Badge variant={variant}>{label}</Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>📅 {formatDate(job.work_date)}</span>
                    <span>💰 {formatCurrency(job.hourly_rate)}/h</span>
                    <span>📍 {job.prefecture}</span>
                  </div>
                  {app.status === 'accepted' && !isPast && (
                    <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-xs text-emerald-700">
                      🎉 採用されました！当日は時間通りにお越しください。
                    </div>
                  )}
                </Link>

                {app.status === 'accepted' && (
                  <Link href={`/messages/${app.employerId}`}>
                    <Button variant="secondary" size="sm" className="w-full mt-3">💬 企業にメッセージ</Button>
                  </Link>
                )}

                {canReview && (
                  <Button
                    variant="secondary" size="sm" className="w-full mt-3"
                    onClick={() => setReviewTarget(app)}
                  >
                    ⭐ 企業を評価する
                  </Button>
                )}
                {app.status === 'accepted' && isPast && app.alreadyReviewed && (
                  <p className="text-xs text-center text-gray-400 mt-2">評価済み ✓</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          applicationId={reviewTarget.id}
          jobId={reviewTarget.job.id}
          revieweeId={reviewTarget.employerId}
          revieweeName={reviewTarget.employerName}
          reviewerRole="worker"
          onDone={() => markReviewed(reviewTarget.id)}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  )
}
