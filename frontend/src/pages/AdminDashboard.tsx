import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAdminStats, getAdminUsers, type AdminStats, type User } from '../api/auth'
import {
  listSectors, createSector, deleteSector, listIloSectors,
  type Sector, type IloSector,
} from '../api/sectors'
import InputField from '../components/InputField'
import SelectField from '../components/SelectField'
import Footer from '../components/Footer'

type Section = 'overview' | 'sectors'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [section, setSection] = useState<Section>('overview')

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
          <button
            onClick={logout}
            className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase tracking-wider cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex flex-grow">
        {/* Left sidebar */}
        <nav className="hidden sm:flex flex-col w-56 border-r border-outline-variant px-4 py-6 gap-unit flex-shrink-0">
          <button
            onClick={() => setSection('overview')}
            className={`text-left px-4 py-3 rounded-xl font-poppins text-label-sm uppercase tracking-wider transition-colors duration-300 cursor-pointer ${
              section === 'overview'
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSection('sectors')}
            className={`text-left px-4 py-3 rounded-xl font-poppins text-label-sm uppercase tracking-wider transition-colors duration-300 cursor-pointer ${
              section === 'sectors'
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Sectors
          </button>
        </nav>

        {/* Mobile nav */}
        <div className="sm:hidden flex border-b border-outline-variant w-full">
          <button
            onClick={() => setSection('overview')}
            className={`flex-1 py-3 font-poppins text-label-sm uppercase tracking-wider text-center transition-colors duration-300 cursor-pointer ${
              section === 'overview'
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSection('sectors')}
            className={`flex-1 py-3 font-poppins text-label-sm uppercase tracking-wider text-center transition-colors duration-300 cursor-pointer ${
              section === 'sectors'
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant'
            }`}
          >
            Sectors
          </button>
        </div>

        {/* Main content */}
        <main className="flex-grow px-6 sm:px-8 py-8">
          <div className="max-w-container-max mx-auto">
            {section === 'overview' && <OverviewSection user={user} />}
            {section === 'sectors' && <SectorsSection />}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}

function OverviewSection({ user }: { user: User | null }) {
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

  if (loading) {
    return (
      <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
        Loading...
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h2 className="font-poppins text-h1 text-on-surface">Overview</h2>
        <p className="font-poppins text-body-lg text-on-surface-variant mt-2">
          {user?.email}
        </p>
      </div>

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
        <div className="border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
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
                <tr key={u.id} className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors duration-300">
                  <td className="px-6 py-3">{u.name}</td>
                  <td className="px-6 py-3 text-on-surface-variant">{u.email}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`font-poppins text-label-sm uppercase tracking-wider px-2 py-1 rounded-default ${
                        u.role === 'admin'
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant'
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
    </div>
  )
}

function SectorsSection() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [iloSectors, setIloSectors] = useState<IloSector[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [iloSectorId, setIloSectorId] = useState('')

  async function loadData() {
    const [sectorsRes, iloRes] = await Promise.all([listSectors(), listIloSectors()])
    if (sectorsRes.data) setSectors(sectorsRes.data)
    if (iloRes.data) setIloSectors(iloRes.data)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!title.trim()) {
      setFormError('Title is required')
      return
    }
    if (!iloSectorId) {
      setFormError('Please select an ILO sector')
      return
    }

    setIsSubmitting(true)
    const result = await createSector({
      title: title.trim(),
      description: description.trim() || null,
      ilo_sector_id: parseInt(iloSectorId),
    })

    if (result.data) {
      setTitle('')
      setDescription('')
      setIloSectorId('')
      setShowForm(false)
      await loadData()
    } else {
      setFormError(result.error || 'Failed to create sector')
    }
    setIsSubmitting(false)
  }

  async function handleDelete(id: number) {
    const result = await deleteSector(id)
    if (result.status === 204 || result.data !== undefined) {
      await loadData()
    }
  }

  const iloOptions = iloSectors.map(s => ({ value: String(s.id), label: s.name }))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="font-poppins text-h1 text-on-surface">Sectors</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="font-poppins text-label-sm bg-primary text-on-primary px-6 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'Add Sector'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border border-outline-variant rounded-xl p-6 flex flex-col gap-6 bg-surface-container-lowest"
        >
          {formError && (
            <p className="font-poppins text-label-sm text-error">{formError}</p>
          )}
          <InputField
            label="Title"
            id="sector-title"
            placeholder="e.g. Software Development"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <div className="flex flex-col gap-unit">
            <label
              className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
              htmlFor="sector-description"
            >
              Description
            </label>
            <textarea
              id="sector-description"
              placeholder="Brief description of this sector..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline resize-none"
            />
          </div>
          <SelectField
            label="ILO Sector"
            id="ilo-sector"
            options={iloOptions}
            placeholder="Select an ILO sector"
            value={iloSectorId}
            onChange={setIloSectorId}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="self-start font-poppins text-label-sm bg-primary text-on-primary px-6 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Sector'}
          </button>
        </form>
      )}

      {/* Sectors table */}
      {loading ? (
        <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
          Loading...
        </span>
      ) : sectors.length === 0 ? (
        <div className="border border-outline-variant rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-outline text-[48px] mb-4 block">category</span>
          <p className="font-poppins text-body-md text-on-surface-variant">
            No sectors yet. Add your first sector above.
          </p>
        </div>
      ) : (
        <div className="border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                  Title
                </th>
                <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                  Description
                </th>
                <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                  ILO Sector
                </th>
                <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3 w-20">
                </th>
              </tr>
            </thead>
            <tbody>
              {sectors.map(s => (
                <tr key={s.id} className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors duration-300 group">
                  <td className="px-6 py-4 font-medium">{s.title}</td>
                  <td className="px-6 py-4 text-on-surface-variant max-w-xs truncate">
                    {s.description || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-poppins text-label-sm bg-surface-container text-on-surface-variant px-3 py-1 rounded-default">
                      {s.ilo_sector.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="opacity-0 group-hover:opacity-100 font-poppins text-label-sm text-error hover:text-on-error-container transition-opacity duration-300 cursor-pointer uppercase tracking-wider"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
