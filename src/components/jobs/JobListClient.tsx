'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { BookmarkButton } from '@/components/jobs/BookmarkButton'
import { formatDate, formatCurrency } from '@/lib/utils'

const QUAL_FILTER = [
  { id: 'all', label: 'すべて', icon: '🔍' },
  { id: '11111111-0001-0001-0001-000000000001', label: '大型', icon: '🚛' },
  { id: '11111111-0001-0001-0001-000000000002', label: '中型', icon: '🚌' },
  { id: '11111111-0001-0001-0001-000000000003', label: '普通', icon: '🚗' },
  { id: '11111111-0001-0001-0001-000000000004', label: '二種', icon: '🚎' },
  { id: '11111111-0001-0001-0001-000000000005', label: '牽引', icon: '🚚' },
  { id: '11111111-0001-0001-0001-000000000006', label: 'フォーク', icon: '🏗️' },
]

const PREFECTURES = ['すべて', '東京都', '神奈川県', '千葉県', '埼玉県']

interface JobRow {
  id: string; title: string; description: string; location: string; prefecture: string
  hourly_rate: number; work_date: string; start_time: string; end_time: string
  slots: number; remaining_slots: number
  job_required_qualifications: Array<{
    qualification_id: string; is_mandatory: boolean
    qualifications: { id: string; name: string; icon: string } | null
  }>
  job_tags: Array<{ tag: string }>
  profiles: { name: string } | null
}

interface Props {
  jobs: JobRow[]; approvedQualIds: string[]; pendingCount: number
  isLoggedIn: boolean; bookmarkedJobIds: string[]
}

function isEligible(job: JobRow, approvedIds: string[]): boolean {
  return job.job_required_qualifications.filter(q => q.is_mandatory).every(q => approvedIds.includes(q.qualification_id))
}

export function JobListClient({ jobs, approvedQualIds, pendingCount, isLoggedIn, bookmarkedJobIds }: Props) {
  const [qualFilter, setQualFilter] = useState('all')
  const [prefFilter, setPrefFilter] = useState('すべて')

  const filtered = jobs.filter(job => {
    const prefOk = prefFilter === 'すべて' || job.prefecture === prefFilter
    const qualOk = qualFilter === 'all' || job.job_required_qualifications.some(q => q.qualification_id === qualFilter)
    return prefOk && qualOk
  })

  return (
    <div className="space-y-4 pb-4">
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="text-sm font-medium text-amber-800">資格審査中</p>
            <p className="text-xs text-amber-600">{pendingCount}件の資格が審査待ちです。承認後に全案件へ応募できます。</p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
        <h1 className="text-xl font-bold mb-1">今日のスポット案件</h1>
        <p className="text-blue-100 text-sm mb-3">資格を活かしてスキマ時間に稼ごう</p>
        <div className="flex gap-3">
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold">{filtered.length}</p>
            <p className="text-xs text-blue-100">掲載中案件</p>
          </div>
          {isLoggedIn && (
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{approvedQualIds.length}</p>
              <p className="text-xs text-blue-100">保有資格（承認済）</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {QUAL_FILTER.map(f => (
          <button key={f.id} onClick={() => setQualFilter(f.id)}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              qualFilter === f.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
            }`}>
            <span>{f.icon}</span><span>{f.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {PREFECTURES.map(pref => (
          <button key={pref} onClick={() => setPrefFilter(pref)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              prefFilter === pref ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}>
            {pref}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500">{filtered.length}件の案件</p>

      <div className="space-y-3">
        {filtered.map(job => {
          const eligible = isLoggedIn && isEligible(job, approvedQualIds)
          const mandatory = job.job_required_qualifications.filter(q => q.is_mandatory && q.qualifications)
          const isBookmarked = bookmarkedJobIds.includes(job.id)

          return (
            <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all p-4 relative">
              {isLoggedIn && (
                <div className="absolute top-3 right-3">
                  <BookmarkButton jobId={job.id} initialBookmarked={isBookmarked} size="sm" />
                </div>
              )}
              <Link href={`/jobs/${job.id}`} className="block pr-10">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">{job.profiles?.name}</p>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{job.title}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(job.hourly_rate)}</p>
                    <p className="text-xs text-gray-500">/時間</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 mb-3">
                  <span>📅 {formatDate(job.work_date)}</span>
                  <span>🕐 {job.start_time.slice(0, 5)}〜{job.end_time.slice(0, 5)}</span>
                  <span>📍 {job.location}</span>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {mandatory.map(q => (
                    <Badge key={q.qualification_id} variant="outline" className="text-xs">
                      {q.qualifications!.icon} {q.qualifications!.name}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {job.job_tags.slice(0, 2).map(t => (
                      <Badge key={t.tag} variant="default" className="text-xs">{t.tag}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">残{job.remaining_slots}枠</span>
                    {isLoggedIn
                      ? eligible
                        ? <Badge variant="success">✓ 応募可能</Badge>
                        : <Badge variant="warning">資格要確認</Badge>
                      : <Badge variant="outline">要ログイン</Badge>
                    }
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">条件に合う案件が見つかりませんでした</p>
          </div>
        )}
      </div>
    </div>
  )
}
