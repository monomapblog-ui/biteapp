'use client'

import { useState } from 'react'
import { QUALIFICATIONS } from '@/data/mockData'
import { Qualification } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

type Step = 'select' | 'upload' | 'confirm' | 'done'

export default function QualificationsPage() {
  const [step, setStep] = useState<Step>('select')
  const [selectedQual, setSelectedQual] = useState<Qualification | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [issuedAt, setIssuedAt] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  function handleSubmit() {
    setStep('done')
  }

  const categories = [
    { key: 'driver', label: '運転免許', icon: '🚗' },
    { key: 'special', label: '特殊資格', icon: '🏗️' },
  ]

  return (
    <div className="space-y-4 pb-4">
      <Link href="/mypage" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← マイページ
      </Link>

      <h1 className="text-xl font-bold text-gray-900">資格を登録する</h1>

      {/* Progress */}
      <div className="flex gap-2 items-center">
        {(['select', 'upload', 'confirm'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === s ? 'bg-blue-600 text-white'
              : (['select', 'upload', 'confirm', 'done'] as Step[]).indexOf(step) > i ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-400'
            }`}>
              {(['select', 'upload', 'confirm', 'done'] as Step[]).indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className="text-xs text-gray-500">{['資格選択', 'アップロード', '確認'][i]}</span>
            {i < 2 && <div className="w-4 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select */}
      {step === 'select' && (
        <div className="space-y-4">
          {categories.map(cat => (
            <div key={cat.key}>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{cat.icon} {cat.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {QUALIFICATIONS.filter(q => q.category === cat.key).map(q => (
                  <button
                    key={q.id}
                    onClick={() => { setSelectedQual(q); setStep('upload') }}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left"
                  >
                    <span className="text-2xl">{q.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-gray-900 leading-snug">{q.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 'upload' && selectedQual && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
            <span className="text-xl">{selectedQual.icon}</span>
            <p className="text-sm font-medium text-blue-800">{selectedQual.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">取得日</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-400"
              value={issuedAt}
              onChange={e => setIssuedAt(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">資格証書（画像 / PDF）</label>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
              {preview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="証書プレビュー" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
                  <div className="absolute top-2 right-2">
                    <Badge variant="success">✓ アップロード済み</Badge>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <p className="text-3xl mb-2">📄</p>
                  <p className="text-sm text-gray-600 font-medium">タップしてアップロード</p>
                  <p className="text-xs text-gray-400 mt-1">JPG / PNG / PDF 対応</p>
                </div>
              )}
            </label>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            ⚠️ 資格証書の情報は管理者のみが確認します。第三者には共有されません。
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('select')}>戻る</Button>
            <Button
              className="flex-1"
              disabled={!file || !issuedAt}
              onClick={() => setStep('confirm')}
            >
              次へ
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
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
                <span className="font-medium text-emerald-600">✓ アップロード済み</span>
              </div>
            </div>
          </div>

          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="証書" className="w-full h-32 object-cover rounded-xl border border-gray-200" />
          )}

          <p className="text-xs text-gray-500 text-center">
            登録後、管理者が審査します（通常1〜2営業日）。<br />承認後にプロフィールに「資格確認済み」バッジが付与されます。
          </p>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('upload')}>戻る</Button>
            <Button className="flex-1" onClick={handleSubmit}>登録する</Button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className="text-center py-12 space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mx-auto">✓</div>
          <h2 className="text-xl font-bold text-gray-900">登録完了！</h2>
          <p className="text-sm text-gray-600">
            資格証書を受け付けました。<br />
            審査が完了次第、メールでお知らせします。
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
            ⏳ 現在の審査ステータス: <strong>審査待ち</strong>
          </div>
          <Link href="/">
            <Button className="w-full">案件を探す</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
