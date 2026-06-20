'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 text-sm w-full">
      <span>🚪</span>
      <span>ログアウト</span>
    </button>
  )
}
