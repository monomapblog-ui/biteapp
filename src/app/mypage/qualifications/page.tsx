import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QualificationUploadClient } from '@/components/qualifications/QualificationUploadClient'

export default async function QualificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: qualifications } = await supabase
    .from('qualifications')
    .select('*')
    .order('category')

  const { data: userQualsRaw } = await supabase
    .from('user_qualifications')
    .select('qualification_id, status')
    .eq('user_id', user.id)

  const registeredIds = ((userQualsRaw ?? []) as Array<{ qualification_id: string; status: string }>)
    .map(q => q.qualification_id)

  return (
    <QualificationUploadClient
      qualifications={qualifications ?? []}
      registeredIds={registeredIds}
      userId={user.id}
    />
  )
}
