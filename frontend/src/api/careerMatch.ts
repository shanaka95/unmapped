import apiClient from './client'

export interface CareerRecommendation {
  rank: number
  isco_code: string
  title: string
  definition: string | null
  level: number
  confidence: 'high' | 'medium' | 'low'
  seniority_fit: 'entry-level' | 'mid-level' | 'senior' | 'specialist'
  reason: string
}

export interface CareerMatchResponse {
  recommendations: CareerRecommendation[]
  total_matches_found: number
  message?: string
  user_profile_summary: string
}

export function findCareerMatches() {
  return apiClient.request<CareerMatchResponse>('/profile/career-match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}
