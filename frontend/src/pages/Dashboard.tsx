import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { getProfile } from '../api/profile'
import Footer from '../components/Footer'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    async function checkProfile() {
      const res = await getProfile()
      if (res.data && !res.data.is_complete) {
        navigate('/onboarding', { replace: true })
        return
      }
      setChecking(false)
    }
    checkProfile()
  }, [])

  if (checking) {
    return (
      <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
        <main className="flex-grow flex items-center justify-center">
          <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider animate-pulse">
            {t('common.loading')}
          </span>
        </main>
      </div>
    )
  }

  return (
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
            onClick={logout}
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
        </div>
      </main>

      <Footer />
    </div>
  )
}
