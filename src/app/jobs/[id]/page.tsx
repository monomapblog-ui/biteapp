import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { JobDetailClient } from '@/components/jobs/JobDetailClient'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: job } = await supabase
    .from('jobs_with_remaining')
    .select(`
      *,
      job_required_qualifications(
        qualification_id,
        is_mandatory,
        qualifications(id, name, icon, description, category)
      ),
      job_tags(tag),
      profiles!jobs_employer_id_fkey(name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (!job) notFound()

  let approvedQualIds: string[] = []
  let existingApplication = null

  if (user) {
    const { data: userQuals } = await supabase
      .from('user_qualifications')
      .select('qualification_id, status')
      .eq('user_id', user.id)
      .eq('status', 'approved')

    approvedQualIds = ((userQuals ?? []) as Array<{ qualification_id: string; status: string }>)
      .map(q => q.qualification_id)

    const { data: app } = await supabase
      .from('applications')
      .select('id, status')
      .eq('job_id', id)
      .eq('worker_id', user.id)
      .single()

    existingApplication = app
  }

  return (
    <JobDetailClient
      job={job}
      approvedQualIds={approvedQualIds}
      userId={user?.id ?? null}
      existingApplication={existingApplication}
    />
  )
}
