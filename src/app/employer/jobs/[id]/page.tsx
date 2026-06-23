import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EmployerJobDetailClient } from '@/components/employer/EmployerJobDetailClient'

export default async function EmployerJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileRaw } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = profileRaw as { role: string } | null
  if (profile?.role !== 'employer' && profile?.role !== 'admin') redirect('/')

  const { data: jobRaw } = await supabase
    .from('jobs')
    .select('id, title, work_date, start_time, end_time, hourly_rate, slots, status, prefecture, location, description, employer_id')
    .eq('id', id)
    .single()

  const job = jobRaw as {
    id: string; title: string; work_date: string; start_time: string; end_time: string
    hourly_rate: number; slots: number; status: string; prefecture: string; location: string
    description: string; employer_id: string
  } | null

  if (!job) notFound()
  if (job.employer_id !== user.id && profile?.role !== 'admin') redirect('/employer/dashboard')

  const { data: appsRaw } = await supabase
    .from('applications')
    .select('id, worker_id, status, message, created_at')
    .eq('job_id', id)
    .order('created_at', { ascending: true })

  const apps = (appsRaw ?? []) as Array<{
    id: string; worker_id: string; status: string; message: string | null; created_at: string
  }>

  const workerIds = [...new Set(apps.map(a => a.worker_id))]
  const { data: workersRaw } = workerIds.length > 0
    ? await supabase.from('profiles').select('id, name, phone').in('id', workerIds)
    : { data: [] }

  const workerMap = Object.fromEntries(
    ((workersRaw ?? []) as Array<{ id: string; name: string; phone: string | null }>).map(w => [w.id, w])
  )

  const appsWithWorkers = apps.map(a => ({
    ...a,
    workerName: workerMap[a.worker_id]?.name ?? '不明',
    workerPhone: workerMap[a.worker_id]?.phone ?? null,
  }))

  return <EmployerJobDetailClient job={job} applications={appsWithWorkers} />
}
