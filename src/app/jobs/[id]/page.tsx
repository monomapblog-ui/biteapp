'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_JOBS, MOCK_USER } from '@/data/mockData'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, formatCurrency, calcWorkHours } from '@/lib/utils'
import Link from 'next/link'

function isEligible(jobId: string): { eligible: boolean; missingQuals: string[] } {
  const job = MOCK_JOBS.find(j => j.id === jobId)
  if (!job) return { eligible: false, missingQuals: [] }
  const approvedIds = MOCK_USER.qualifications.filter(q => q.status === 'approved').map(q => q.qualificationId)
  const missing = job.requiredQualifications.filter(rq => !approvedIds.includes(rq.id))
  return { eligible: missing.length === 0, missingQuals: missing.map(q => q.name) }
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [applied, setApplied] = useState(false)

  const job = MOCK_JOBS.find(j => j.id === id)
  if (!job) return <div className="py-20 text-center text-gray-400">案件が見つかりません</div>

  const { eligible, missingQuals } = isEligible(id)
  const workHours = calcWorkHours(job.startTime, job.endTime)
  const totalPay = job.hourlyRate * parseFloat(workHours)

  function handleApply() {
    setApplied(true)
    setShowModal(false)
    setTimeout(() => router.push('/applications'), 1000)
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← 案件一覧
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm text-gray-500 mb-1">{job.employerName}</p>
        <h1 className="text-xl font-bold text-gray-900 mb-3">{job.title}</h1>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{formatCurrency(job.hourlyRate)}</p>
            <p className="text-xs text-gray-500 mt-0.5">時給</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-gray-800">{workHours}</p>
            <p className="text-xs text-gray-500 mt-0.5">勤務時間</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPay)}</p>
            <p className="text-xs text-gray-500 mt-0.5">日収（目安）</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3 text-gray-700">
            <span className="w-5 text-center">📅</span>
            <span>{formatDate(job.workDate)}　{job.startTime}〜{job.endTime}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <span className="w-5 text-center">📍</span>
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <span className="w-5 text-center">👥</span>
            <span>募集{job.slots}名（残り{job.remainingSlots}枠）</span>
          </div>
        </div>
      </div>

      {/* Required qualifications */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">必須資格</h2>
        <div className="space-y-2">
          {job.requiredQualifications.map(q => {
            const userHas = MOCK_USER.qualifications.find(uq => uq.qualificationId === q.id && uq.status === 'approved')
            return (
              <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{q.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{q.name}</p>
                    <p className="text-xs text-gray-500">{q.description}</p>
                  </div>
                </div>
                {userHas ? (
                  <Badge variant="success">✓ 保有</Badge>
                ) : (
                  <Badge variant="danger">未保有</Badge>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-2">仕事内容</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{job.description}</p>
        <div className="flex flex-wrap gap-1 mt-3">
          {job.tags.map(tag => (
            <Badge key={tag} variant="default">{tag}</Badge>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-4 safe-area-bottom">
        <div className="max-w-screen-md mx-auto">
          {applied ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-emerald-700 font-medium">✓ 応募しました！</p>
              <p className="text-xs text-emerald-600 mt-0.5">応募履歴を確認してください</p>
            </div>
          ) : eligible ? (
            <Button size="lg" className="w-full" onClick={() => setShowModal(true)}>
              この案件に応募する
            </Button>
          ) : (
            <div className="space-y-2">
              <Button size="lg" className="w-full" disabled>
                応募できません
              </Button>
              <p className="text-xs text-center text-gray-500">
                未保有の資格: {missingQuals.join('、')}
              </p>
              <Link href="/mypage/qualifications" className="block text-center text-xs text-blue-600 underline">
                資格を登録する →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-screen-md rounded-t-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg">応募内容を確認</h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
              <p><span className="text-gray-500">案件：</span>{job.title}</p>
              <p><span className="text-gray-500">日時：</span>{formatDate(job.workDate)} {job.startTime}〜{job.endTime}</p>
              <p><span className="text-gray-500">場所：</span>{job.location}</p>
              <p><span className="text-gray-500">時給：</span>{formatCurrency(job.hourlyRate)}（日収目安 {formatCurrency(totalPay)}）</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">メッセージ（任意）</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-blue-400"
                rows={3}
                placeholder="意気込みや経験を一言どうぞ"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            <Button size="lg" className="w-full" onClick={handleApply}>
              確定して応募する
            </Button>
            <button className="w-full text-sm text-gray-500" onClick={() => setShowModal(false)}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
