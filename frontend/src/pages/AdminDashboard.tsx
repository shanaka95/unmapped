import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { getAdminStats, getAdminUsers, type AdminStats, type User } from '../api/auth'
import Footer from '../components/Footer'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [statsRes, usersRes] = await Promise.all([getAdminStats(), getAdminUsers()])
      if (statsRes.data) setStats(statsRes.data)
      if (usersRes.data) setUsers(usersRes.data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
      <header className="border-b border-outline-variant px-6 sm:px-margin-page py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-poppins text-h2 text-on-surface">Unmapped</h1>
          <span className="font-poppins text-label-sm bg-primary text-on-primary px-2 py-1 rounded-default uppercase tracking-wider">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase tracking-wider"
          >
            Dashboard
          </Link>
          <button
            onClick={logout}
            className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase tracking-wider cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-grow px-6 sm:px-margin-page py-8">
        <div className="max-w-container-max mx-auto flex flex-col gap-12">
          <div>
            <h2 className="font-poppins text-h1 text-on-surface">Admin Panel</h2>
            <p className="font-poppins text-body-lg text-on-surface-variant mt-2">
              {user?.email}
            </p>
          </div>

          {loading ? (
            <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
              Loading...
            </span>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
                <div className="border border-outline-variant rounded-xl p-6 flex flex-col gap-2">
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Total Users
                  </span>
                  <span className="font-poppins text-h1 text-on-surface">
                    {stats?.total_users ?? 0}
                  </span>
                </div>
                <div className="border border-outline-variant rounded-xl p-6 flex flex-col gap-2">
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Verified Users
                  </span>
                  <span className="font-poppins text-h1 text-on-surface">
                    {stats?.verified_users ?? 0}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="font-poppins text-h2 text-on-surface">All Users</h3>
                <div className="border border-outline-variant rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant">
                        <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                          Name
                        </th>
                        <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                          Email
                        </th>
                        <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                          Role
                        </th>
                        <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                          Verified
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-outline-variant last:border-b-0">
                          <td className="px-6 py-3 text-on-surface">{u.name}</td>
                          <td className="px-6 py-3 text-on-surface">{u.email}</td>
                          <td className="px-6 py-3">
                            <span
                              className={`font-poppins text-label-sm uppercase tracking-wider px-2 py-1 rounded-default ${
                                u.role === 'admin'
                                  ? 'bg-primary text-on-primary'
                                  : 'text-on-surface-variant'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                u.is_verified ? 'bg-green-600' : 'bg-error'
                              }`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
