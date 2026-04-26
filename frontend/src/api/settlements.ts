import apiClient from './client'

export interface GridCell {
  id?: number
  lat: number
  lng: number
  settlement_type: string
  count?: number
}

export interface SettlementStats {
  total: number
  by_type: Record<string, number>
}

export interface ClassifyResponse {
  settlement_type: string
  detailed_type: string | null
}

export function getViewport(params: {
  sw_lat: number
  sw_lng: number
  ne_lat: number
  ne_lng: number
  zoom: number
}) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
  return apiClient.get<GridCell[]>(`/settlements/viewport?${qs}`)
}

export function updateSettlement(id: number, settlement_type: string) {
  return apiClient.request<{ id: number; latitude: number; longitude: number; settlement_type: string }>(
    `/settlements/${id}`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settlement_type }) }
  )
}

export function classifyLocation(latitude: number, longitude: number) {
  return apiClient.post<ClassifyResponse>('/settlements/classify', { latitude, longitude })
}

export function getSettlementStats() {
  return apiClient.get<SettlementStats>('/settlements/stats')
}
