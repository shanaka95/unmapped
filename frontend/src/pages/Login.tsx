import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import Button from '../components/Button'
import { login as apiLogin } from '../api/auth'
import { getProfile } from '../api/profile'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const result = await apiLogin(email, password)

    if (result.data) {
      login(result.data.user, result.data.access_token)

      // Check if onboarding is complete
      const profileRes = await getProfile()
      const destination = result.data.user.role === 'admin'
        ? '/admin'
        : profileRes.data?.is_complete
          ? '/career-assistant'
          : '/onboarding'

      navigate(destination)
    } else {
      setError(result.error || t('api.loginFailed'))
    }

    setIsSubmitting(false)
  }

  return (
    <AuthLayout title={t('auth.welcomeBack')}>
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
        <InputField
          label={t('auth.password')}
          id="password"
          type="password"
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <div className="flex flex-col gap-4 mt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
          <div className="flex flex-col items-center gap-3">
            <Link
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5"
              to="/forgot-password"
            >
              {t('auth.forgotPassword')}
            </Link>
            <Link
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5"
              to="/register"
            >
              {t('auth.noAccount')}
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
