import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'
import LanguageSwitcher from '../components/LanguageSwitcher'
import LaborMarketSignals from '../components/LaborMarketSignals'
import AutomationRiskModal from '../components/AutomationRiskModal'

interface SelectedOccupation {
  isco_code: string
  title: string
  all_recommendations?: Array<{ isco_code: string; title: string }>
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [selectedOccupation] = useState<SelectedOccupation | null>(() => {
    const stored = localStorage.getItem('selected_occupation')
    if (stored) {
      try {
        return JSON.parse(stored) as SelectedOccupation
      } catch {
        return null
      }
    }
    return null
  })
  const [showSignals, setShowSignals] = useState(false)
  const [showAutomationRisk, setShowAutomationRisk] = useState(false)

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
        <header className="border-b border-outline-variant px-6 sm:px-margin-page py-4 flex items-center justify-between">
          <h1 className="font-poppins text-h2 text-on-surface">{t('common.unmapped')}</h1>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            {isAdmin && (
              <Link
                to="/admin"
                className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase tracking-wider"
              >
                {t('common.admin')}
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase tracking-wider cursor-pointer"
            >
              {t('common.signOut')}
            </button>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center px-6 sm:px-8">
          <div className="max-w-container-max w-full flex flex-col gap-8">
            <div>
              <h2 className="font-poppins text-h1 text-on-surface">
                {t('dashboard.welcome', { name: user?.name })}
              </h2>
              <p className="font-poppins text-body-lg text-on-surface-variant mt-2">
                {user?.email}
              </p>
            </div>

            <div className="flex items-center gap-unit">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  user?.is_verified ? 'bg-green-600' : 'bg-error'
                }`}
              />
              <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                {user?.is_verified ? t('dashboard.emailVerified') : t('dashboard.emailNotVerified')}
              </span>
            </div>

            {/* Selected Occupation Card */}
            {selectedOccupation && (
              <div className="bg-surface-container p-6 rounded-xl">
                <h3 className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
                  {t('professionMatch.youChoseThisPath')}
                </h3>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-poppins text-h2 text-on-surface">
                      {selectedOccupation.title}
                    </h4>
                    <p className="font-poppins text-label-sm text-on-surface-variant mt-1">
                      ISCO-{selectedOccupation.isco_code}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSignals(true)}
                    className="bg-primary text-on-primary px-6 py-3 rounded font-poppins text-label-sm uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 whitespace-nowrap"
                  >
                    {t('laborMarket.insights')}
                  </button>
                  <button
                    onClick={() => setShowAutomationRisk(true)}
                    className="border border-outline-variant text-on-surface-variant px-6 py-3 rounded font-poppins text-label-sm uppercase tracking-wider hover:border-primary hover:text-primary transition-colors duration-300 whitespace-nowrap"
                  >
                    {t('automationRisk.title')}
                  </button>
                </div>
              </div>
            )}

            </div>
        </main>

        <Footer />
      </div>

      {/* Labor Market Signals Modal */}
      {showSignals && selectedOccupation && (
        <LaborMarketSignals
          iscoCode={selectedOccupation.isco_code}
          onClose={() => setShowSignals(false)}
        />
      )}

      {/* Automation Risk Modal */}
      {showAutomationRisk && selectedOccupation && (
        <AutomationRiskModal
          selectedCode={selectedOccupation.isco_code}
          selectedTitle={selectedOccupation.title}
          recommendations={selectedOccupation.all_recommendations || []}
          onClose={() => setShowAutomationRisk(false)}
        />
      )}
    </>
  )
}
