import { QualificationStatus } from '@/types'
import { Badge } from '@/components/ui/Badge'

const CONFIG = {
  approved: { variant: 'success' as const, label: '✓ 承認済み' },
  pending: { variant: 'warning' as const, label: '⏳ 審査中' },
  rejected: { variant: 'danger' as const, label: '✗ 却下' },
}

export function QualificationStatusBadge({ status }: { status: QualificationStatus }) {
  const { variant, label } = CONFIG[status]
  return <Badge variant={variant}>{label}</Badge>
}
