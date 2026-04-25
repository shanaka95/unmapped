import { Link } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'
import Button from '../components/Button'

export default function Register() {
  return (
    <AuthLayout title="Create account">
      <form className="flex flex-col gap-8">
        <InputField
          label="Full Name"
          id="name"
          type="text"
          placeholder="John Doe"
        />
        <InputField
          label="Email"
          id="email"
          type="email"
          placeholder="name@example.com"
        />
        <InputField
          label="Password"
          id="password"
          type="password"
          placeholder="••••••••"
        />
        <InputField
          label="Confirm Password"
          id="confirm-password"
          type="password"
          placeholder="••••••••"
        />
        <div className="flex flex-col gap-4 mt-4">
          <Button type="submit">Create Account</Button>
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
