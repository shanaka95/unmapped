import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import Button from '../components/Button'
import { register as apiRegister } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    const result = await apiRegister(name, email, password, confirmPassword)

    if (result.data) {
      login(result.data.user, result.data.access_token)
      navigate('/dashboard')
    } else {
      setError(result.error || 'Registration failed')
    }

    setIsSubmitting(false)
  }

  return (
    <AuthLayout title="Create account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {error && (
          <p className="font-poppins text-label-sm text-error">{error}</p>
        )}
        <InputField
          label="Full Name"
          id="name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <InputField
          label="Email"
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <InputField
          label="Password"
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <InputField
          label="Confirm Password"
          id="confirm-password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        <div className="flex flex-col gap-4 mt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
          <div className="text-center">
            <Link
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5"
              to="/"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
