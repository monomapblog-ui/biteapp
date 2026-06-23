import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationsClient } from '@/components/notifications/NotificationsClient'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: notifsRaw } = await supabase
    .from('notifications')
    .select('id, type, title, body, read, related_job_id, related_application_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = (notifsRaw ?? []) as Array<{
    id: string; type: string; title: string; body: string; read: boolean
    related_job_id: string | null; related_application_id: string | null; created_at: string
  }>

  return <NotificationsClient notifications={notifications} />
}
