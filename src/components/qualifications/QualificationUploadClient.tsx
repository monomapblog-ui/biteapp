'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

interface Qualification {
  id: string
  name: string
  category: string
  icon: string
  description: string | null
}

interface Props {
  qualifications: Qualification[]
  registeredIds: string[]
  userId: string
}

type Step = 'select' | 'upload' | 'confirm' | 'done'

export function QualificationUploadClient({ qualifications, registeredIds, userId }: Props) {
  const [step, setStep] = useState<Step>('select')
  const [selectedQual, setSelectedQual] = useState<Qualification | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [issuedAt, setIssuedAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = ev => setPreview(ev.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  async function handleSubmit() {
    if (!selectedQual || !file || !issuedAt) return
    setLoading(true)
    setError('')

    // 1. Storageにアップロード
    const ext = file.name.split('.').pop()
    const filePath = `${userId}/${selectedQual.id}_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError('ファイルのアップロードに失敗しました: ' + uploadError.message)
      setLoading(false)
      return
    }

    // 2. DBに登録
    const { error: dbError } = await supabase.from('user_qualifications').insert({
      user_id: userId,
      qualification_id: selectedQual.id,
      certificate_url: filePath,
      issued_at: issuedAt,
    } as never)

    if (dbError) {
      setError('登録に失敗しました: ' + dbError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setStep('done')
    router.refresh()
  }

  const categories = [
    { key: 'driver', label: '運転免許', icon: '🚗' },
    { key: 'special', label: '特殊資格', icon: '🏗️' },
  ]

  const STEPS: Step[] = ['select', 'upload', 'confirm']
  const STEP_LABELS = ['資格選択', 'アップロード', '確認']

  return (
    <div className="space-y-4 pb-4">
      <Link href="/mypage" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← マイページ
      </Link>
      <h1 className="text-xl font-bold text-gray-900">資格を登録する</h1>

      {/* プログレス */}
      <div className="flex gap-2 items-center">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === s ? 'bg-blue-600 text-white'
              : STEPS.indexOf(step) > i ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-400'
            }`}>
              {STEPS.indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className="text-xs text-gray-500">{STEP_LABELS[i]}</span>
            {i < 2 && <div className="w-4 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: 資格選択 */}
      {step === 'select' && (
        <div className="space-y-4">
          {categories.map(cat => (
            <div key={cat.key}>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{cat.icon} {cat.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {qualifications.filter(q => q.category === cat.key).map(q => {
                  const registered = registeredIds.includes(q.id)
                  return (
                    <button
                      key={q.id}
                      disabled={registered}
                      onClick={() => { setSelectedQual(q); setStep('upload') }}
                      className={`flex items-center gap-3 p-3 bg-white border rounded-xl transition-all text-left ${
                        registered
                          ? 'border-gray-100 opacity-50 cursor-not-allowed'
                          : 'border-gray-100 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <span className="text-2xl">{q.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 leading-snug">{q.name}</p>
                        {registered && <p className="text-xs text-emerald-600 mt-0.5">✓ 登録済み</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 2: アップロード */}
      {step === 'upload' && selectedQual && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
            <span className="text-xl">{selectedQual.icon}</span>
            <p className="text-sm font-medium text-blue-800">{selectedQual.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">取得日</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-400"
              value={issuedAt}
              onChange={e => setIssuedAt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">資格証書（画像 / PDF）</label>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
              {preview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="証書プレビュー" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                    ✓ アップロード済み
                  </div>
                </div>
              ) : file ? (
                <div className="border-2 border-emerald-400 rounded-xl p-6 text-center bg-emerald-50">
                  <p className="text-3xl mb-2">📄</p>
                  <p className="text-sm text-emerald-700 font-medium">{file.name}</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <p className="text-3xl mb-2">📄</p>
                  <p className="text-sm text-gray-600 font-medium">タップしてアップロード</p>
                  <p className="text-xs text-gray-400 mt-1">JPG / PNG / PDF 対応（最大10MB）</p>
                </div>
              )}
            </label>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            ⚠️ 資格証書の情報は管理者のみが確認します。第三者には共有されません。
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('select')}>戻る</Button>
            <Button className="flex-1" disabled={!file || !issuedAt} onClick={() => setStep('confirm')}>次へ</Button>
          </div>
        </div>
      )}

      {/* Step 3: 確認 */}
      {step === 'confirm' && selectedQual && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold">登録内容の確認</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">資格名</span>
                <span className="font-medium">{selectedQual.icon} {selectedQual.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">取得日</span>
                <span className="font-medium">{issuedAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">証書ファイル</span>
                <span className="font-medium text-emerald-600">✓ {file?.name}</span>
              </div>
            </div>
          </div>

          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="証書" className="w-full h-32 object-cover rounded-xl border border-gray-200" />
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>
          )}

          <p className="text-xs text-gray-500 text-center">
            登録後、管理者が審査します（通常1〜2営業日）。<br />
            承認後に「資格確認済み」バッジが付与されます。
          </p>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('upload')}>戻る</Button>
            <Button className="flex-1" disabled={loading} onClick={handleSubmit}>
              {loading ? '登録中...' : '登録する'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: 完了 */}
      {step === 'done' && (
        <div className="text-center py-12 space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mx-auto">✓</div>
          <h2 className="text-xl font-bold text-gray-900">登録完了！</h2>
          <p className="text-sm text-gray-600">
            資格証書を受け付けました。<br />審査が完了次第、メールでお知らせします。
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
            ⏳ 審査ステータス: <strong>審査待ち</strong>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setStep('select'); setFile(null); setPreview(null); setIssuedAt(''); setSelectedQual(null) }}>
              別の資格を追加
            </Button>
            <Link href="/" className="flex-1">
              <Button className="w-full">案件を探す</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
