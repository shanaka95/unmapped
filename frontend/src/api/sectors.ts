import apiClient from './client'

export interface IloSector {
  id: number
  name: string
}

export interface Sector {
  id: number
  title: string
  description: string | null
  ilo_sector_id: number
  ilo_sector: IloSector
  created_at: string
  updated_at: string
}

export interface SectorCreateRequest {
  title: string
  description?: string | null
  ilo_sector_id: number
}

export async function listSectors() {
  return apiClient.get<Sector[]>('/sectors/')
}

export async function createSector(data: SectorCreateRequest) {
  return apiClient.post<Sector>('/sectors/', data)
}

export async function deleteSector(id: number) {
  return apiClient.request<void>(`/sectors/${id}`, { method: 'DELETE' })
}

export async function listIloSectors() {
  return apiClient.get<IloSector[]>('/ilo-sectors/')
}
