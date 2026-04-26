import apiClient from './client'

export interface IscedLevel {
  id: number
  level: number
  name: string
}

export interface EducationLevel {
  id: number
  name: string
  description: string | null
  isced_level_id: number
  isced_level: IscedLevel
  created_at: string
  updated_at: string
}

export async function listIscedLevels() {
  return apiClient.get<IscedLevel[]>('/isced-levels/')
}

export async function listEducationLevels() {
  return apiClient.get<EducationLevel[]>('/education-levels/')
}

export async function createEducationLevel(data: {
  name: string
  description?: string | null
  isced_level_id: number
}) {
  return apiClient.post<EducationLevel>('/education-levels/', data)
}

export async function updateEducationLevel(id: number, data: {
  name?: string
  description?: string | null
  isced_level_id?: number
}) {
  return apiClient.request<EducationLevel>(`/education-levels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteEducationLevel(id: number) {
  return apiClient.request<void>(`/education-levels/${id}`, { method: 'DELETE' })
}
