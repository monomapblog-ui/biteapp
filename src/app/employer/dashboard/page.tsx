import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { EmployerDashboardClient } from '@/components/employer/EmployerDashboardClient'

export default async function EmployerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileRaw } = await supabase.from('profiles').select('role, name').eq('id', user.id).single()
  const profile = profileRaw as { role: string; name: string } | null
  if (profile?.role !== 'employer' && profile?.role !== 'admin') redirect('/')

  const { data: jobsRaw } = await supabase
    .from('jobs')
    .select('id, title, work_date, start_time, end_time, hourly_rate, slots, status, prefecture, location')
    .eq('employer_id', user.id)
    .order('work_date', { ascending: false })

  const jobs = (jobsRaw ?? []) as Array<{
    id: string; title: string; work_date: string; start_time: string
    end_time: string; hourly_rate: number; slots: number; status: string
    prefecture: string; location: string
  }>

  const jobIds = jobs.map(j => j.id)

  const { data: appsRaw } = jobIds.length > 0
    ? await supabase
        .from('applications')
        .select('id, job_id, status')
        .in('job_id', jobIds)
    : { data: [] }

  const apps = (appsRaw ?? []) as Array<{ id: string; job_id: string; status: string }>

  const countMap: Record<string, { total: number; accepted: number; pending: number }> = {}
  for (const app of apps) {
    if (!countMap[app.job_id]) countMap[app.job_id] = { total: 0, accepted: 0, pending: 0 }
    countMap[app.job_id].total++
    if (app.status === 'accepted') countMap[app.job_id].accepted++
    if (app.status === 'pending') countMap[app.job_id].pending++
  }

  const jobsWithCounts = jobs.map(j => ({
    ...j,
    counts: countMap[j.id] ?? { total: 0, accepted: 0, pending: 0 },
  }))

  return <EmployerDashboardClient jobs={jobsWithCounts} employerName={profile?.name ?? ''} />
}
