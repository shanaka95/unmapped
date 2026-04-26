import apiClient from './client'

export interface EmploymentOutlook {
  current_rate: number | null
  trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data'
  trend_years: string[]
  citation: string
}

export interface RegionalComparison {
  area_type: string
  employment_rate: number | null
  recommendation: string
  citation: string
}

export interface MigrationRecommendation {
  should_relocate: boolean
  target_areas: string[]
  reasoning: string
  citations: string[]
}

export interface GenderGap {
  male_rate: number | null
  female_rate: number | null
  gap_analysis: string
  citation: string
}

export interface Underemployment {
  rate: number | null
  citation: string
}

export interface WorkingTime {
  avg_hours: number | null
  citation: string
}

export interface LaborMarketSignals {
  employment_outlook: EmploymentOutlook
  regional_comparison: RegionalComparison[]
  migration_recommendation: MigrationRecommendation
  gender_gap: GenderGap
  underemployment: Underemployment
  working_time: WorkingTime
}

export interface LaborMarketSignalsResponse {
  occupation: {
    isco_code: string
    title: string
    isco_group: string
    country: string
    sex_label: string
  }
  signals: LaborMarketSignals
}

export function getLaborMarketSignals(iscoCode: string) {
  return apiClient.get<LaborMarketSignalsResponse>(
    `/labor-market/signals?isco_code=${encodeURIComponent(iscoCode)}`
  )
}

// Automation risk types
export interface AutomationRiskItem {
  isco_code: string
  title: string
  risk_score: number | null
  sd: number | null
  gradient: string | null
  risk_label: 'high' | 'medium' | 'low' | 'unknown'
  analysis: string
}

export interface AutomationRiskResponse {
  selected: AutomationRiskItem
  all_occupations: AutomationRiskItem[]
  summary: string
}

export interface AutomationRiskRequest {
  selected_code: string
  selected_title: string
  recommendations: Array<{ isco_code: string; title: string }>
}

export function getAutomationRisk(data: AutomationRiskRequest) {
  return apiClient.request<AutomationRiskResponse>('/labor-market/automation-risk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}
