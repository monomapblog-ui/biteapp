import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConversationListClient } from '@/components/messages/ConversationListClient'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: msgsRaw } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, body, read, created_at, job_id')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const msgs = (msgsRaw ?? []) as Array<{
    id: string; sender_id: string; receiver_id: string; body: string
    read: boolean; created_at: string; job_id: string | null
  }>

  // 会話相手ごとにグループ化（最新メッセージのみ保持）
  const convMap = new Map<string, {
    partnerId: string; lastBody: string; lastAt: string
    unread: number; jobId: string | null
  }>()

  for (const msg of msgs) {
    const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, {
        partnerId,
        lastBody: msg.body,
        lastAt: msg.created_at,
        unread: (!msg.read && msg.receiver_id === user.id) ? 1 : 0,
        jobId: msg.job_id,
      })
    } else {
      const c = convMap.get(partnerId)!
      if (!msg.read && msg.receiver_id === user.id) c.unread++
    }
  }

  const conversations = [...convMap.values()]
  const partnerIds = conversations.map(c => c.partnerId)

  const { data: partnersRaw } = partnerIds.length > 0
    ? await supabase.from('profiles').select('id, name, avatar_url').in('id', partnerIds)
    : { data: [] }

  const partnerMap = Object.fromEntries(
    ((partnersRaw ?? []) as Array<{ id: string; name: string; avatar_url: string | null }>).map(p => [p.id, p])
  )

  const items = conversations.map(c => ({
    ...c,
    partnerName: partnerMap[c.partnerId]?.name ?? '不明',
    partnerAvatar: partnerMap[c.partnerId]?.avatar_url ?? null,
  }))

  return <ConversationListClient items={items} />
}
