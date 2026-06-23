'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notifications/NotificationBell'

function navItems(role: string | null) {
  if (role === 'employer') return [
    { href: '/employer/dashboard', label: 'ダッシュボード' },
    { href: '/employer/post-job', label: '案件作成' },
    { href: '/mypage', label: 'マイページ' },
  ]
  if (role === 'admin') return [
    { href: '/admin/qualifications', label: '資格審査' },
    { href: '/employer/dashboard', label: '案件管理' },
    { href: '/mypage', label: 'マイページ' },
  ]
  return [
    { href: '/', label: '案件を探す' },
    { href: '/applications', label: '応募履歴' },
    { href: '/mypage', label: 'マイページ' },
  ]
}

interface Props { role?: string | null }

export function Header({ role = null }: Props) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-screen-md mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href={role === 'employer' ? '/employer/dashboard' : role === 'admin' ? '/admin/qualifications' : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">プロイ</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems(role).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {item.label}
              </Link>
            ))}
            {role && <NotificationBell />}
          </nav>
        </div>
      </div>
    </header>
  )
}
