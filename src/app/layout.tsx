import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

export const metadata: Metadata = {
  title: 'プロイ | 有資格者スポットバイト',
  description: '資格を活かしてスキマ時間に稼ぐ。ドライバー・フォークリフト専門のスポットワーク。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Header />
        <main className="max-w-screen-md mx-auto px-4 pt-4">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
