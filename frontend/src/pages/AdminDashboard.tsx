import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAdminStats, getAdminUsers, type AdminStats, type User } from '../api/auth'
import {
  listSectors, createSector, deleteSector, listIloSectors, classifySector,
  type Sector, type IloSector,
} from '../api/sectors'
import {
  listOccupations, createOccupation, updateOccupation, deleteOccupation, listOccupationGroups,
  type Occupation, type OccupationGroup,
} from '../api/occupations'
import InputField from '../components/InputField'
import Pagination from '../components/Pagination'
import SearchBar from '../components/SearchBar'
import SelectField from '../components/SelectField'
import Footer from '../components/Footer'

type Section = 'overview' | 'sectors' | 'occupations'

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
          {(['overview', 'sectors', 'occupations'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`text-left px-4 py-3 rounded-xl font-poppins text-label-sm uppercase tracking-wider transition-colors duration-300 cursor-pointer ${
                section === s
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </nav>

        {/* Mobile nav */}
        <div className="sm:hidden flex border-b border-outline-variant w-full">
          {(['overview', 'sectors', 'occupations'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`flex-1 py-3 font-poppins text-label-sm uppercase tracking-wider text-center transition-colors duration-300 cursor-pointer ${
                section === s
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-grow px-6 sm:px-8 py-8">
          <div className="max-w-container-max mx-auto">
            {section === 'overview' && <OverviewSection user={user} />}
            {section === 'sectors' && <SectorsSection />}
            {section === 'occupations' && <OccupationsSection />}
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
  const [isClassifying, setIsClassifying] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
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
  const canClassify = title.trim().length > 0

  const q = search.toLowerCase()
  const filteredSectors = q
    ? sectors.filter(s =>
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        s.ilo_sector.name.toLowerCase().includes(q)
      )
    : sectors

  async function handleAiClassify() {
    if (!canClassify) return
    setIsClassifying(true)
    setFormError('')
    const result = await classifySector(title.trim(), description.trim() || null)
    if (result.data) {
      setIloSectorId(String(result.data.ilo_sector_id))
    } else {
      setFormError(result.error || 'AI classification failed. Please select manually.')
    }
    setIsClassifying(false)
  }

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
          <div className="flex flex-col gap-unit">
            <div className="flex items-center justify-between">
              <label
                className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
                htmlFor="ilo-sector"
              >
                ILO Sector
              </label>
              <button
                type="button"
                onClick={handleAiClassify}
                disabled={!canClassify || isClassifying}
                className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 cursor-pointer flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                title={!canClassify ? 'Enter a title first' : 'Let AI suggest the best ILO sector'}
              >
                <span className={`material-symbols-outlined text-[16px] ${isClassifying ? 'animate-spin' : ''}`}>
                  {isClassifying ? 'progress_activity' : 'auto_awesome'}
                </span>
                {isClassifying ? 'Classifying...' : 'AI Suggest'}
              </button>
            </div>
            <SelectField
              id="ilo-sector"
              options={iloOptions}
              placeholder="Select or use AI to auto-fill"
              value={iloSectorId}
              onChange={setIloSectorId}
            />
            {iloSectorId && (
              <div className="flex items-center gap-unit">
                <span className="material-symbols-outlined text-primary text-[14px]">check_circle</span>
                <span className="font-poppins text-label-sm text-primary">
                  {iloSectors.find(s => String(s.id) === iloSectorId)?.name}
                </span>
              </div>
            )}
          </div>
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
      {!loading && (
        <SearchBar
          id="sectors-search"
          value={search}
          onChange={setSearch}
          placeholder="Search sectors..."
        />
      )}
      {loading ? (
        <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
          Loading...
        </span>
      ) : filteredSectors.length === 0 ? (
        <div className="border border-outline-variant rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-outline text-[48px] mb-4 block">category</span>
          <p className="font-poppins text-body-md text-on-surface-variant">
            {sectors.length === 0 ? 'No sectors yet. Add your first sector above.' : 'No sectors match your search.'}
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
              {filteredSectors.map(s => (
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

function OccupationsSection() {
  const [occupations, setOccupations] = useState<Occupation[]>([])
  const [groups, setGroups] = useState<OccupationGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Detail / edit panel
  const [selected, setSelected] = useState<Occupation | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editDefinition, setEditDefinition] = useState('')
  const [editLevel, setEditLevel] = useState('')
  const [editGroupId, setEditGroupId] = useState('')

  // Filters
  const [filterGroupId, setFilterGroupId] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [search, setSearch] = useState('')

  // Add form state
  const [title, setTitle] = useState('')
  const [definition, setDefinition] = useState('')
  const [level, setLevel] = useState('')
  const [groupId, setGroupId] = useState('')

  async function loadData() {
    const [occRes, groupsRes] = await Promise.all([listOccupations(), listOccupationGroups()])
    if (occRes.data) setOccupations(occRes.data)
    if (groupsRes.data) setGroups(groupsRes.data)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleFilterLoad() {
    const params: { group_id?: number; level?: number } = {}
    if (filterGroupId) params.group_id = parseInt(filterGroupId)
    if (filterLevel) params.level = parseInt(filterLevel)
    const res = await listOccupations(params)
    if (res.data) setOccupations(res.data)
  }

  useEffect(() => { handleFilterLoad() }, [filterGroupId, filterLevel])

  function openDetail(occ: Occupation) {
    setSelected(occ)
    setIsEditing(false)
    setEditError('')
  }

  function closeDetail() {
    setSelected(null)
    setIsEditing(false)
    setEditError('')
  }

  function startEditing() {
    if (!selected) return
    setEditTitle(selected.title)
    setEditDefinition(selected.definition || '')
    setEditLevel(String(selected.level))
    setEditGroupId(String(selected.group_id))
    setEditError('')
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setEditError('')
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    setEditError('')

    if (!editTitle.trim()) { setEditError('Title is required'); return }
    if (!editLevel) { setEditError('Level is required'); return }
    if (!editGroupId) { setEditError('Please select a group'); return }

    setIsSaving(true)
    const result = await updateOccupation(selected.id, {
      title: editTitle.trim(),
      definition: editDefinition.trim() || null,
      level: parseInt(editLevel),
      group_id: parseInt(editGroupId),
    })

    if (result.data) {
      setSelected(result.data)
      setIsEditing(false)
      await loadData()
    } else {
      setEditError(result.error || 'Failed to update occupation')
    }
    setIsSaving(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!title.trim()) { setFormError('Title is required'); return }
    if (!level) { setFormError('Level is required'); return }
    if (!groupId) { setFormError('Please select an occupation group'); return }

    setIsSubmitting(true)
    const result = await createOccupation({
      title: title.trim(),
      definition: definition.trim() || null,
      level: parseInt(level),
      group_id: parseInt(groupId),
    })

    if (result.data) {
      setTitle('')
      setDefinition('')
      setLevel('')
      setGroupId('')
      setShowForm(false)
      await loadData()
    } else {
      setFormError(result.error || 'Failed to create occupation')
    }
    setIsSubmitting(false)
  }

  async function handleDelete(id: number) {
    const result = await deleteOccupation(id)
    if (result.status === 204 || result.data !== undefined) {
      if (selected?.id === id) closeDetail()
      await loadData()
    }
  }

  const groupOptions = groups.map(g => ({
    value: String(g.id),
    label: `${g.code} — ${g.name}`,
  }))

  const levelOptions = [
    { value: '1', label: '1 — Major' },
    { value: '2', label: '2 — Sub-Major' },
    { value: '3', label: '3 — Minor' },
    { value: '4', label: '4 — Unit' },
  ]

  const levelLabels: Record<string, string> = {
    '1': 'Major',
    '2': 'Sub-Major',
    '3': 'Minor',
    '4': 'Unit',
  }

  const q = search.toLowerCase()
  const filtered = q
    ? occupations.filter(o =>
        o.title.toLowerCase().includes(q) ||
        (o.definition && o.definition.toLowerCase().includes(q)) ||
        o.group.name.toLowerCase().includes(q)
      )
    : occupations

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="font-poppins text-h1 text-on-surface">Occupations</h2>
          <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
            {filtered.length} records
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="font-poppins text-label-sm bg-primary text-on-primary px-6 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'Add Occupation'}
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
          <SelectField
            label="Level"
            id="occ-level"
            options={levelOptions}
            placeholder="Select level"
            value={level}
            onChange={setLevel}
          />
          <InputField
            label="Title"
            id="occ-title"
            placeholder="e.g. Software Developer"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <div className="flex flex-col gap-unit">
            <label
              className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
              htmlFor="occ-definition"
            >
              Definition
            </label>
            <textarea
              id="occ-definition"
              placeholder="Describe this occupation..."
              value={definition}
              onChange={e => setDefinition(e.target.value)}
              rows={3}
              className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline resize-none"
            />
          </div>
          <SelectField
            label="Occupation Group"
            id="occ-group"
            options={groupOptions}
            placeholder="Select group"
            value={groupId}
            onChange={setGroupId}
          />
          {groupId && (
            <div className="flex items-center gap-unit">
              <span className="material-symbols-outlined text-primary text-[14px]">check_circle</span>
              <span className="font-poppins text-label-sm text-primary">
                {groups.find(g => String(g.id) === groupId)?.name}
              </span>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="self-start font-poppins text-label-sm bg-primary text-on-primary px-6 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Occupation'}
          </button>
        </form>
      )}

      {/* Search + Filters */}
      {!loading && (
        <div className="flex flex-col gap-4">
          <SearchBar
            id="occ-search"
            value={search}
            onChange={setSearch}
            placeholder="Search occupations..."
          />
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-56">
              <SelectField
                label="Filter by Group"
                id="filter-group"
                options={groupOptions}
                placeholder="All groups"
                value={filterGroupId}
                onChange={val => setFilterGroupId(val)}
              />
            </div>
            <div className="w-48">
              <SelectField
                label="Filter by Level"
                id="filter-level"
                options={levelOptions}
                placeholder="All levels"
                value={filterLevel}
                onChange={val => setFilterLevel(val)}
              />
            </div>
            {(search || filterGroupId || filterLevel) && (
              <button
                onClick={() => { setSearch(''); setFilterGroupId(''); setFilterLevel('') }}
                className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 cursor-pointer flex items-center gap-1 uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-[16px]">filter_list_off</span>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table + Detail panel */}
      <div className="flex gap-6">
        {/* Table */}
        <div className={`flex-grow min-w-0 ${selected ? 'hidden lg:block' : ''}`}>
          {loading ? (
            <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
              Loading...
            </span>
          ) : filtered.length === 0 ? (
            <div className="border border-outline-variant rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-outline text-[48px] mb-4 block">work</span>
              <p className="font-poppins text-body-md text-on-surface-variant">
                No occupations found. Add one above or adjust your filters.
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
                    <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3 w-20">
                      Level
                    </th>
                    <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                      Group
                    </th>
                    <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3 w-20">
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr
                      key={o.id}
                      onClick={() => openDetail(o)}
                      className={`border-b border-outline-variant last:border-b-0 transition-colors duration-300 group cursor-pointer ${
                        selected?.id === o.id
                          ? 'bg-surface-container-low'
                          : 'hover:bg-surface-container-low'
                      }`}
                    >
                      <td className="px-6 py-4 font-medium">{o.title}</td>
                      <td className="px-6 py-4 text-on-surface-variant">L{o.level}</td>
                      <td className="px-6 py-4">
                        <span className="font-poppins text-label-sm text-on-surface-variant">
                          {o.group.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(o.id) }}
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

        {/* Detail / Edit panel */}
        {selected && (
          <div className="w-full lg:w-96 flex-shrink-0 border border-outline-variant rounded-xl bg-surface-container-lowest overflow-hidden flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-poppins text-body-md font-medium truncate">
                  {selected.title}
                </span>
              </div>
              <button
                onClick={closeDetail}
                className="font-poppins text-on-surface-variant hover:text-on-surface transition-colors duration-300 cursor-pointer flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Panel body */}
            {isEditing ? (
              <form onSubmit={handleUpdate} className="flex flex-col gap-5 p-6 flex-grow overflow-y-auto">
                {editError && (
                  <p className="font-poppins text-label-sm text-error">{editError}</p>
                )}
                <InputField
                  label="Title"
                  id="edit-title"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
                <SelectField
                  label="Level"
                  id="edit-level"
                  options={levelOptions}
                  value={editLevel}
                  onChange={setEditLevel}
                />
                <div className="flex flex-col gap-unit">
                  <label
                    className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
                    htmlFor="edit-definition"
                  >
                    Definition
                  </label>
                  <textarea
                    id="edit-definition"
                    value={editDefinition}
                    onChange={e => setEditDefinition(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 resize-none"
                  />
                </div>
                <SelectField
                  label="Occupation Group"
                  id="edit-group"
                  options={groupOptions}
                  value={editGroupId}
                  onChange={setEditGroupId}
                />
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="font-poppins text-label-sm bg-primary text-on-primary px-6 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="font-poppins text-label-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300 cursor-pointer uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-6 p-6 flex-grow overflow-y-auto">
                <div className="flex flex-col gap-1">
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">Level</span>
                  <span className="font-poppins text-body-md text-on-surface">
                    {selected.level} — {levelLabels[String(selected.level)]}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">Group</span>
                  <span className="font-poppins text-body-md text-on-surface">
                    {selected.group.name}
                  </span>
                  <span className="font-poppins text-label-sm text-on-surface-variant">
                    Skill Level {selected.group.skill_level}
                  </span>
                </div>
                {selected.definition && (
                  <div className="flex flex-col gap-1">
                    <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">Definition</span>
                    <p className="font-poppins text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                      {selected.definition}
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">Created</span>
                  <span className="font-poppins text-body-md text-on-surface-variant">
                    {new Date(selected.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">Updated</span>
                  <span className="font-poppins text-body-md text-on-surface-variant">
                    {new Date(selected.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-outline-variant">
                  <button
                    onClick={startEditing}
                    className="font-poppins text-label-sm bg-primary text-on-primary px-6 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="font-poppins text-label-sm text-error hover:text-on-error-container transition-colors duration-300 cursor-pointer uppercase tracking-wider flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile back button when detail is open */}
      {selected && (
        <button
          onClick={closeDetail}
          className="lg:hidden font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 cursor-pointer flex items-center gap-1 uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to list
        </button>
      )}
    </div>
  )
}
