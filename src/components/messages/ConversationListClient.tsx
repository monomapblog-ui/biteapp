'use client'

import { useRouter } from 'next/navigation'
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'たった今'
  if (m < 60) return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}時間前`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}日前`
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

interface ConversationItem {
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  lastBody: string
  lastAt: string
  unread: number
  jobId: string | null
}

interface Props { items: ConversationItem[] }

export function ConversationListClient({ items }: Props) {
  const router = useRouter()

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold text-gray-900">メッセージ</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm">まだメッセージはありません</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map(item => (
            <button
              key={item.partnerId}
              onClick={() => router.push(`/messages/${item.partnerId}`)}
              className="w-full flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                {item.partnerAvatar
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={item.partnerAvatar} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-lg font-bold text-blue-600">{item.partnerName.charAt(0)}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-gray-900">{item.partnerName}</span>
                  <span className="text-xs text-gray-400">
                    {relativeTime(item.lastAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{item.lastBody}</p>
              </div>
              {item.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0">
                  {item.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
