export type QualificationStatus = 'pending' | 'approved' | 'rejected'
export type ApplicationStatus = 'applied' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
export type UserRole = 'worker' | 'employer' | 'admin'
export type JobStatus = 'open' | 'closed' | 'done'

export interface Qualification {
  id: string
  name: string
  category: string
  icon: string
  description: string
}

export interface UserQualification {
  id: string
  qualificationId: string
  qualification: Qualification
  certificateUrl: string
  issuedAt: string
  expiresAt?: string
  status: QualificationStatus
  rejectionReason?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  qualifications: UserQualification[]
}

export interface Job {
  id: string
  employerId: string
  employerName: string
  employerLogo?: string
  title: string
  description: string
  location: string
  prefecture: string
  hourlyRate: number
  workDate: string
  startTime: string
  endTime: string
  slots: number
  remainingSlots: number
  status: JobStatus
  requiredQualifications: Qualification[]
  tags: string[]
  createdAt: string
}

export interface Application {
  id: string
  jobId: string
  job: Job
  workerId: string
  status: ApplicationStatus
  message?: string
  appliedAt: string
}
