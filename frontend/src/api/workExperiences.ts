import apiClient from './client'

export interface WorkExperience {
  id: number
  profile_id: number
  job_title: string | null
  company: string | null
  industry: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
}

export function listWorkExperiences() {
  return apiClient.get<WorkExperience[]>('/profile/work-experiences')
}

export function createWorkExperience(data: {
  job_title: string | null
  company: string | null
  industry: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
}) {
  return apiClient.request<WorkExperience>('/profile/work-experiences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateWorkExperience(id: number, data: {
  job_title: string | null
  company: string | null
  industry: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
}) {
  return apiClient.request<WorkExperience>(`/profile/work-experiences/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteWorkExperience(id: number) {
  return apiClient.request<void>(`/profile/work-experiences/${id}`, {
    method: 'DELETE',
  })
}
