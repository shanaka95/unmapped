import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getLaborMarketSignals, type LaborMarketSignalsResponse } from '../api/laborMarket'

interface LaborMarketSignalsProps {
  iscoCode: string
  onClose: () => void
}

export default function LaborMarketSignals({
  iscoCode,
  onClose,
}: LaborMarketSignalsProps) {
  const { t } = useTranslation()
  const [data, setData] = useState<LaborMarketSignalsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null)

  useEffect(() => {
    getLaborMarketSignals(iscoCode)
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
  }, [iscoCode, t])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return '↑'
      case 'decreasing':
        return '↓'
      case 'stable':
        return '→'
      default:
        return '?'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600'
      case 'decreasing':
        return 'text-error'
      case 'stable':
        return 'text-on-surface-variant'
      default:
        return 'text-on-surface-variant'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-surface-container-lowest w-full max-w-2xl mx-4 rounded-xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-surface-container rounded w-1/3" />
            <div className="h-4 bg-surface-container rounded w-2/3" />
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
          <p className="text-error font-poppins text-body-md">{error || t('api.unexpectedError')}</p>
          <button
            onClick={onClose}
            className="mt-4 bg-primary text-on-primary px-6 py-3 rounded font-poppins text-label-sm uppercase tracking-wider hover:opacity-80 transition-opacity duration-300"
          >
            {t('common.backToList')}
          </button>
        </div>
      </div>
    )
  }

  const { signals, occupation } = data

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-poppins text-h2 text-on-surface">{t('laborMarket.title')}</h2>
              <p className="font-poppins text-body-md text-on-surface-variant mt-1">
                {occupation.title} ({occupation.isco_code})
              </p>
              <p className="font-poppins text-label-sm text-on-surface-variant mt-1 uppercase tracking-wider">
                {occupation.isco_group} · {occupation.country}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-primary transition-colors duration-300 text-2xl leading-none"
              aria-label={t('common.cancel')}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Employment Outlook */}
          <section className="bg-surface-container p-6 rounded-xl">
            <h3 className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
              {t('laborMarket.employmentOutlook')}
            </h3>
            <div className="flex items-baseline gap-3">
              <span className="font-poppins text-h1 text-on-surface">
                {signals.employment_outlook.current_rate !== null
                  ? `${signals.employment_outlook.current_rate.toFixed(1)}%`
                  : '—'}
              </span>
              <span
                className={`font-poppins text-h2 ${getTrendColor(signals.employment_outlook.trend)}`}
              >
                {getTrendIcon(signals.employment_outlook.trend)}
              </span>
            </div>
            {signals.employment_outlook.trend_years.length > 0 && (
              <p className="font-poppins text-label-sm text-on-surface-variant mt-1">
                {signals.employment_outlook.trend_years.join(', ')}
              </p>
            )}
            {signals.employment_outlook.citation && (
              <CitationBlock
                citation={signals.employment_outlook.citation}
                isExpanded={expandedCitation === 'employment'}
                onToggle={() =>
                  setExpandedCitation(
                    expandedCitation === 'employment' ? null : 'employment'
                  )
                }
              />
            )}
          </section>

          {/* Gender Gap */}
          <section className="bg-surface-container p-6 rounded-xl">
            <h3 className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
              {t('laborMarket.genderGap')}
            </h3>
            <div className="flex gap-8">
              <div>
                <p className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {t('gender.male')}
                </p>
                <p className="font-poppins text-h2 text-on-surface mt-1">
                  {signals.gender_gap.male_rate !== null
                    ? `${signals.gender_gap.male_rate.toFixed(1)}%`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {t('gender.female')}
                </p>
                <p className="font-poppins text-h2 text-on-surface mt-1">
                  {signals.gender_gap.female_rate !== null
                    ? `${signals.gender_gap.female_rate.toFixed(1)}%`
                    : '—'}
                </p>
              </div>
            </div>
            <p className="font-poppins text-body-md text-on-surface mt-3">
              {signals.gender_gap.gap_analysis}
            </p>
            {signals.gender_gap.citation && (
              <CitationBlock
                citation={signals.gender_gap.citation}
                isExpanded={expandedCitation === 'gender'}
                onToggle={() =>
                  setExpandedCitation(expandedCitation === 'gender' ? null : 'gender')
                }
              />
            )}
          </section>

          {/* Regional Comparison */}
          {signals.regional_comparison.length > 0 && (
            <section className="bg-surface-container p-6 rounded-xl">
              <h3 className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
                {t('laborMarket.regionalComparison')}
              </h3>
              <div className="space-y-3">
                {signals.regional_comparison.map((region, index) => (
                  <div key={index} className="border-b border-outline-variant last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-baseline">
                      <span className="font-poppins text-body-md text-on-surface">
                        {region.area_type}
                      </span>
                      <span className="font-poppins text-body-md text-on-surface">
                        {region.employment_rate !== null
                          ? `${region.employment_rate.toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                    <p className="font-poppins text-label-sm text-on-surface-variant mt-1">
                      {region.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Migration Recommendation */}
          {signals.migration_recommendation.should_relocate && (
            <section className="bg-surface-container p-6 rounded-xl border-l-4 border-primary">
              <h3 className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
                {t('laborMarket.migrationRecommendation')}
              </h3>
              <p className="font-poppins text-body-md text-on-surface">
                {signals.migration_recommendation.reasoning}
              </p>
              {signals.migration_recommendation.target_areas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {signals.migration_recommendation.target_areas.map((area, index) => (
                    <span
                      key={index}
                      className="inline-block bg-primary text-on-primary px-3 py-1 rounded-full font-poppins text-label-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Underemployment */}
          {signals.underemployment.rate !== null && (
            <section className="bg-surface-container p-6 rounded-xl">
              <h3 className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
                {t('laborMarket.underemployment')}
              </h3>
              <span className="font-poppins text-h2 text-on-surface">
                {signals.underemployment.rate.toFixed(1)}%
              </span>
              {signals.underemployment.citation && (
                <CitationBlock
                  citation={signals.underemployment.citation}
                  isExpanded={expandedCitation === 'underemployment'}
                  onToggle={() =>
                    setExpandedCitation(
                      expandedCitation === 'underemployment' ? null : 'underemployment'
                    )
                  }
                />
              )}
            </section>
          )}

          {/* Working Time */}
          {signals.working_time.avg_hours !== null && (
            <section className="bg-surface-container p-6 rounded-xl">
              <h3 className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
                {t('laborMarket.workingTime')}
              </h3>
              <span className="font-poppins text-h2 text-on-surface">
                {signals.working_time.avg_hours.toFixed(1)} {t('laborMarket.hoursPerWeek')}
              </span>
              {signals.working_time.citation && (
                <CitationBlock
                  citation={signals.working_time.citation}
                  isExpanded={expandedCitation === 'working_time'}
                  onToggle={() =>
                    setExpandedCitation(
                      expandedCitation === 'working_time' ? null : 'working_time'
                    )
                  }
                />
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

interface CitationBlockProps {
  citation: string
  isExpanded: boolean
  onToggle: () => void
}

function CitationBlock({ citation, isExpanded, onToggle }: CitationBlockProps) {
  const { t } = useTranslation()

  return (
    <div className="mt-3">
      <button
        onClick={onToggle}
        className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase tracking-wider"
      >
        {isExpanded ? t('laborMarket.hideCitation') : t('laborMarket.viewCitation')}
      </button>
      {isExpanded && (
        <p className="font-poppins text-label-sm text-on-surface-variant mt-2 bg-surface-container-low p-2 rounded">
          {citation}
        </p>
      )}
    </div>
  )
}
