'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast/ToastProvider'
import { Button } from '@/components/ui/Button'

interface Qualification { id: string; name: string; icon: string; category: string }
interface Props { qualifications: Qualification[]; userId: string }

const PREFECTURES = ['東京都', '神奈川県', '千葉県', '埼玉県', '大阪府', '愛知県', '福岡県', 'その他']
const PRESET_TAGS = ['昼食支給', '経験者歓迎', '週払い可', '屋内作業', '高速代支給', '宿泊費支給', '早朝', '土日']

export function PostJobClient({ qualifications, userId }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [prefecture, setPrefecture] = useState('東京都')
  const [hourlyRate, setHourlyRate] = useState('')
  const [workDate, setWorkDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [slots, setSlots] = useState('1')
  const [selectedQuals, setSelectedQuals] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const toast = useToast()
  const router = useRouter()

  function toggleQual(id: string) {
    setSelectedQuals(prev => prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id])
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedQuals.length === 0) {
      toast.error('必須資格を1つ以上選択してください')
      return
    }
    setLoading(true)

    // 1. 案件を作成
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        employer_id: userId,
        title,
        description,
        location,
        prefecture,
        hourly_rate: parseInt(hourlyRate),
        work_date: workDate,
        start_time: startTime,
        end_time: endTime,
        slots: parseInt(slots),
        status: 'open',
      } as never)
      .select('id')
      .single()

    if (jobError || !job) {
      toast.error('案件の作成に失敗しました: ' + jobError?.message)
      setLoading(false)
      return
    }

    const jobId = (job as { id: string }).id

    // 2. 必須資格を登録
    await supabase.from('job_required_qualifications').insert(
      selectedQuals.map(qid => ({ job_id: jobId, qualification_id: qid, is_mandatory: true } as never))
    )

    // 3. タグを登録
    if (selectedTags.length > 0) {
      await supabase.from('job_tags').insert(
        selectedTags.map(tag => ({ job_id: jobId, tag } as never))
      )
    }

    toast.success('案件を公開しました！')
    setLoading(false)
    router.push('/employer/dashboard')
  }

  const categories = [
    { key: 'driver', label: '運転免許', icon: '🚗' },
    { key: 'special', label: '特殊資格', icon: '🏗️' },
  ]

  return (
    <div className="space-y-5 pb-8">
      <Link href="/employer/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← ダッシュボード
      </Link>
      <h1 className="text-xl font-bold text-gray-900">案件を作成する</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 基本情報 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">基本情報</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">案件タイトル <span className="text-red-500">*</span></label>
            <input required value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
              placeholder="例：大型トラックドライバー【都内スポット】" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">仕事内容 <span className="text-red-500">*</span></label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none"
              rows={4} placeholder="勤務内容、持ち物、注意事項などを記入してください" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">都道府県 <span className="text-red-500">*</span></label>
              <select value={prefecture} onChange={e => setPrefecture(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400">
                {PREFECTURES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">勤務地（詳細） <span className="text-red-500">*</span></label>
              <input required value={location} onChange={e => setLocation(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
                placeholder="例：江東区有明" />
            </div>
          </div>
        </div>

        {/* 日時・給与 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">日時・給与</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">勤務日 <span className="text-red-500">*</span></label>
            <input required type="date" value={workDate} onChange={e => setWorkDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">開始時間 <span className="text-red-500">*</span></label>
              <input required type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">終了時間 <span className="text-red-500">*</span></label>
              <input required type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">時給（円） <span className="text-red-500">*</span></label>
              <input required type="number" min="1000" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
                placeholder="2000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">募集人数</label>
              <input type="number" min="1" max="99" value={slots} onChange={e => setSlots(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>
        </div>

        {/* 必須資格 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">必須資格 <span className="text-red-500">*</span></h2>
          <p className="text-xs text-gray-500">選択した資格を持つ（承認済み）ユーザーのみ応募できます</p>
          {categories.map(cat => (
            <div key={cat.key}>
              <p className="text-xs font-semibold text-gray-400 mb-2">{cat.icon} {cat.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {qualifications.filter(q => q.category === cat.key).map(q => (
                  <button key={q.id} type="button" onClick={() => toggleQual(q.id)}
                    className={`flex items-center gap-2 p-3 border rounded-xl text-left text-sm transition-colors ${
                      selectedQuals.includes(q.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-100 hover:border-gray-300'
                    }`}>
                    <span>{q.icon}</span>
                    <span className="text-xs font-medium leading-snug">{q.name}</span>
                    {selectedQuals.includes(q.id) && <span className="ml-auto text-blue-600">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {selectedQuals.length > 0 && (
            <p className="text-xs text-blue-600 font-medium">{selectedQuals.length}個の資格を選択中</p>
          )}
        </div>

        {/* タグ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">タグ（任意）</h2>
          <div className="flex flex-wrap gap-2">
            {PRESET_TAGS.map(tag => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? '公開中...' : '案件を公開する'}
        </Button>
      </form>
    </div>
  )
}
