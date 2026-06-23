import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { WorkerProfileClient } from '@/components/workers/WorkerProfileClient'

export default async function WorkerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // only employers/admin can view worker profiles
  const { data: viewerProfileRaw } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const viewerProfile = viewerProfileRaw as { role: string } | null
  if (viewerProfile?.role !== 'employer' && viewerProfile?.role !== 'admin') redirect('/')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, created_at')
    .eq('id', id)
    .single()

  const profile = profileRaw as { id: string; name: string; avatar_url: string | null; created_at: string } | null
  if (!profile) notFound()

  // approved qualifications
  const { data: qualsRaw } = await supabase
    .from('user_qualifications')
    .select('qualification_id, issued_at, qualifications(name, icon, category)')
    .eq('user_id', id)
    .eq('status', 'approved')

  const quals = (qualsRaw ?? []) as Array<{
    qualification_id: string; issued_at: string
    qualifications: { name: string; icon: string; category: string } | null
  }>

  // reviews received
  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select('id, rating, comment, reviewer_role, created_at, reviewer_id, job_id')
    .eq('reviewee_id', id)
    .eq('reviewer_role', 'employer')
    .order('created_at', { ascending: false })

  const reviews = (reviewsRaw ?? []) as Array<{
    id: string; rating: number; comment: string | null; reviewer_role: string; created_at: string
    reviewer_id: string; job_id: string
  }>

  const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id))]
  const jobIds = [...new Set(reviews.map(r => r.job_id))]

  const [{ data: reviewersRaw }, { data: jobsRaw }, { data: employerJobsRaw }] = await Promise.all([
    reviewerIds.length > 0 ? supabase.from('profiles').select('id, name').in('id', reviewerIds) : { data: [] },
    jobIds.length > 0 ? supabase.from('jobs').select('id, title').in('id', jobIds) : { data: [] },
    supabase.from('jobs').select('id, title').eq('employer_id', user.id).eq('status', 'open'),
  ])

  const reviewerMap = Object.fromEntries(
    ((reviewersRaw ?? []) as Array<{ id: string; name: string }>).map(r => [r.id, r])
  )
  const jobMap = Object.fromEntries(
    ((jobsRaw ?? []) as Array<{ id: string; title: string }>).map(j => [j.id, j])
  )
  const employerOpenJobs = (employerJobsRaw ?? []) as Array<{ id: string; title: string }>

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  // completed jobs count
  const { count: completedCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('worker_id', id)
    .eq('status', 'accepted')

  return (
    <WorkerProfileClient
      profile={profile}
      qualifications={quals}
      reviews={reviews.map(r => ({
        ...r,
        reviewerName: reviewerMap[r.reviewer_id]?.name ?? '匿名',
        jobTitle: jobMap[r.job_id]?.title ?? '案件',
      }))}
      avgRating={avgRating}
      completedCount={completedCount ?? 0}
      employerOpenJobs={employerOpenJobs}
      viewerId={user.id}
      workerId={id}
    />
  )
}
