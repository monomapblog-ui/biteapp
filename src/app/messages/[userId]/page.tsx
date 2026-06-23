import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ChatClient } from '@/components/messages/ChatClient'

export default async function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: partnerId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: partnerRaw } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .eq('id', partnerId)
    .single()

  if (!partnerRaw) notFound()
  const partner = partnerRaw as { id: string; name: string; avatar_url: string | null }

  const { data: msgsRaw } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, body, read, created_at, job_id')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  const messages = (msgsRaw ?? []) as Array<{
    id: string; sender_id: string; receiver_id: string; body: string
    read: boolean; created_at: string; job_id: string | null
  }>

  // mark messages from partner as read
  const unreadIds = messages
    .filter(m => m.sender_id === partnerId && !m.read)
    .map(m => m.id)

  if (unreadIds.length > 0) {
    await supabase.from('messages').update({ read: true } as never).in('id', unreadIds)
  }

  return (
    <ChatClient
      currentUserId={user.id}
      partner={partner}
      initialMessages={messages}
    />
  )
}
