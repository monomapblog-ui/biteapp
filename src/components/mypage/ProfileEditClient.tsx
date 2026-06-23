'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast/ToastProvider'
import { Button } from '@/components/ui/Button'

interface Props {
  userId: string
  initialName: string
  initialPhone: string
  initialAvatarUrl: string | null
}

export function ProfileEditClient({ userId, initialName, initialPhone, initialAvatarUrl }: Props) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const toast = useToast()
  const router = useRouter()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) {
      toast.error('アップロードに失敗しました')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = data.publicUrl + '?t=' + Date.now()
    setAvatarUrl(url)

    await supabase.from('profiles').update({ avatar_url: data.publicUrl } as never).eq('id', userId)
    toast.success('アイコンを更新しました')
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('名前を入力してください')
      return
    }
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim(), phone: phone.trim() || null } as never)
      .eq('id', userId)

    if (error) {
      toast.error('保存に失敗しました')
    } else {
      toast.success('プロフィールを更新しました')
      router.push('/mypage')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5 pb-8">
      <Link href="/mypage" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← マイページ
      </Link>
      <h1 className="text-xl font-bold text-gray-900">プロフィール編集</h1>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">プロフィール写真</h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-gray-400">👤</span>
            )}
          </div>
          <div>
            <Button
              type="button" variant="secondary" size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'アップロード中...' : '写真を変更'}
            </Button>
            <p className="text-xs text-gray-400 mt-1">JPG・PNG（5MB以内）</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">基本情報</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名前 <span className="text-red-500">*</span>
          </label>
          <input
            required value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="山田 太郎"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
          <input
            type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="090-0000-0000"
          />
          <p className="text-xs text-gray-400 mt-1">採用時に企業に共有されます</p>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? '保存中...' : '保存する'}
        </Button>
      </form>
    </div>
  )
}
