'use client'

import { useState, useMemo } from 'react'
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

const RATE_FILTERS = [
  { id: 'all', label: 'すべて' },
  { id: '1000', label: '〜¥1,499' },
  { id: '1500', label: '¥1,500〜' },
  { id: '2000', label: '¥2,000〜' },
]

function getDateFilters() {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2)
  const weekLater = new Date(today); weekLater.setDate(today.getDate() + 7)
  return [
    { id: 'all', label: 'いつでも' },
    { id: fmt(today), label: '今日' },
    { id: fmt(tomorrow), label: '明日' },
    { id: `${fmt(today)}:${fmt(weekLater)}`, label: '今週中' },
  ]
}

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
  const [rateFilter, setRateFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set(bookmarkedJobIds))

  const dateFilters = useMemo(() => getDateFilters(), [])

  const filtered = useMemo(() => jobs.filter(job => {
    if (prefFilter !== 'すべて' && job.prefecture !== prefFilter) return false
    if (qualFilter !== 'all' && !job.job_required_qualifications.some(q => q.qualification_id === qualFilter)) return false
    if (rateFilter === '1000' && job.hourly_rate >= 1500) return false
    if (rateFilter === '1500' && job.hourly_rate < 1500) return false
    if (rateFilter === '2000' && job.hourly_rate < 2000) return false
    if (dateFilter !== 'all') {
      if (dateFilter.includes(':')) {
        const [from, to] = dateFilter.split(':')
        if (job.work_date < from || job.work_date > to) return false
      } else {
        if (job.work_date !== dateFilter) return false
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      const hit = job.title.toLowerCase().includes(q)
        || job.location.toLowerCase().includes(q)
        || (job.profiles?.name ?? '').toLowerCase().includes(q)
        || job.job_tags.some(t => t.tag.toLowerCase().includes(q))
      if (!hit) return false
    }
    return true
  }), [jobs, prefFilter, qualFilter, rateFilter, dateFilter, searchQuery])

  const eligibleCount = isLoggedIn
    ? filtered.filter(j => isEligible(j, approvedQualIds)).length
    : 0

  return (
    <div className="space-y-3 pb-4">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
        <h1 className="text-xl font-bold mb-0.5">今日のスポット案件</h1>
        <p className="text-blue-100 text-sm mb-3">資格を活かしてスキマ時間に稼ごう</p>
        <div className="flex gap-3">
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold">{filtered.length}</p>
            <p className="text-xs text-blue-100">掲載中</p>
          </div>
          {isLoggedIn && (
            <>
              <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                <p className="text-2xl font-bold">{eligibleCount}</p>
                <p className="text-xs text-blue-100">応募可能</p>
              </div>
              <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                <p className="text-2xl font-bold">{approvedQualIds.length}</p>
                <p className="text-xs text-blue-100">保有資格</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pending qual alert */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">⏳</span>
          <div>
            <p className="text-sm font-medium text-amber-800">資格審査中（{pendingCount}件）</p>
            <p className="text-xs text-amber-600">承認後すべての案件に応募できます（通常1〜2営業日）</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="案件名・場所・企業名で検索"
          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
          >×</button>
        )}
      </div>

      {/* Date filter */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 scrollbar-none">
        {dateFilters.map(f => (
          <button key={f.id} onClick={() => setDateFilter(f.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              dateFilter === f.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Qual filter */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 scrollbar-none">
        {QUAL_FILTER.map(f => (
          <button key={f.id} onClick={() => setQualFilter(f.id)}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              qualFilter === f.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
            }`}>
            <span>{f.icon}</span><span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Prefecture + Rate filters */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 scrollbar-none">
        {PREFECTURES.map(pref => (
          <button key={pref} onClick={() => setPrefFilter(pref)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              prefFilter === pref ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200'
            }`}>
            {pref}
          </button>
        ))}
        <div className="w-px h-5 bg-gray-200 self-center mx-1 flex-shrink-0" />
        {RATE_FILTERS.map(f => (
          <button key={f.id} onClick={() => setRateFilter(f.id)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              rateFilter === f.id ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-500 border-gray-200'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-500 px-0.5">
        {filtered.length}件の案件
        {searchQuery && <span className="ml-1 text-blue-600">「{searchQuery}」</span>}
      </p>

      {/* Job list */}
      <div className="space-y-3">
        {filtered.map(job => {
          const eligible = isLoggedIn && isEligible(job, approvedQualIds)
          const mandatory = job.job_required_qualifications.filter(q => q.is_mandatory && q.qualifications)
          const isBookmarked = bookmarkedIds.has(job.id)

          return (
            <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all p-4 relative">
              {isLoggedIn && (
                <div className="absolute top-3 right-3">
                  <BookmarkButton
                    jobId={job.id}
                    initialBookmarked={isBookmarked}
                    size="sm"
                    onToggle={v => setBookmarkedIds(prev => {
                      const s = new Set(prev)
                      v ? s.add(job.id) : s.delete(job.id)
                      return s
                    })}
                  />
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

                {mandatory.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {mandatory.map(q => (
                      <Badge key={q.qualification_id} variant="outline" className="text-xs">
                        {q.qualifications!.icon} {q.qualifications!.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
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
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm font-medium text-gray-600">条件に合う案件が見つかりませんでした</p>
            <p className="text-xs text-gray-400 mt-1">フィルターを変更してみてください</p>
            <button
              onClick={() => { setQualFilter('all'); setPrefFilter('すべて'); setRateFilter('all'); setDateFilter('all'); setSearchQuery('') }}
              className="mt-3 text-xs text-blue-600 underline"
            >
              フィルターをリセット
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
