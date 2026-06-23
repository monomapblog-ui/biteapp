'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency, calcWorkHours } from '@/lib/utils'

interface QualRow {
  qualification_id: string
  is_mandatory: boolean
  qualifications: { id: string; name: string; icon: string; description: string } | null
}

interface JobRow {
  id: string
  title: string
  description: string
  location: string
  hourly_rate: number
  work_date: string
  start_time: string
  end_time: string
  slots: number
  remaining_slots: number
  employer_id: string
  job_required_qualifications: QualRow[]
  job_tags: Array<{ tag: string }>
  profiles: { name: string; avatar_url: string | null } | null
}

interface Props {
  job: JobRow
  approvedQualIds: string[]
  userId: string | null
  existingApplication: { id: string; status: string } | null
}

export function JobDetailClient({ job, approvedQualIds, userId, existingApplication }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState(!!existingApplication)
  const router = useRouter()
  const supabase = createClient()

  const mandatory = job.job_required_qualifications.filter(q => q.is_mandatory && q.qualifications)
  const eligible = mandatory.every(q => approvedQualIds.includes(q.qualification_id))
  const missingQuals = mandatory
    .filter(q => !approvedQualIds.includes(q.qualification_id))
    .map(q => q.qualifications!.name)

  const workHours = calcWorkHours(job.start_time.slice(0, 5), job.end_time.slice(0, 5))
  const totalPay = job.hourly_rate * parseFloat(workHours)

  async function handleApply() {
    if (!userId) return
    setLoading(true)

    const { data: appData, error } = await supabase.from('applications').insert({
      job_id: job.id,
      worker_id: userId,
      message: message || null,
    } as never).select('id').single()

    if (error) {
      setLoading(false)
      alert('応募に失敗しました。資格の承認状況をご確認ください。')
      return
    }

    // notify employer
    if (job.employer_id) {
      await supabase.from('notifications').insert({
        user_id: job.employer_id,
        type: 'new_application',
        title: '新しい応募が届きました',
        body: `「${job.title}」に新しい応募がありました。`,
        related_job_id: job.id,
        related_application_id: (appData as { id: string } | null)?.id ?? null,
      } as never)
    }


    setLoading(false)
    setApplied(true)
    setShowModal(false)
    router.refresh()
    setTimeout(() => router.push('/applications'), 1200)
  }

  return (
    <div className="space-y-4 pb-32">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← 案件一覧
      </Link>

      {/* ヘッダー */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm text-gray-500 mb-1">{job.profiles?.name}</p>
        <h1 className="text-xl font-bold text-gray-900 mb-3">{job.title}</h1>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{formatCurrency(job.hourly_rate)}</p>
            <p className="text-xs text-gray-500 mt-0.5">時給</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-gray-800">{workHours}</p>
            <p className="text-xs text-gray-500 mt-0.5">勤務時間</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPay)}</p>
            <p className="text-xs text-gray-500 mt-0.5">日収目安</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3 text-gray-700">
            <span className="w-5 text-center">📅</span>
            <span>{formatDate(job.work_date)}　{job.start_time.slice(0, 5)}〜{job.end_time.slice(0, 5)}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <span className="w-5 text-center">📍</span>
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <span className="w-5 text-center">👥</span>
            <span>募集{job.slots}名（残り{job.remaining_slots}枠）</span>
          </div>
        </div>
      </div>

      {/* 必須資格 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">必須資格</h2>
        <div className="space-y-2">
          {mandatory.map(q => {
            const has = approvedQualIds.includes(q.qualification_id)
            return (
              <div key={q.qualification_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{q.qualifications!.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{q.qualifications!.name}</p>
                    <p className="text-xs text-gray-500">{q.qualifications!.description}</p>
                  </div>
                </div>
                {userId
                  ? has ? <Badge variant="success">✓ 保有</Badge> : <Badge variant="danger">未保有</Badge>
                  : <Badge variant="outline">要ログイン</Badge>
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* 仕事内容 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-2">仕事内容</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{job.description}</p>
        <div className="flex flex-wrap gap-1 mt-3">
          {job.job_tags.map(t => (
            <Badge key={t.tag} variant="default">{t.tag}</Badge>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-screen-md mx-auto">
          {!userId ? (
            <Link href="/auth/login">
              <Button size="lg" className="w-full">ログインして応募する</Button>
            </Link>
          ) : applied ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-emerald-700 font-medium">✓ 応募しました！</p>
              <p className="text-xs text-emerald-600 mt-0.5">応募履歴で確認できます</p>
            </div>
          ) : eligible && job.remaining_slots > 0 ? (
            <Button size="lg" className="w-full" onClick={() => setShowModal(true)}>
              この案件に応募する
            </Button>
          ) : (
            <div className="space-y-2">
              <Button size="lg" className="w-full" disabled>
                {job.remaining_slots === 0 ? '募集終了' : '応募できません'}
              </Button>
              {missingQuals.length > 0 && (
                <>
                  <p className="text-xs text-center text-gray-500">未保有: {missingQuals.join('、')}</p>
                  <Link href="/mypage/qualifications" className="block text-center text-xs text-blue-600 underline">
                    資格を登録する →
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 応募確認モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-screen-md rounded-t-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg">応募内容を確認</h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
              <p><span className="text-gray-500">案件：</span>{job.title}</p>
              <p><span className="text-gray-500">日時：</span>{formatDate(job.work_date)} {job.start_time.slice(0, 5)}〜{job.end_time.slice(0, 5)}</p>
              <p><span className="text-gray-500">場所：</span>{job.location}</p>
              <p><span className="text-gray-500">時給：</span>{formatCurrency(job.hourly_rate)}（日収目安 {formatCurrency(totalPay)}）</p>
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
            <Button size="lg" className="w-full" onClick={handleApply} disabled={loading}>
              {loading ? '応募中...' : '確定して応募する'}
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
