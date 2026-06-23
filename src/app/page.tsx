import { createClient } from '@/lib/supabase/server'
import { JobListClient } from '@/components/jobs/JobListClient'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: jobs } = await supabase
    .from('jobs_with_remaining')
    .select(`
      *,
      job_required_qualifications(
        qualification_id,
        is_mandatory,
        qualifications(id, name, icon, description, category)
      ),
      job_tags(tag),
      profiles!jobs_employer_id_fkey(name)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  let approvedQualIds: string[] = []
  let pendingCount = 0
  let bookmarkedJobIds: string[] = []

  if (user) {
    const [{ data: userQualsRaw }, { data: bookmarksRaw }] = await Promise.all([
      supabase.from('user_qualifications').select('qualification_id, status').eq('user_id', user.id),
      supabase.from('job_bookmarks').select('job_id').eq('user_id', user.id),
    ])

    const userQuals = (userQualsRaw ?? []) as Array<{ qualification_id: string; status: string }>
    approvedQualIds = userQuals.filter(q => q.status === 'approved').map(q => q.qualification_id)
    pendingCount = userQuals.filter(q => q.status === 'pending').length
    bookmarkedJobIds = ((bookmarksRaw ?? []) as Array<{ job_id: string }>).map(b => b.job_id)
  }

  return (
    <JobListClient
      jobs={jobs ?? []}
      approvedQualIds={approvedQualIds}
      pendingCount={pendingCount}
      isLoggedIn={!!user}
      bookmarkedJobIds={bookmarkedJobIds}
    />
  )
}
