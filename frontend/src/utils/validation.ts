import i18n from '../i18n'

export interface FieldErrors {
  [field: string]: string
}

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, message: () => i18n.t('validation.atLeast8') },
  { test: (v: string) => /[A-Z]/.test(v), message: () => i18n.t('validation.oneUppercase') },
  { test: (v: string) => /[a-z]/.test(v), message: () => i18n.t('validation.oneLowercase') },
  { test: (v: string) => /\d/.test(v), message: () => i18n.t('validation.oneDigit') },
]

export function validatePassword(password: string): string[] {
  return PASSWORD_RULES.filter(r => !r.test(password)).map(r => r.message())
}

export function validateRegistration(data: {
  name: string
  email: string
  password: string
  confirmPassword: string
}): FieldErrors {
  const errors: FieldErrors = {}

  if (!data.name.trim()) {
    errors.name = i18n.t('validation.nameRequired')
  }

  if (!data.email.trim()) {
    errors.email = i18n.t('validation.emailRequired')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = i18n.t('validation.emailInvalid')
  }

  if (!data.password) {
    errors.password = i18n.t('validation.passwordRequired')
  } else {
    const failures = validatePassword(data.password)
    if (failures.length > 0) {
      errors.password = i18n.t('validation.requires') + failures.join(', ')
    }
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = i18n.t('validation.confirmPassword')
  } else if (data.password && data.password !== data.confirmPassword) {
    errors.confirmPassword = i18n.t('validation.passwordsMismatch')
  }

  return errors
}

export function validatePasswordReset(data: {
  password: string
  confirmPassword: string
}): FieldErrors {
  const errors: FieldErrors = {}

  if (!data.password) {
    errors.password = i18n.t('validation.passwordRequired')
  } else {
    const failures = validatePassword(data.password)
    if (failures.length > 0) {
      errors.password = i18n.t('validation.requires') + failures.join(', ')
    }
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = i18n.t('validation.confirmPassword')
  } else if (data.password && data.password !== data.confirmPassword) {
    errors.confirmPassword = i18n.t('validation.passwordsMismatch')
  }

  return errors
}
