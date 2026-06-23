'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const client = createClient()
    async function fetchUnread() {
      const { data: { user } } = await client.auth.getUser()
      if (!user) return
      const { count } = await client
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      setUnread(count ?? 0)
    }
    fetchUnread()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <button
      onClick={() => router.push('/notifications')}
      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
      aria-label="通知"
    >
      <span className="text-xl leading-none">🔔</span>
      {unread > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}
