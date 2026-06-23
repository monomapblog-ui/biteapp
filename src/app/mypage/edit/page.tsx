import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileEditClient } from '@/components/mypage/ProfileEditClient'

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileRaw } = await supabase
    .from('profiles').select('name, phone, avatar_url, role').eq('id', user.id).single()
  const profile = profileRaw as { name: string; phone: string | null; avatar_url: string | null; role: string } | null

  return (
    <ProfileEditClient
      userId={user.id}
      initialName={profile?.name ?? ''}
      initialPhone={profile?.phone ?? ''}
      initialAvatarUrl={profile?.avatar_url ?? null}
    />
  )
}
