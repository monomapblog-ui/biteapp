import { createClient } from '@/lib/supabase/server'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

export async function NavWrapper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: string | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    role = (data as { role: string } | null)?.role ?? null
  }

  return (
    <>
      <Header role={role} />
      <BottomNav role={role} />
    </>
  )
}
