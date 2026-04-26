import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAutomationRisk, type AutomationRiskResponse } from '../api/laborMarket'

interface AutomationRiskModalProps {
  selectedCode: string
  selectedTitle: string
  recommendations: Array<{ isco_code: string; title: string }>
  onClose: () => void
}

export default function AutomationRiskModal({
  selectedCode,
  selectedTitle,
  recommendations,
  onClose,
}: AutomationRiskModalProps) {
  const { t } = useTranslation()
  const [data, setData] = useState<AutomationRiskResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOcc, setExpandedOcc] = useState<string | null>(null)

  useEffect(() => {
    getAutomationRisk({
      selected_code: selectedCode,
      selected_title: selectedTitle,
      recommendations,
    })
      .then((response) => {
        if (response.error) {
          setError(response.error)
        } else {
          setData(response.data)
        }
      })
      .catch(() => {
        setError(t('api.unexpectedError'))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [selectedCode, selectedTitle, recommendations, t])

  const getRiskColor = (label: string) => {
    switch (label) {
      case 'high':
        return 'text-error'
      case 'medium':
        return 'text-amber-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-on-surface-variant'
    }
  }

  const getRiskBg = (label: string) => {
    switch (label) {
      case 'high':
        return 'bg-error/10 border-error'
      case 'medium':
        return 'bg-amber-50 border-amber-400'
      case 'low':
        return 'bg-green-50 border-green-500'
      default:
        return 'bg-surface-container border-outline-variant'
    }
  }

  const getRiskBarWidth = (score: number | null) => {
    if (score === null) return '0%'
    return `${Math.round(score * 100)}%`
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-surface-container-lowest w-full max-w-2xl mx-4 rounded-xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-surface-container rounded w-1/3" />
            <div className="h-4 bg-surface-container rounded w-2/3" />
            <div className="h-32 bg-surface-container rounded" />
            <div className="h-24 bg-surface-container rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-surface-container-lowest w-full max-w-2xl mx-4 rounded-xl p-8">
          <p className="font-poppins text-body-md text-error">{error || t('api.unexpectedError')}</p>
          <button
            onClick={onClose}
            className="mt-4 bg-primary text-on-primary px-6 py-3 rounded font-poppins text-label-sm uppercase tracking-wider hover:opacity-80 transition-opacity duration-300"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-poppins text-h2 text-on-surface">
                {t('automationRisk.title')}
              </h2>
              <p className="font-poppins text-body-md text-on-surface-variant mt-1">
                {t('automationRisk.subtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-primary transition-colors duration-300 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary */}
          {data.summary && (
            <div className="bg-surface-container p-4 rounded-xl border-l-4 border-primary">
              <p className="font-poppins text-body-md text-on-surface leading-relaxed">
                {data.summary}
              </p>
            </div>
          )}

          {/* Selected occupation — prominent */}
          <div className="border-2 border-primary rounded-xl overflow-hidden">
            <div className="bg-primary p-4">
              <span className="font-poppins text-label-sm text-on-primary uppercase tracking-wider">
                {t('automationRisk.yourSelection')}
              </span>
            </div>
            <div className="p-6 bg-primary/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-poppins text-h2 text-on-surface">
                    {data.selected.title}
                  </h3>
                  <p className="font-poppins text-label-sm text-on-surface-variant mt-1">
                    ISCO {data.selected.isco_code}
                  </p>
                </div>
                <div className={`font-poppins text-h1 font-medium ${getRiskColor(data.selected.risk_label)}`}>
                  {data.selected.risk_score !== null ? `${(data.selected.risk_score * 100).toFixed(0)}%` : '—'}
                </div>
              </div>

              {/* Risk bar */}
              <div className="mt-4">
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${data.selected.risk_label === 'high' ? 'bg-error' : data.selected.risk_label === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: getRiskBarWidth(data.selected.risk_score) }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-poppins text-label-sm text-on-surface-variant">0%</span>
                  <span className={`font-poppins text-label-sm uppercase ${getRiskColor(data.selected.risk_label)}`}>
                    {data.selected.risk_label} risk
                  </span>
                  <span className="font-poppins text-label-sm text-on-surface-variant">100%</span>
                </div>
              </div>

              {data.selected.sd !== null && (
                <p className="font-poppins text-label-sm text-on-surface-variant mt-2">
                  SD: {data.selected.sd} · Gradient: {data.selected.gradient || 'N/A'}
                </p>
              )}

              {data.selected.analysis && (
                <p className="font-poppins text-body-md text-on-surface mt-4 leading-relaxed">
                  {data.selected.analysis}
                </p>
              )}
            </div>
          </div>

          {/* Other occupations */}
          {data.all_occupations.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                {t('automationRisk.otherOptions')}
              </h3>
              {data.all_occupations.map((occ) => {
                const isExpanded = expandedOcc === occ.isco_code
                return (
                  <div
                    key={occ.isco_code}
                    className={`border rounded-xl overflow-hidden ${getRiskBg(occ.risk_label)}`}
                  >
                    <button
                      onClick={() => setExpandedOcc(isExpanded ? null : occ.isco_code)}
                      className="w-full text-left p-4 cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span
                          className={`font-poppins text-h2 font-medium ${getRiskColor(occ.risk_label)}`}
                        >
                          {occ.risk_score !== null ? `${(occ.risk_score * 100).toFixed(0)}%` : '—'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-poppins text-body-md text-on-surface truncate">
                            {occ.title}
                          </p>
                          <p className="font-poppins text-label-sm text-on-surface-variant">
                            ISCO {occ.isco_code}
                            {occ.sd !== null && ` · SD: ${occ.sd}`}
                            {occ.gradient && ` · ${occ.gradient}`}
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px] flex-shrink-0">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>

                    {isExpanded && occ.analysis && (
                      <div className="border-t border-outline-variant p-4 bg-surface-container-lowest">
                        <p className="font-poppins text-body-md text-on-surface leading-relaxed">
                          {occ.analysis}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Risk scale legend */}
          <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant">
            <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
              Risk Scale
            </span>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-error" />
                <span className="font-poppins text-label-sm text-on-surface-variant">
                  &gt;50% High
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500" />
                <span className="font-poppins text-label-sm text-on-surface-variant">
                  30–50% Medium
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="font-poppins text-label-sm text-on-surface-variant">
                  &lt;30% Low
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}