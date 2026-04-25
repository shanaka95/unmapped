import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import Button from '../components/Button'
import { login as apiLogin } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
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
      navigate('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }

    setIsSubmitting(false)
  }

  return (
    <AuthLayout title="Welcome back">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {error && (
          <p className="font-poppins text-label-sm text-error">{error}</p>
        )}
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
        <div className="flex flex-col gap-4 mt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
          <div className="flex flex-col items-center gap-3">
            <Link
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5"
              to="/forgot-password"
            >
              Forgot password?
            </Link>
            <Link
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5"
              to="/register"
            >
              Don&apos;t have an account? Register
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
