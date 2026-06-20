'use client'

import { useState } from 'react'
import { MOCK_JOBS, MOCK_USER, QUALIFICATIONS } from '@/data/mockData'
import { JobCard } from '@/components/jobs/JobCard'
import { Badge } from '@/components/ui/Badge'

const PREFECTURES = ['すべて', '東京都', '神奈川県', '千葉県', '埼玉県']
const QUAL_FILTER = [
  { id: 'all', label: 'すべて', icon: '🔍' },
  { id: 'q1', label: '大型', icon: '🚛' },
  { id: 'q2', label: '中型', icon: '🚌' },
  { id: 'q3', label: '普通', icon: '🚗' },
  { id: 'q4', label: '二種', icon: '🚎' },
  { id: 'q5', label: '牽引', icon: '🚚' },
  { id: 'q6', label: 'フォーク', icon: '🏗️' },
]

export default function HomePage() {
  const [prefFilter, setPrefFilter] = useState('すべて')
  const [qualFilter, setQualFilter] = useState('all')

  const filtered = MOCK_JOBS.filter(job => {
    const prefOk = prefFilter === 'すべて' || job.prefecture === prefFilter
    const qualOk = qualFilter === 'all' || job.requiredQualifications.some(q => q.id === qualFilter)
    return prefOk && qualOk
  })

  const approvedCount = MOCK_USER.qualifications.filter(q => q.status === 'approved').length
  const pendingCount = MOCK_USER.qualifications.filter(q => q.status === 'pending').length

  return (
    <div className="space-y-4 pb-4">
      {/* Status bar */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="text-sm font-medium text-amber-800">資格審査中</p>
            <p className="text-xs text-amber-600">{pendingCount}件の資格が審査待ちです。承認後に全案件へ応募できます。</p>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
        <p className="text-blue-100 text-sm mb-1">こんにちは、{MOCK_USER.name}さん</p>
        <h1 className="text-xl font-bold mb-3">今日のスポット案件</h1>
        <div className="flex gap-3">
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold">{filtered.length}</p>
            <p className="text-xs text-blue-100">応募可能案件</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold">{approvedCount}</p>
            <p className="text-xs text-blue-100">保有資格（承認済）</p>
          </div>
        </div>
      </div>

      {/* Qualification filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {QUAL_FILTER.map(f => (
          <button
            key={f.id}
            onClick={() => setQualFilter(f.id)}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              qualFilter === f.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Prefecture filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {PREFECTURES.map(pref => (
          <button
            key={pref}
            onClick={() => setPrefFilter(pref)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              prefFilter === pref
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {pref}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">{filtered.length}件の案件</p>

      {/* Job list */}
      <div className="space-y-3">
        {filtered.map(job => (
          <JobCard key={job.id} job={job} userQualifications={MOCK_USER.qualifications} />
        ))}
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
