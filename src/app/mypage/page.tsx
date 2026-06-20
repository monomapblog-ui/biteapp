'use client'

import { MOCK_USER } from '@/data/mockData'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { QualificationStatusBadge } from '@/components/qualifications/QualificationStatusBadge'
import Link from 'next/link'

export default function MyPage() {
  const approvedQuals = MOCK_USER.qualifications.filter(q => q.status === 'approved')
  const pendingQuals = MOCK_USER.qualifications.filter(q => q.status === 'pending')
  const isVerified = approvedQuals.length > 0

  return (
    <div className="space-y-4 pb-4">
      {/* Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
            {MOCK_USER.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{MOCK_USER.name}</h2>
              {isVerified && (
                <Badge variant="success">✓ 資格確認済み</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">{MOCK_USER.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xl font-bold text-gray-900">{approvedQuals.length}</p>
            <p className="text-xs text-gray-500">承認済み資格</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-xl">
            <p className="text-xl font-bold text-amber-600">{pendingQuals.length}</p>
            <p className="text-xs text-gray-500">審査中</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-xl font-bold text-blue-600">2</p>
            <p className="text-xs text-gray-500">応募履歴</p>
          </div>
        </div>
      </div>

      {/* Qualifications section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">保有資格</h3>
          <Link href="/mypage/qualifications">
            <Button variant="outline" size="sm">＋ 追加する</Button>
          </Link>
        </div>

        <div className="space-y-3">
          {MOCK_USER.qualifications.map(uq => (
            <div key={uq.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{uq.qualification.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{uq.qualification.name}</p>
                  <p className="text-xs text-gray-500">取得: {uq.issuedAt}</p>
                </div>
              </div>
              <QualificationStatusBadge status={uq.status} />
            </div>
          ))}
        </div>

        {pendingQuals.length > 0 && (
          <div className="mt-3 bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
            ⏳ {pendingQuals.length}件の資格を審査中です（通常1〜2営業日）
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {[
          { label: '応募履歴', href: '/applications', icon: '📋' },
          { label: '銀行口座の登録', href: '/mypage/bank', icon: '🏦' },
          { label: '通知設定', href: '/mypage/notifications', icon: '🔔' },
          { label: 'プロフィール編集', href: '/mypage/edit', icon: '✏️' },
        ].map(item => (
          <Link key={item.href} href={item.href} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <span>{item.icon}</span>
              <span className="text-sm text-gray-800">{item.label}</span>
            </div>
            <span className="text-gray-400 text-sm">›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
