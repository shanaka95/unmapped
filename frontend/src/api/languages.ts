import apiClient from './client'

export interface CountryBrief {
  id: number
  code: string
  name: string
}

export interface LanguageBrief {
  id: number
  code: string
  name: string
}

export interface Country {
  id: number
  code: string
  name: string
  area: string | null
  created_at: string
  updated_at: string
}

export interface CountryWithLanguages extends Country {
  languages: LanguageBrief[]
}

export interface Language {
  id: number
  code: string
  name: string
  created_at: string
  updated_at: string
}

export interface LanguageWithCountries extends Language {
  countries: CountryBrief[]
}

export async function listCountries() {
  return apiClient.get<Country[]>('/countries/')
}

export async function getCountry(id: number) {
  return apiClient.get<CountryWithLanguages>(`/countries/${id}`)
}

export async function getCountryLanguages(id: number) {
  return apiClient.get<LanguageBrief[]>(`/countries/${id}/languages`)
}

export async function addLanguageToCountry(countryId: number, languageId: number) {
  return apiClient.post<LanguageBrief>(`/countries/${countryId}/languages?language_id=${languageId}`, {})
}

export async function removeLanguageFromCountry(countryId: number, languageId: number) {
  return apiClient.request<void>(`/countries/${countryId}/languages/${languageId}`, { method: 'DELETE' })
}

export async function listLanguages(search?: string) {
  const endpoint = search ? `/languages/?search=${encodeURIComponent(search)}` : '/languages/'
  return apiClient.get<Language[]>(endpoint)
}

export async function getLanguage(id: number) {
  return apiClient.get<LanguageWithCountries>(`/languages/${id}`)
}
