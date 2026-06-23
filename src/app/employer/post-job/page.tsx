import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PostJobClient } from '@/components/employer/PostJobClient'

export default async function PostJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileRaw } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = profileRaw as { role: string } | null
  if (profile?.role !== 'employer' && profile?.role !== 'admin') redirect('/')

  const { data: qualsRaw } = await supabase.from('qualifications').select('*').order('category')
  const qualifications = (qualsRaw ?? []) as Array<{ id: string; name: string; icon: string; category: string }>

  return <PostJobClient qualifications={qualifications} userId={user.id} />
}
