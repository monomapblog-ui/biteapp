'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string; type: string; title: string; body: string; read: boolean
  related_job_id: string | null; related_application_id: string | null; created_at: string
}

const TYPE_ICON: Record<string, string> = {
  new_application: '📥',
  application_accepted: '🎉',
  application_rejected: '😞',
  job_closed: '🔒',
  job_completed: '✅',
  review_received: '⭐',
}

function linkForNotif(n: Notification, role?: string) {
  if (n.related_job_id && role === 'employer') return `/employer/jobs/${n.related_job_id}`
  if (n.related_application_id) return '/applications'
  if (n.related_job_id) return `/jobs/${n.related_job_id}`
  return '/notifications'
}

interface Props { notifications: Notification[] }

export function NotificationsClient({ notifications: initial }: Props) {
  const [items, setItems] = useState(initial)
  const supabase = createClient()

  useEffect(() => {
    async function markAllRead() {
      const unreadIds = items.filter(n => !n.read).map(n => n.id)
      if (unreadIds.length === 0) return
      await supabase.from('notifications').update({ read: true } as never).in('id', unreadIds)
      setItems(prev => prev.map(n => ({ ...n, read: true })))
    }
    markAllRead()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4 pb-8">
      <h1 className="text-xl font-bold text-gray-900">通知</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-sm">通知はありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <Link key={n.id} href={linkForNotif(n)}>
              <div className={`bg-white rounded-xl border shadow-sm p-4 flex gap-3 items-start transition-colors hover:border-blue-200 ${
                !n.read ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100'
              }`}>
                <span className="text-2xl flex-shrink-0">{TYPE_ICON[n.type] ?? '📢'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
