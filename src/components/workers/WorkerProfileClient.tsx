'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast/ToastProvider'
import { Button } from '@/components/ui/Button'

interface Props {
  profile: { id: string; name: string; avatar_url: string | null; created_at: string }
  qualifications: Array<{
    qualification_id: string; issued_at: string
    qualifications: { name: string; icon: string; category: string } | null
  }>
  reviews: Array<{
    id: string; rating: number; comment: string | null; reviewer_role: string
    created_at: string; reviewerName: string; jobTitle: string
  }>
  avgRating: string | null
  completedCount: number
  employerOpenJobs: Array<{ id: string; title: string }>
  workerId: string
}

export function WorkerProfileClient({
  profile, qualifications, reviews, avgRating, completedCount,
  employerOpenJobs, workerId
}: Props) {
  const [showInvite, setShowInvite] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [sending, setSending] = useState(false)
  const supabase = createClient()
  const toast = useToast()
  const router = useRouter()

  async function handleInvite() {
    if (!selectedJobId) { toast.error('案件を選択してください'); return }
    setSending(true)

    const job = employerOpenJobs.find(j => j.id === selectedJobId)

    await supabase.from('notifications').insert({
      user_id: workerId,
      type: 'new_application',
      title: '案件への招待が届きました',
      body: `「${job?.title ?? '案件'}」に招待されました。ぜひご確認ください！`,
      related_job_id: selectedJobId,
    } as never)

    toast.success(`${profile.name}さんに招待を送りました`)
    setSending(false)
    setShowInvite(false)
    router.push('/employer/dashboard')
  }

  const joinYear = new Date(profile.created_at).getFullYear()

  return (
    <div className="space-y-5 pb-8">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← 戻る
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
            {profile.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-blue-600">{profile.name.charAt(0)}</span>
            }
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-sm text-gray-400">{joinYear}年登録</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xl font-bold text-gray-900">{qualifications.length}</p>
            <p className="text-xs text-gray-500">承認済み資格</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-xl font-bold text-blue-600">{completedCount}</p>
            <p className="text-xs text-gray-500">勤務回数</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-xl">
            <p className="text-xl font-bold text-yellow-600">{avgRating ? `★${avgRating}` : '-'}</p>
            <p className="text-xs text-gray-500">評価</p>
          </div>
        </div>

        {employerOpenJobs.length > 0 && (
          <div className="mt-4">
            <Button className="w-full" onClick={() => setShowInvite(true)}>
              📩 この人を案件に招待する
            </Button>
          </div>
        )}
      </div>

      {/* Qualifications */}
      {qualifications.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">保有資格（承認済み）</h2>
          <div className="space-y-2">
            {qualifications.map(q => (
              <div key={q.qualification_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{q.qualifications?.icon}</span>
                  <span className="text-sm font-medium text-gray-900">{q.qualifications?.name}</span>
                </div>
                <span className="text-xs text-gray-400">取得: {q.issued_at}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">評価</h2>
            {avgRating && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-yellow-400">★</span>
                <span className="font-bold">{avgRating}</span>
                <span className="text-gray-400">({reviews.length}件)</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">{r.reviewerName} · {r.jobTitle}</p>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={s <= r.rating ? 'text-yellow-400 text-sm' : 'text-gray-200 text-sm'}>★</span>
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 招待モーダル */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowInvite(false)}>
          <div className="bg-white w-full max-w-screen-md rounded-t-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">招待する案件を選択</h2>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500">{profile.name}さんに通知で案件を送ります</p>
            <div className="space-y-2">
              {employerOpenJobs.map(job => (
                <label key={job.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedJobId === job.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100'
                }`}>
                  <input
                    type="radio" name="invite-job" value={job.id}
                    checked={selectedJobId === job.id}
                    onChange={() => setSelectedJobId(job.id)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-900">{job.title}</span>
                </label>
              ))}
            </div>
            <Button size="lg" className="w-full" onClick={handleInvite} disabled={sending || !selectedJobId}>
              {sending ? '送信中...' : '招待を送る'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
