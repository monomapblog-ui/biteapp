'use client'

import { Job, UserQualification } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface JobCardProps {
  job: Job
  userQualifications?: UserQualification[]
}

function isEligible(job: Job, userQuals: UserQualification[]): boolean {
  const approvedIds = userQuals.filter(q => q.status === 'approved').map(q => q.qualificationId)
  return job.requiredQualifications.every(rq => approvedIds.includes(rq.id))
}

export function JobCard({ job, userQualifications = [] }: JobCardProps) {
  const eligible = isEligible(job, userQualifications)

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="hover:border-blue-200 transition-colors">
        <CardBody className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">{job.employerName}</p>
              <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{job.title}</h3>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-blue-600">{formatCurrency(job.hourlyRate)}</p>
              <p className="text-xs text-gray-500">/時間</p>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 mb-3">
            <span>📅 {formatDate(job.workDate)}</span>
            <span>🕐 {job.startTime}〜{job.endTime}</span>
            <span>📍 {job.location}</span>
          </div>

          {/* Required qualifications */}
          <div className="flex flex-wrap gap-1 mb-3">
            {job.requiredQualifications.map(q => (
              <Badge key={q.id} variant="outline" className="text-xs">
                {q.icon} {q.name}
              </Badge>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 flex-wrap">
              {job.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="default" className="text-xs">{tag}</Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">残{job.remainingSlots}枠</span>
              {eligible ? (
                <Badge variant="success">✓ 応募可能</Badge>
              ) : (
                <Badge variant="warning">資格要確認</Badge>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}
