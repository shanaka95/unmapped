import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import { verifyEmail } from '../api/auth'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmail() {
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
    <AuthLayout title="Verify email">
      <div className="flex flex-col gap-8">
        {status === 'loading' && (
          <p className="font-poppins text-body-md text-on-surface-variant text-center">
            Verifying your email...
          </p>
        )}
        {status === 'success' && (
          <>
            <p className="font-poppins text-body-md text-on-surface text-center">
              Your email has been verified successfully.
            </p>
            <Link
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5 text-center"
              to="/"
            >
              Continue to Sign In
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="font-poppins text-body-md text-error text-center">
              This verification link is invalid or has expired.
            </p>
            <Link
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 border-b border-transparent hover:border-primary pb-0.5 text-center"
              to="/"
            >
              Back to Sign In
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
