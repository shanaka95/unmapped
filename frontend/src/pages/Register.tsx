import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import Button from '../components/Button'
import { register as apiRegister } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { validateRegistration, type FieldErrors } from '../utils/validation'

export default function Register() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')

    const errors = validateRegistration({ name, email, password, confirmPassword })
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    setIsSubmitting(true)

    const result = await apiRegister(name, email, password, confirmPassword)

    if (result.data) {
      login(result.data.user, result.data.access_token)
      navigate(result.data.user.role === 'admin' ? '/admin' : '/dashboard')
    } else {
      setFormError(result.error || t('api.registrationFailed'))
    }

    setIsSubmitting(false)
  }

  return (
    <AuthLayout title={t('auth.createAccount')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {formError && (
          <p className="font-poppins text-label-sm text-error">{formError}</p>
        )}
        <InputField
          label={t('auth.fullName')}
          id="name"
          type="text"
          placeholder={t('auth.namePlaceholder')}
          value={name}
          onChange={e => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: '' })) }}
          error={fieldErrors.name}
          required
        />
        <InputField
          label={t('auth.email')}
          id="email"
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={e => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: '' })) }}
          error={fieldErrors.email}
          required
        />
        <InputField
          label={t('auth.password')}
          id="password"
          type="password"
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })) }}
          error={fieldErrors.password}
          required
        />
        <InputField
          label={t('auth.confirmPassword')}
          id="confirm-password"
          type="password"
          placeholder={t('auth.passwordPlaceholder')}
          value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({ ...prev, confirmPassword: '' })) }}
          error={fieldErrors.confirmPassword}
          required
        />
        <div className="flex flex-col gap-4 mt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
          </Button>
          <div className="text-center">
            <Link
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5"
              to="/"
            >
              {t('auth.hasAccount')}
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
