'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

function navItems(role: string | null) {
  if (role === 'employer') return [
    { href: '/employer/dashboard', label: 'ダッシュボード', icon: '📋' },
    { href: '/employer/post-job', label: '案件作成', icon: '➕' },
    { href: '/notifications', label: '通知', icon: '🔔' },
    { href: '/mypage', label: 'マイページ', icon: '👤' },
  ]
  if (role === 'admin') return [
    { href: '/admin/qualifications', label: '資格審査', icon: '🔍' },
    { href: '/employer/dashboard', label: '案件管理', icon: '📋' },
    { href: '/notifications', label: '通知', icon: '🔔' },
    { href: '/mypage', label: 'マイページ', icon: '👤' },
  ]
  return [
    { href: '/', label: '案件', icon: '🔍' },
    { href: '/applications', label: '応募', icon: '📋' },
    { href: '/notifications', label: '通知', icon: '🔔' },
    { href: '/mypage', label: 'マイページ', icon: '👤' },
  ]
}

interface Props { role?: string | null }

export function BottomNav({ role = null }: Props) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-bottom">
      <div className="max-w-screen-md mx-auto flex">
        {navItems(role).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors',
              pathname === item.href ? 'text-blue-600' : 'text-gray-500'
            )}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className={cn('font-medium', pathname === item.href && 'text-blue-600')}>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
