'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast/ToastProvider'
import { Button } from '@/components/ui/Button'

interface Props {
  applicationId: string
  jobId: string
  revieweeId: string
  revieweeName: string
  reviewerRole: 'worker' | 'employer'
  onDone: () => void
  onClose: () => void
}

export function ReviewModal({ applicationId, jobId, revieweeId, revieweeName, reviewerRole, onDone, onClose }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const toast = useToast()

  async function handleSubmit() {
    if (rating === 0) {
      toast.error('星を選択してください')
      return
    }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error } = await supabase.from('reviews').insert({
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      job_id: jobId,
      application_id: applicationId,
      rating,
      comment: comment.trim() || null,
      reviewer_role: reviewerRole,
    } as never)

    if (error) {
      toast.error('評価の送信に失敗しました')
    } else {
      // notify reviewee
      await supabase.from('notifications').insert({
        user_id: revieweeId,
        type: 'review_received',
        title: '評価が届きました',
        body: `${rating}つ星の評価を受け取りました`,
        related_job_id: jobId,
      } as never)
      toast.success('評価を送信しました')
      onDone()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-screen-md rounded-t-2xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">評価を送る</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        <p className="text-sm text-gray-600">
          {reviewerRole === 'worker' ? '企業' : 'ワーカー'}：<span className="font-semibold text-gray-900">{revieweeName}</span>
        </p>

        {/* Stars */}
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-4xl transition-transform hover:scale-110"
            >
              <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-sm font-medium text-gray-700">
            {['', '残念でした', 'いまいち', '普通', '良かった', '最高でした！'][rating]}
          </p>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">コメント（任意）</label>
          <textarea
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-blue-400"
            rows={3}
            placeholder="一言コメントをどうぞ"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>

        <Button size="lg" className="w-full" onClick={handleSubmit} disabled={loading || rating === 0}>
          {loading ? '送信中...' : '評価を送信する'}
        </Button>
      </div>
    </div>
  )
}
