import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QualificationStatusBadge } from '@/components/qualifications/QualificationStatusBadge'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/LogoutButton'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { id: string; name: string; email?: string; role: string } | null

  type UserQualRow = {
    id: string; qualification_id: string; status: 'pending' | 'approved' | 'rejected'; issued_at: string; expires_at: string | null
    qualifications: { id: string; name: string; icon: string; category: string } | null
  }

  const { data: userQualsRaw } = await supabase
    .from('user_qualifications')
    .select('*, qualifications(id, name, icon, category)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const userQuals = userQualsRaw as UserQualRow[] | null

  const { count: appCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('worker_id', user.id)

  const approved = (userQuals ?? []).filter(q => q.status === 'approved')
  const pending = (userQuals ?? []).filter(q => q.status === 'pending')
  const isVerified = approved.length > 0

  return (
    <div className="space-y-4 pb-4">
      {/* プロフィール */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
            {profile?.name?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{profile?.name}</h2>
              {isVerified && <Badge variant="success">✓ 資格確認済み</Badge>}
            </div>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xl font-bold text-gray-900">{approved.length}</p>
            <p className="text-xs text-gray-500">承認済み資格</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-xl">
            <p className="text-xl font-bold text-amber-600">{pending.length}</p>
            <p className="text-xs text-gray-500">審査中</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-xl font-bold text-blue-600">{appCount ?? 0}</p>
            <p className="text-xs text-gray-500">応募履歴</p>
          </div>
        </div>
      </div>

      {/* 保有資格 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">保有資格</h3>
          <Link href="/mypage/qualifications" className="text-sm text-blue-600 font-medium hover:underline">
            ＋ 追加
          </Link>
        </div>

        {userQuals && userQuals.length > 0 ? (
          <div className="space-y-3">
            {userQuals.map(uq => (
              <div key={uq.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{uq.qualifications?.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{uq.qualifications?.name}</p>
                    <p className="text-xs text-gray-500">取得: {uq.issued_at}</p>
                  </div>
                </div>
                <QualificationStatusBadge status={uq.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <p className="text-3xl mb-2">📄</p>
            <p className="text-sm">資格をまだ登録していません</p>
            <Link href="/mypage/qualifications" className="text-blue-600 text-sm underline mt-1 inline-block">
              資格を登録する
            </Link>
          </div>
        )}

        {pending.length > 0 && (
          <div className="mt-3 bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
            ⏳ {pending.length}件の資格を審査中です（通常1〜2営業日）
          </div>
        )}
      </div>

      {/* メニュー */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {[
          { label: '応募履歴', href: '/applications', icon: '📋' },
          { label: '受け取った評価', href: '/mypage/reviews', icon: '⭐' },
          { label: 'プロフィール編集', href: '/mypage/edit', icon: '✏️' },
        ].map(item => (
          <Link key={item.href} href={item.href} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <span>{item.icon}</span>
              <span className="text-sm text-gray-800">{item.label}</span>
            </div>
            <span className="text-gray-400">›</span>
          </Link>
        ))}
        <div className="px-5 py-4">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
