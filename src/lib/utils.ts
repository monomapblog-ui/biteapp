import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`
}

export function calcWorkHours(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number)
  const endClean = end.replace('翌', '')
  const [eh, em] = endClean.split(':').map(Number)
  let hours = eh - sh + (em - sm) / 60
  if (hours < 0) hours += 24
  return `${hours}h`
}
