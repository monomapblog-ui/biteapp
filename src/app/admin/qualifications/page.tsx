import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminQualificationsClient } from '@/components/admin/AdminQualificationsClient'

export default async function AdminQualificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileRaw } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const profile = profileRaw as { role: string } | null
  if (profile?.role !== 'admin') redirect('/')

  const { data: pendingRaw } = await supabase
    .from('user_qualifications')
    .select('id, certificate_url, issued_at, expires_at, status, created_at, user_id, qualification_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const pending = (pendingRaw ?? []) as Array<{
    id: string; certificate_url: string; issued_at: string
    expires_at: string | null; status: string; created_at: string
    user_id: string; qualification_id: string
  }>

  const userIds = [...new Set(pending.map(p => p.user_id))]
  const qualIds = [...new Set(pending.map(p => p.qualification_id))]

  const [{ data: usersRaw }, { data: qualsRaw }] = await Promise.all([
    userIds.length > 0
      ? supabase.from('profiles').select('id, name').in('id', userIds)
      : { data: [] },
    qualIds.length > 0
      ? supabase.from('qualifications').select('id, name, icon').in('id', qualIds)
      : { data: [] },
  ])

  const userMap = Object.fromEntries(
    ((usersRaw ?? []) as Array<{ id: string; name: string }>).map(u => [u.id, u])
  )
  const qualMap = Object.fromEntries(
    ((qualsRaw ?? []) as Array<{ id: string; name: string; icon: string }>).map(q => [q.id, q])
  )

  const items = pending.map(p => ({
    ...p,
    userName: userMap[p.user_id]?.name ?? '不明',
    qualName: qualMap[p.qualification_id]?.name ?? '不明',
    qualIcon: qualMap[p.qualification_id]?.icon ?? '📄',
  }))

  return <AdminQualificationsClient items={items} />
}
