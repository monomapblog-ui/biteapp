'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast/ToastProvider'

interface Props {
  jobId: string
  initialBookmarked: boolean
  size?: 'sm' | 'md'
  onToggle?: (bookmarked: boolean) => void
}

export function BookmarkButton({ jobId, initialBookmarked, size = 'md', onToggle }: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const toast = useToast()

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)

    if (bookmarked) {
      await supabase.from('job_bookmarks').delete().eq('job_id', jobId)
      setBookmarked(false)
      onToggle?.(false)
      toast.info('ブックマークを解除しました')
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('ログインが必要です'); setLoading(false); return }
      await supabase.from('job_bookmarks').insert({ user_id: user.id, job_id: jobId } as never)
      setBookmarked(true)
      onToggle?.(true)
      toast.success('ブックマークしました')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center justify-center rounded-full transition-colors ${
        size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
      } ${bookmarked ? 'bg-yellow-50 text-yellow-500' : 'bg-gray-50 text-gray-400 hover:text-yellow-500'}`}
      aria-label={bookmarked ? 'ブックマーク解除' : 'ブックマーク'}
    >
      <span className={size === 'sm' ? 'text-base' : 'text-xl'}>{bookmarked ? '★' : '☆'}</span>
    </button>
  )
}
