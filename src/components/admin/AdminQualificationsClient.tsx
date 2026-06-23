'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast/ToastProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface QualItem {
  id: string
  certificate_url: string
  issued_at: string
  expires_at: string | null
  created_at: string
  user_id: string
  qualification_id: string
  userName: string
  qualName: string
  qualIcon: string
}

interface Props { items: QualItem[] }

export function AdminQualificationsClient({ items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [selected, setSelected] = useState<QualItem | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const toast = useToast()

  async function openCert(item: QualItem) {
    setSelected(item)
    setImageUrl(null)
    setShowReject(false)
    setRejectReason('')

    const { data } = await supabase.storage
      .from('certificates')
      .createSignedUrl(item.certificate_url, 60)
    if (data?.signedUrl) setImageUrl(data.signedUrl)
  }

  async function handleApprove() {
    if (!selected) return
    setLoading(true)
    const { error } = await supabase
      .from('user_qualifications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() } as never)
      .eq('id', selected.id)

    if (error) {
      toast.error('承認に失敗しました')
    } else {
      toast.success(`${selected.qualName} を承認しました`)
      setItems(prev => prev.filter(i => i.id !== selected.id))
      setSelected(null)
    }
    setLoading(false)
  }

  async function handleReject() {
    if (!selected || !rejectReason.trim()) return
    setLoading(true)
    const { error } = await supabase
      .from('user_qualifications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectReason,
      } as never)
      .eq('id', selected.id)

    if (error) {
      toast.error('却下に失敗しました')
    } else {
      toast.success('却下しました')
      setItems(prev => prev.filter(i => i.id !== selected.id))
      setSelected(null)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">資格審査</h1>
        <Badge variant={items.length > 0 ? 'warning' : 'success'}>
          {items.length > 0 ? `⏳ ${items.length}件 審査待ち` : '✓ 審査完了'}
        </Badge>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm">審査待ちの資格はありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-blue-200 transition-colors"
              onClick={() => openCert(item)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.qualIcon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.qualName}</p>
                  <p className="text-xs text-gray-500">{item.userName} · 取得: {item.issued_at}</p>
                  <p className="text-xs text-gray-400">申請: {new Date(item.created_at).toLocaleDateString('ja-JP')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="warning">審査待ち</Badge>
                <span className="text-gray-400 text-sm">›</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 審査モーダル */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">資格証書を確認</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* 申請者情報 */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">申請者</span>
                <span className="font-medium">{selected.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">資格名</span>
                <span className="font-medium">{selected.qualIcon} {selected.qualName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">取得日</span>
                <span className="font-medium">{selected.issued_at}</span>
              </div>
              {selected.expires_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">有効期限</span>
                  <span className="font-medium">{selected.expires_at}</span>
                </div>
              )}
            </div>

            {/* 証書画像 */}
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 min-h-48 flex items-center justify-center">
              {imageUrl ? (
                selected.certificate_url.endsWith('.pdf') ? (
                  <div className="text-center p-6">
                    <p className="text-4xl mb-2">📄</p>
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm underline">
                      PDFを開く
                    </a>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="資格証書" className="w-full object-contain max-h-64" />
                )
              ) : (
                <div className="text-center text-gray-400">
                  <p className="text-3xl mb-2">⏳</p>
                  <p className="text-xs">読み込み中...</p>
                </div>
              )}
            </div>

            {/* 却下理由入力 */}
            {showReject && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">却下理由（ユーザーに通知されます）</label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-red-400"
                  rows={3}
                  placeholder="例：証書の画像が不鮮明です。再度アップロードしてください。"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            )}

            {/* アクション */}
            {!showReject ? (
              <div className="flex gap-3">
                <Button variant="danger" className="flex-1" onClick={() => setShowReject(true)}>
                  却下
                </Button>
                <Button className="flex-1" onClick={handleApprove} disabled={loading}>
                  {loading ? '処理中...' : '✓ 承認する'}
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowReject(false)}>戻る</Button>
                <Button variant="danger" className="flex-1" onClick={handleReject} disabled={loading || !rejectReason.trim()}>
                  {loading ? '処理中...' : '却下を確定'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
