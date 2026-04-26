import apiClient from './client'

export interface Profile {
  id: number
  user_id: number
  date_of_birth: string | null
  country: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  settlement_type: string | null
  education_level_id: number | null
  education_level_name: string | null
  language_ids: number[]
  informal_work: string | null
  self_taught_skills: string | null
  monthly_gross_income: number | null
  gender: string | null
  current_step: number
  is_complete: boolean
  completion_pct: number
}

export interface Country {
  id: number
  code: string
  name: string
}

export interface Language {
  id: number
  code: string
  name: string
}

export function getProfile() {
  return apiClient.get<Profile>('/profile/')
}

export function updateProfile(data: Partial<{
  date_of_birth: string | null
  country: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  settlement_type: string | null
  education_level_id: number | null
  language_ids: number[]
  informal_work: string | null
  self_taught_skills: string | null
  monthly_gross_income: number | null
  gender: string | null
  current_step: number
  is_complete: boolean
}>) {
  return apiClient.request<Profile>('/profile/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function listCountries() {
  return apiClient.get<Country[]>('/profile/countries')
}

export function listLanguages() {
  return apiClient.get<Language[]>('/profile/languages')
}
