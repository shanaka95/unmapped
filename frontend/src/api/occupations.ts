import apiClient from './client'

export interface OccupationGroup {
  id: number
  code: number
  name: string
  skill_level: string
}

export interface Occupation {
  id: number
  level: number
  code: string
  title: string
  definition: string | null
  group_id: number
  group: OccupationGroup
  created_at: string
  updated_at: string
}

export async function listOccupations(params?: { group_id?: number; level?: number }) {
  const query = new URLSearchParams()
  if (params?.group_id) query.set('group_id', String(params.group_id))
  if (params?.level) query.set('level', String(params.level))
  const qs = query.toString()
  return apiClient.get<Occupation[]>(`/occupations/${qs ? `?${qs}` : ''}`)
}

export async function listOccupationGroups() {
  return apiClient.get<OccupationGroup[]>('/occupation-groups/')
}

export async function createOccupation(data: {
  level: number
  title: string
  definition?: string | null
  group_id: number
}) {
  return apiClient.post<Occupation>('/occupations/', data)
}

export async function updateOccupation(id: number, data: {
  level?: number
  title?: string
  definition?: string | null
  group_id?: number
}) {
  return apiClient.request<Occupation>(`/occupations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteOccupation(id: number) {
  return apiClient.request<void>(`/occupations/${id}`, { method: 'DELETE' })
}
