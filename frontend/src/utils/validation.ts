export interface FieldErrors {
  [field: string]: string
}

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, message: 'At least 8 characters' },
  { test: (v: string) => /[A-Z]/.test(v), message: 'One uppercase letter' },
  { test: (v: string) => /[a-z]/.test(v), message: 'One lowercase letter' },
  { test: (v: string) => /\d/.test(v), message: 'One digit' },
]

export function validatePassword(password: string): string[] {
  return PASSWORD_RULES.filter(r => !r.test(password)).map(r => r.message)
}

export function validateRegistration(data: {
  name: string
  email: string
  password: string
  confirmPassword: string
}): FieldErrors {
  const errors: FieldErrors = {}

  if (!data.name.trim()) {
    errors.name = 'Name is required'
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address'
  }

  if (!data.password) {
    errors.password = 'Password is required'
  } else {
    const failures = validatePassword(data.password)
    if (failures.length > 0) {
      errors.password = 'Requires: ' + failures.join(', ')
    }
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (data.password && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}

export function validatePasswordReset(data: {
  password: string
  confirmPassword: string
}): FieldErrors {
  const errors: FieldErrors = {}

  if (!data.password) {
    errors.password = 'Password is required'
  } else {
    const failures = validatePassword(data.password)
    if (failures.length > 0) {
      errors.password = 'Requires: ' + failures.join(', ')
    }
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (data.password && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}
