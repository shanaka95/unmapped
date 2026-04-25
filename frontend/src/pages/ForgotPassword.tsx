import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import Button from '../components/Button'
import { forgotPassword } from '../api/auth'

export default function ForgotPassword() {
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
      setError(result.error || 'Something went wrong')
    }

    setIsSubmitting(false)
  }

  return (
    <AuthLayout title="Reset password">
      {success ? (
        <div className="flex flex-col gap-8">
          <p className="font-poppins text-body-md text-on-surface">
            If an account with that email exists, a reset link has been sent to your inbox.
          </p>
          <Link
            className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5 text-center"
            to="/"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
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
          <div className="flex flex-col gap-4 mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <div className="text-center">
              <Link
                className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5"
                to="/"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
