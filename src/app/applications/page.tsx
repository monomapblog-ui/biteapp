import { MOCK_APPLICATIONS } from '@/data/mockData'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ApplicationStatus } from '@/types'
import Link from 'next/link'

const STATUS_CONFIG: Record<ApplicationStatus, { variant: 'success' | 'warning' | 'danger' | 'outline' | 'default'; label: string }> = {
  applied: { variant: 'warning', label: '⏳ 審査中' },
  accepted: { variant: 'success', label: '✓ 採用決定' },
  rejected: { variant: 'danger', label: '✗ 見送り' },
  cancelled: { variant: 'outline', label: 'キャンセル' },
  completed: { variant: 'default', label: '✓ 勤務完了' },
}

export default function ApplicationsPage() {
  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold text-gray-900">応募履歴</h1>

      {MOCK_APPLICATIONS.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">まだ応募した案件はありません</p>
          <Link href="/" className="text-blue-600 text-sm underline mt-2 inline-block">案件を探す</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {MOCK_APPLICATIONS.map(app => {
            const { variant, label } = STATUS_CONFIG[app.status]
            return (
              <Link key={app.id} href={`/jobs/${app.jobId}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs text-gray-500">{app.job.employerName}</p>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{app.job.title}</p>
                    </div>
                    <Badge variant={variant}>{label}</Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>📅 {formatDate(app.job.workDate)}</span>
                    <span>💰 {formatCurrency(app.job.hourlyRate)}/h</span>
                    <span>📍 {app.job.prefecture}</span>
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
