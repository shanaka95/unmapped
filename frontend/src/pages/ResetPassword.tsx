import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import Button from '../components/Button'
import { resetPassword } from '../api/auth'
import { validatePasswordReset, type FieldErrors } from '../utils/validation'

export default function ResetPassword() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')

    const errors = validatePasswordReset({ password: newPassword, confirmPassword })
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    if (!token) {
      setFormError('Invalid or missing reset token')
      return
    }

    setIsSubmitting(true)

    const result = await resetPassword(token, newPassword, confirmPassword)

    if (result.data) {
      setSuccess(true)
    } else {
      setFormError(result.error || 'Reset failed')
    }

    setIsSubmitting(false)
  }

  if (!token) {
    return (
      <AuthLayout title={t('auth.invalidLink')}>
        <div className="flex flex-col gap-8">
          <p className="font-poppins text-body-md text-on-surface">
            {t('auth.resetExpired')}
          </p>
          <Link
            className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5 text-center"
            to="/forgot-password"
          >
            {t('auth.requestNewLink')}
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t('auth.setNewPassword')}>
      {success ? (
        <div className="flex flex-col gap-8">
          <p className="font-poppins text-body-md text-on-surface">
            {t('auth.resetSuccess')}
          </p>
          <Link
            className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5 text-center"
            to="/"
          >
            {t('auth.signIn')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {formError && (
            <p className="font-poppins text-label-sm text-error">{formError}</p>
          )}
          <InputField
            label={t('auth.newPassword')}
            id="new-password"
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            value={newPassword}
            onChange={e => { setNewPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })) }}
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
              {isSubmitting ? t('auth.resetting') : t('auth.resetPassword')}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
