import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../components/AuthLayout'
import { verifyEmail } from '../api/auth'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmail() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    verifyEmail(token).then(result => {
      if (result.data) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    })
  }, [token])

  return (
    <AuthLayout title={t('auth.verifyEmail')}>
      <div className="flex flex-col gap-8">
        {status === 'loading' && (
          <p className="font-poppins text-body-md text-on-surface-variant text-center">
            {t('auth.verifying')}
          </p>
        )}
        {status === 'success' && (
          <>
            <p className="font-poppins text-body-md text-on-surface text-center">
              {t('auth.verifySuccess')}
            </p>
            <Link
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5 text-center"
              to="/"
            >
              {t('auth.continueToSignIn')}
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="font-poppins text-body-md text-error text-center">
              {t('auth.verifyExpired')}
            </p>
            <Link
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5 text-center"
              to="/"
            >
              {t('auth.backToSignIn')}
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
