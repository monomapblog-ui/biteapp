'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast/ToastProvider'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  body: string
  read: boolean
  created_at: string
  job_id: string | null
}

interface Props {
  currentUserId: string
  partner: { id: string; name: string; avatar_url: string | null }
  initialMessages: Message[]
}

export function ChatClient({ currentUserId, partner, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const toast = useToast()
  const router = useRouter()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${[currentUserId, partner.id].sort().join(':')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          if (msg.sender_id !== partner.id) return
          setMessages(prev => [...prev, msg])
          supabase.from('messages').update({ read: true } as never).eq('id', msg.id)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSend() {
    const text = body.trim()
    if (!text) return
    setSending(true)
    setBody('')

    const { data, error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: partner.id,
      body: text,
      read: false,
    } as never).select('id, sender_id, receiver_id, body, read, created_at, job_id').single()

    if (error) {
      toast.error('送信に失敗しました')
      setBody(text)
    } else if (data) {
      setMessages(prev => [...prev, data as Message])
    }
    setSending(false)
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDay(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
  }

  // Group messages by day
  const grouped: { day: string; msgs: Message[] }[] = []
  for (const m of messages) {
    const day = formatDay(m.created_at)
    if (!grouped.length || grouped[grouped.length - 1].day !== day) {
      grouped.push({ day, msgs: [m] })
    } else {
      grouped[grouped.length - 1].msgs.push(m)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">← 戻る</button>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
          {partner.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={partner.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            : <span className="text-sm font-bold text-blue-600">{partner.name.charAt(0)}</span>
          }
        </div>
        <span className="font-semibold text-gray-900">{partner.name}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {grouped.map(({ day, msgs }) => (
          <div key={day}>
            <p className="text-center text-xs text-gray-400 mb-3">{day}</p>
            <div className="space-y-2">
              {msgs.map(m => {
                const isMine = m.sender_id === currentUserId
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}>
                      <p>{m.body}</p>
                      <p className={`text-[10px] mt-0.5 text-right ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                        {formatTime(m.created_at)}
                        {isMine && <span className="ml-1">{m.read ? '✓✓' : '✓'}</span>}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="メッセージを入力..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={handleSend}
          disabled={sending || !body.trim()}
          className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0"
        >
          ➤
        </button>
      </div>
    </div>
  )
}
