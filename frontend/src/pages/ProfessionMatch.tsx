import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import lottie from 'lottie-web'
import { useAuth } from '../context/AuthContext'
import { findCareerMatches, type CareerRecommendation } from '../api/careerMatch'
import Footer from '../components/Footer'

type View = 'loading' | 'profile' | 'matches' | 'confirmation'

export default function ProfessionMatch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const animRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>('loading')
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([])
  const [editableSummary, setEditableSummary] = useState('')
  const [error, setError] = useState('')
  const [expandedRank, setExpandedRank] = useState<number | null>(null)
  const [selectedCareer, setSelectedCareer] = useState<CareerRecommendation | null>(null)

  useEffect(() => {
    if (animRef.current) {
      const anim = lottie.loadAnimation({
        container: animRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/brain-thinking.json',
      })
      return () => anim.destroy()
    }
  }, [])

  useEffect(() => {
    async function loadMatches() {
      const res = await findCareerMatches()
      if (res.data) {
        setRecommendations(res.data.recommendations || [])
        const summary = res.data.user_profile_summary || ''
        // profile summary stored in editableSummary
        setEditableSummary(summary)
        setError(res.data.message || '')
      } else {
        setError(res.error || t('api.failedToFindCareerMatches'))
      }
      setView('profile')
    }
    loadMatches()
  }, [])

  // Loading view
  if (view === 'loading') {
    return (
      <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
        <main className="flex-grow flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg flex flex-col items-center gap-8">
            <div className="w-40 h-40">
              <div ref={animRef} className="w-full h-full" />
            </div>
            <div className="text-center">
              <h2 className="font-poppins text-h2 text-on-surface">
                {t('professionMatch.thinkingForYou', { name: user?.name?.split(' ')[0] })}
              </h2>
              <p className="font-poppins text-body-md text-on-surface-variant mt-4 leading-relaxed animate-glow-text">
                {t('professionMatch.thinkingDescription')}
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Error / no matches
  if (error && recommendations.length === 0) {
    return (
      <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
        <main className="flex-grow flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg text-center">
            <span className="material-symbols-outlined text-outline text-[48px] mb-4 block">info</span>
            <h2 className="font-poppins text-h2 text-on-surface mb-3">{t('professionMatch.noMatches')}</h2>
            <p className="font-poppins text-body-md text-on-surface-variant">{error}</p>
            <button
              onClick={() => navigate('/onboarding')}
              className="font-poppins text-label-sm bg-primary text-on-primary px-8 py-4 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer mt-8"
            >
              {t('professionMatch.updateProfile')}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Profile summary view
  if (view === 'profile') {
    return (
      <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
        <main className="flex-grow flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-container-max flex flex-col gap-10">
            <div className="text-center">
              <h1 className="font-poppins text-h1 text-on-surface">
                {t('professionMatch.profileSummaryTitle')}
              </h1>
              <p className="font-poppins text-body-lg text-on-surface-variant mt-3">
                {t('professionMatch.profileSummarySubtitle')}
              </p>
            </div>

            <div className="max-w-2xl mx-auto w-full">
              <div className="border border-outline-variant rounded-xl p-6 bg-surface-container-lowest">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                    {t('professionMatch.profileSummaryLabel')}
                  </span>
                </div>
                <textarea
                  value={editableSummary}
                  onChange={(e) => setEditableSummary(e.target.value)}
                  className="w-full font-poppins text-body-md text-on-surface leading-relaxed bg-transparent border-none outline-none resize-none min-h-[120px]"
                  placeholder={t('professionMatch.profileSummaryPlaceholder')}
                />
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/onboarding')}
                className="font-poppins text-label-sm border border-outline-variant px-8 py-4 rounded-default uppercase tracking-wider hover:border-primary hover:text-primary transition-colors duration-300 cursor-pointer"
              >
                {t('professionMatch.editProfile')}
              </button>
              <button
                onClick={() => setView('matches')}
                className="font-poppins text-label-sm bg-primary text-on-primary px-8 py-4 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer"
              >
                {t('professionMatch.showMyMatches')}
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Confirmation view
  if (view === 'confirmation' && selectedCareer) {
    return (
      <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
        <main className="flex-grow flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg flex flex-col items-center gap-10">
            <div className="text-center">
              <span className="material-symbols-outlined text-primary text-[64px] mb-4 block">check_circle</span>
              <h1 className="font-poppins text-h1 text-on-surface">
                {t('professionMatch.youChoseThisPath')}
              </h1>
            </div>

            <div className="w-full border border-primary rounded-xl p-6 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center">
                  <span className="font-poppins text-label-sm font-bold">#{selectedCareer.rank}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-poppins text-h2 text-on-surface truncate">
                    {selectedCareer.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="font-poppins text-label-sm text-on-surface-variant">
                      ISCO: {selectedCareer.isco_code}
                    </span>
                    <span className="font-poppins text-label-sm px-2 py-0.5 rounded-default bg-surface-container text-on-surface-variant">
                      Level {selectedCareer.level}
                    </span>
                    <span className="font-poppins text-label-sm px-2 py-0.5 rounded-default bg-surface-container-low text-on-surface-variant">
                      {selectedCareer.seniority_fit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button
                onClick={() => { setView('matches'); setSelectedCareer(null); }}
                className="font-poppins text-label-sm border border-outline-variant px-8 py-4 rounded-default uppercase tracking-wider hover:border-primary hover:text-primary transition-colors duration-300 cursor-pointer"
              >
                {t('professionMatch.changeMyChoice')}
              </button>
              <button
                onClick={() => { localStorage.setItem('career_path_shown', 'true'); navigate('/dashboard') }}
                className="font-poppins text-label-sm bg-primary text-on-primary px-8 py-4 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer"
              >
                {t('professionMatch.goToDashboard')}
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Matches view
  const rankStyles: Record<number, { bg: string; border: string; badge: string; headerBg: string; headerText: string; badgeAlt: string }> = {
    1: { bg: 'bg-surface-container-lowest', border: 'border-primary', badge: 'bg-primary text-on-primary', headerBg: 'bg-primary', headerText: 'text-on-primary', badgeAlt: 'bg-on-primary text-primary' },
    2: { bg: 'bg-surface-container-lowest', border: 'border-outline', badge: 'bg-secondary text-on-secondary', headerBg: 'bg-surface-container', headerText: 'text-on-surface', badgeAlt: 'bg-surface-container text-on-surface-variant' },
    3: { bg: 'bg-surface-container-lowest', border: 'border-outline-variant', badge: 'bg-surface-container text-on-surface-variant', headerBg: 'bg-surface-container-low', headerText: 'text-on-surface', badgeAlt: 'bg-surface-container-low text-on-surface-variant' },
  }
  const confidenceColors: Record<string, string> = {
    high: 'text-primary',
    medium: 'text-on-surface-variant',
    low: 'text-error',
  }

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
      <main className="flex-grow px-6 py-12">
        <div className="max-w-container-max mx-auto flex flex-col gap-10">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-poppins text-h1 text-on-surface">
              {t('professionMatch.title')}
            </h1>
            <p className="font-poppins text-body-lg text-on-surface-variant mt-3">
              {t('professionMatch.subtitle')}
            </p>
          </div>

          {/* Career cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start" style={{ minHeight: '490px' }}>
            {recommendations.map((rec) => {
              const s = rankStyles[rec.rank] || rankStyles[3]
              const isExpanded = expandedRank === rec.rank
              const reasonPreview = rec.reason.length > 120 ? rec.reason.slice(0, 120) + '...' : rec.reason

              return (
                <div
                  key={rec.rank}
                  className={`border rounded-xl overflow-hidden transition-all duration-300 flex flex-col min-h-[490px] ${
                    isExpanded ? `${s.border} shadow-lg` : 'border-outline-variant'
                  }`}
                >
                  {/* Card header */}
                  <div className={`p-6 ${s.headerBg} flex flex-col gap-4`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${s.badge}`}>
                        <span className="font-poppins text-label-sm font-bold">#{rec.rank}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`font-poppins text-h2 ${s.headerText} truncate`}>
                          {rec.title}
                        </h3>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className={`font-poppins text-label-sm px-2 py-0.5 rounded-default ${s.badgeAlt}`}>
                        ISCO: {rec.isco_code}
                      </span>
                      <span className={`font-poppins text-label-sm px-2 py-0.5 rounded-default ${s.badgeAlt}`}>
                        Level {rec.level}
                      </span>
                      <span className={`font-poppins text-label-sm px-2 py-0.5 rounded-default ${s.badgeAlt} ${confidenceColors[rec.confidence] || ''} uppercase`}>
                        {rec.confidence}
                      </span>
                      <span className={`font-poppins text-label-sm px-2 py-0.5 rounded-default ${s.badgeAlt}`}>
                        {rec.seniority_fit}
                      </span>
                    </div>
                  </div>

                  {/* Definition */}
                  {rec.definition && (
                    <div className="px-6 pt-4">
                      <p className="font-poppins text-body-md text-on-surface leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {rec.definition}
                      </p>
                    </div>
                  )}

                  {/* Reasoning preview */}
                  <div className="px-6 pt-4 pb-2 flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="material-symbols-outlined text-primary text-[16px]">lightbulb</span>
                      <span className="font-poppins text-label-sm text-primary uppercase tracking-wider">
                        {t('professionMatch.whyThisMatch')}
                      </span>
                    </div>
                    <p className="font-poppins text-body-md text-on-surface-variant leading-relaxed">
                      {reasonPreview}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="px-6 pb-6 pt-2 flex flex-col gap-3">
                    <button
                      onClick={() => setExpandedRank(isExpanded ? null : rec.rank)}
                      className="font-poppins text-label-sm border border-outline-variant px-4 py-3 rounded-default uppercase tracking-wider hover:border-primary hover:text-primary transition-colors duration-300 cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                      {isExpanded ? t('professionMatch.hideAnalysis') : t('professionMatch.seeFullAnalysis')}
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem('selected_occupation', JSON.stringify({
                          isco_code: rec.isco_code,
                          title: rec.title,
                          all_recommendations: recommendations.map(r => ({
                            isco_code: r.isco_code,
                            title: r.title,
                          })),
                        }))
                        setSelectedCareer(rec)
                        setView('confirmation')
                      }}
                      className="font-poppins text-label-sm bg-primary text-on-primary px-4 py-4 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer text-center"
                    >
                      {t('professionMatch.chooseThisPath')}
                    </button>
                  </div>

                  {/* Expanded full reasoning */}
                  {isExpanded && (
                    <div className="border-t border-outline-variant">
                      <div className="p-6 bg-surface-container-lowest">
                        <div className="flex items-center gap-1 mb-3">
                          <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                          <span className="font-poppins text-label-sm text-primary uppercase tracking-wider">
                            {t('professionMatch.fullAIAnalysis')}
                          </span>
                        </div>
                        <p className="font-poppins text-body-md text-on-surface leading-relaxed">
                          {rec.reason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          </div>
      </main>
      <Footer />
    </div>
  )
}
