import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApplicationsClient } from '@/components/applications/ApplicationsClient'

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: applicationsRaw } = await supabase
    .from('applications')
    .select('id, status, applied_at, message, job_id')
    .eq('worker_id', user.id)
    .order('applied_at', { ascending: false })

  const applications = (applicationsRaw ?? []) as Array<{
    id: string; status: string; applied_at: string; message: string | null; job_id: string
  }>

  const jobIds = applications.map(a => a.job_id)
  type JobRow = { id: string; title: string; work_date: string; hourly_rate: number; location: string; prefecture: string; employer_id: string }
  type EmployerRow = { id: string; name: string }

  const { data: jobsRaw } = jobIds.length > 0
    ? await supabase.from('jobs').select('id, title, work_date, hourly_rate, location, prefecture, employer_id').in('id', jobIds)
    : { data: [] as JobRow[] }

  const jobsData = (jobsRaw ?? []) as JobRow[]
  const employerIds = [...new Set(jobsData.map(j => j.employer_id))]

  const { data: employersRaw } = employerIds.length > 0
    ? await supabase.from('profiles').select('id, name').in('id', employerIds)
    : { data: [] as EmployerRow[] }

  const employersData = (employersRaw ?? []) as EmployerRow[]

  // existing reviews by this worker
  const acceptedAppIds = applications.filter(a => a.status === 'accepted').map(a => a.id)
  const { data: reviewsRaw } = acceptedAppIds.length > 0
    ? await supabase.from('reviews').select('application_id').eq('reviewer_id', user.id).in('application_id', acceptedAppIds)
    : { data: [] }

  const reviewedAppIds = new Set(((reviewsRaw ?? []) as Array<{ application_id: string }>).map(r => r.application_id))

  const jobMap = Object.fromEntries(jobsData.map(j => [j.id, j]))
  const employerMap = Object.fromEntries(employersData.map(e => [e.id, e]))

  const items = applications.map(app => {
    const job = jobMap[app.job_id]
    if (!job) return null
    return {
      ...app,
      job,
      employerName: employerMap[job.employer_id]?.name ?? '',
      employerId: job.employer_id,
      alreadyReviewed: reviewedAppIds.has(app.id),
    }
  }).filter(Boolean) as Array<{
    id: string; status: string; applied_at: string; message: string | null; job_id: string
    job: JobRow; employerName: string; employerId: string; alreadyReviewed: boolean
  }>

  return <ApplicationsClient items={items} workerId={user.id} />
}
