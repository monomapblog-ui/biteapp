'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const client = createClient()
    let userId: string | null = null

    async function fetchUnread() {
      const { data: { user } } = await client.auth.getUser()
      if (!user) return
      userId = user.id
      const { count } = await client
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      setUnread(count ?? 0)

      // realtime subscription for new notifications
      const channel = client
        .channel('notification-bell')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => setUnread(prev => prev + 1)
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          async () => {
            // re-fetch count after bulk read
            const { count: newCount } = await client
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('read', false)
            setUnread(newCount ?? 0)
          }
        )
        .subscribe()

      return channel
    }

    let channelPromise: Promise<ReturnType<typeof client.channel> | undefined>
    channelPromise = fetchUnread()

    return () => {
      channelPromise.then(ch => {
        if (ch) client.removeChannel(ch)
      })
    }
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
        <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 animate-pulse">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}
