import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import Button from '../components/Button'
import { forgotPassword } from '../api/auth'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const result = await forgotPassword(email)

    if (result.data) {
      setSuccess(true)
    } else {
      setError(result.error || t('api.somethingWentWrong'))
    }

    setIsSubmitting(false)
  }

  return (
    <AuthLayout title={t('auth.resetPassword')}>
      {success ? (
        <div className="flex flex-col gap-8">
          <p className="font-poppins text-body-md text-on-surface">
            {t('auth.resetSent')}
          </p>
          <Link
            className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5 text-center"
            to="/"
          >
            {t('auth.backToSignIn')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {error && (
            <p className="font-poppins text-label-sm text-error">{error}</p>
          )}
          <InputField
            label={t('auth.email')}
            id="email"
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <div className="flex flex-col gap-4 mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('auth.sending') : t('auth.sendResetLink')}
            </Button>
            <div className="text-center">
              <Link
                className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5"
                to="/"
              >
                {t('auth.backToSignIn')}
              </Link>
            </div>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
