export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          phone: string | null
          role: 'worker' | 'employer' | 'admin'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          phone?: string | null
          role?: 'worker' | 'employer' | 'admin'
          avatar_url?: string | null
        }
        Update: {
          name?: string
          phone?: string | null
          role?: 'worker' | 'employer' | 'admin'
          avatar_url?: string | null
        }
      }
      qualifications: {
        Row: {
          id: string
          name: string
          category: string
          icon: string
          description: string | null
          requires_renewal: boolean
          created_at: string
        }
        Insert: never
        Update: never
      }
      user_qualifications: {
        Row: {
          id: string
          user_id: string
          qualification_id: string
          certificate_url: string
          issued_at: string
          expires_at: string | null
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          qualification_id: string
          certificate_url: string
          issued_at: string
          expires_at?: string | null
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
        }
      }
      jobs: {
        Row: {
          id: string
          employer_id: string
          title: string
          description: string
          location: string
          prefecture: string
          hourly_rate: number
          work_date: string
          start_time: string
          end_time: string
          slots: number
          status: 'draft' | 'open' | 'closed' | 'done'
          created_at: string
          updated_at: string
        }
        Insert: {
          employer_id: string
          title: string
          description: string
          location: string
          prefecture: string
          hourly_rate: number
          work_date: string
          start_time: string
          end_time: string
          slots?: number
          status?: 'draft' | 'open' | 'closed' | 'done'
        }
        Update: {
          title?: string
          description?: string
          status?: 'draft' | 'open' | 'closed' | 'done'
        }
      }
      job_required_qualifications: {
        Row: {
          id: string
          job_id: string
          qualification_id: string
          is_mandatory: boolean
        }
        Insert: {
          job_id: string
          qualification_id: string
          is_mandatory?: boolean
        }
        Update: never
      }
      job_tags: {
        Row: {
          id: string
          job_id: string
          tag: string
        }
        Insert: {
          job_id: string
          tag: string
        }
        Update: never
      }
      applications: {
        Row: {
          id: string
          job_id: string
          worker_id: string
          status: 'applied' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
          message: string | null
          applied_at: string
          updated_at: string
        }
        Insert: {
          job_id: string
          worker_id: string
          message?: string | null
        }
        Update: {
          status?: 'applied' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
        }
      }
    }
    Views: {
      jobs_with_remaining: {
        Row: {
          id: string
          employer_id: string
          title: string
          description: string
          location: string
          prefecture: string
          hourly_rate: number
          work_date: string
          start_time: string
          end_time: string
          slots: number
          status: 'draft' | 'open' | 'closed' | 'done'
          created_at: string
          updated_at: string
          remaining_slots: number
        }
      }
      worker_eligible_jobs: {
        Row: {
          job_id: string
          worker_id: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']
