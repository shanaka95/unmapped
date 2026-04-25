import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
      <header className="border-b border-outline-variant px-6 sm:px-margin-page py-4 flex items-center justify-between">
        <h1 className="font-poppins text-h2 text-on-surface">Unmapped</h1>
        <div className="flex items-center gap-6">
          {isAdmin && (
            <Link
              to="/admin"
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase tracking-wider"
            >
              Admin
            </Link>
          )}
          <button
            onClick={logout}
            className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase tracking-wider cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 sm:px-8">
        <div className="max-w-container-max w-full flex flex-col gap-8">
          <div>
            <h2 className="font-poppins text-h1 text-on-surface">
              Welcome, {user?.name}
            </h2>
            <p className="font-poppins text-body-lg text-on-surface-variant mt-2">
              {user?.email}
            </p>
          </div>

          <div className="flex items-center gap-unit">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                user?.is_verified ? 'bg-green-600' : 'bg-error'
              }`}
            />
            <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
              {user?.is_verified ? 'Email verified' : 'Email not verified'}
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
