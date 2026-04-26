import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
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
import {
  listIscedLevels, listEducationLevels, createEducationLevel,
  deleteEducationLevel, type IscedLevel, type EducationLevel as EducationLevelType,
} from '../api/educationLevels'
import {
  listCountries, listLanguages, getCountry, getCountryLanguages,
  addLanguageToCountry, removeLanguageFromCountry,
  type Country, type Language, type LanguageBrief, type CountryWithLanguages,
} from '../api/languages'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import InputField from '../components/InputField'
import Pagination from '../components/Pagination'
import SearchBar from '../components/SearchBar'
import SelectField from '../components/SelectField'
import Footer from '../components/Footer'
import LanguageSwitcher from '../components/LanguageSwitcher'

type Section = 'overview' | 'sectors' | 'occupations' | 'education' | 'languages'

const SECTION_KEYS: Record<Section, string> = {
  overview: 'admin.overview',
  sectors: 'admin.sectors',
  occupations: 'admin.occupations',
  education: 'admin.education',
  languages: 'admin.languages',
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [section, setSection] = useState<Section>('overview')

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
      <header className="border-b border-outline-variant px-6 sm:px-margin-page py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-poppins text-h2 text-on-surface">{t('common.unmapped')}</h1>
          <span className="font-poppins text-label-sm bg-primary text-on-primary px-2 py-1 rounded-default uppercase tracking-wider">
            {t('common.admin')}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <button
            onClick={logout}
            className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase tracking-wider cursor-pointer"
          >
            {t('common.signOut')}
          </button>
        </div>
      </header>

      <div className="flex flex-grow">
        {/* Left sidebar */}
        <nav className="hidden sm:flex flex-col w-56 border-r border-outline-variant px-4 py-6 gap-unit flex-shrink-0">
          {(['overview', 'sectors', 'occupations', 'education', 'languages'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`text-left px-4 py-3 rounded-xl font-poppins text-label-sm uppercase tracking-wider transition-colors duration-300 cursor-pointer ${
                section === s
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {t(SECTION_KEYS[s])}
            </button>
          ))}
        </nav>

        {/* Mobile nav */}
        <div className="sm:hidden flex border-b border-outline-variant w-full">
          {(['overview', 'sectors', 'occupations', 'education', 'languages'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`flex-1 py-3 font-poppins text-label-sm uppercase tracking-wider text-center transition-colors duration-300 cursor-pointer ${
                section === s
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              {t(SECTION_KEYS[s])}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-grow px-6 sm:px-8 py-8">
          <div className="max-w-container-max mx-auto">
            {section === 'overview' && <OverviewSection user={user} />}
            {section === 'sectors' && <SectorsSection />}
            {section === 'occupations' && <OccupationsSection />}
            {section === 'education' && <EducationSection />}
            {section === 'languages' && <LanguagesSection />}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}

function OverviewSection({ user }: { user: User | null }) {
  const { t } = useTranslation()
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
        {t('common.loading')}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h2 className="font-poppins text-h1 text-on-surface">{t('admin.overview')}</h2>
        <p className="font-poppins text-body-lg text-on-surface-variant mt-2">
          {user?.email}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="border border-outline-variant rounded-xl p-6 flex flex-col gap-2">
          <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
            {t('admin.stats.totalUsers')}
          </span>
          <span className="font-poppins text-h1 text-on-surface">
            {stats?.total_users ?? 0}
          </span>
        </div>
        <div className="border border-outline-variant rounded-xl p-6 flex flex-col gap-2">
          <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
            {t('admin.stats.verifiedUsers')}
          </span>
          <span className="font-poppins text-h1 text-on-surface">
            {stats?.verified_users ?? 0}
          </span>
        </div>
        <div className="border border-outline-variant rounded-xl p-6 flex flex-col gap-2">
          <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
            {t('admin.stats.sectors')}
          </span>
          <span className="font-poppins text-h1 text-on-surface">
            {stats?.total_sectors ?? 0}
          </span>
        </div>
        <div className="border border-outline-variant rounded-xl p-6 flex flex-col gap-2">
          <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
            {t('admin.stats.occupations')}
          </span>
          <span className="font-poppins text-h1 text-on-surface">
            {stats?.total_occupations ?? 0}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-poppins text-h2 text-on-surface">{t('admin.users.allUsers')}</h3>
        <div className="border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                  {t('admin.users.name')}
                </th>
                <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                  {t('admin.users.email')}
                </th>
                <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                  {t('admin.users.role')}
                </th>
                <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                  {t('admin.users.verified')}
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
  const { t } = useTranslation()
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
      setFormError(t('admin.sector.title') + ' is required')
      return
    }
    if (!iloSectorId) {
      setFormError(t('admin.sector.iloSector') + ' is required')
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
      setFormError(result.error || t('api.failedToCreateSector'))
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

  const PER_PAGE = 20
  const totalPages = Math.max(1, Math.ceil(filteredSectors.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pagedSectors = filteredSectors.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  async function handleAiClassify() {
    if (!canClassify) return
    setIsClassifying(true)
    setFormError('')
    const result = await classifySector(title.trim(), description.trim() || null)
    if (result.data) {
      setIloSectorId(String(result.data.ilo_sector_id))
    } else {
      setFormError(result.error || t('admin.sector.aiFailed'))
    }
    setIsClassifying(false)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="font-poppins text-h1 text-on-surface">{t('admin.sectors')}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="font-poppins text-label-sm bg-primary text-on-primary px-6 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? t('common.cancel') : t('admin.sector.addSector')}
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
            label={t('admin.sector.title')}
            id="sector-title"
            placeholder={t('admin.sector.titlePlaceholder')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <div className="flex flex-col gap-unit">
            <label
              className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
              htmlFor="sector-description"
            >
              {t('admin.sector.description')}
            </label>
            <textarea
              id="sector-description"
              placeholder={t('admin.sector.descriptionPlaceholder')}
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
                {t('admin.sector.iloSector')}
              </label>
              <button
                type="button"
                onClick={handleAiClassify}
                disabled={!canClassify || isClassifying}
                className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 cursor-pointer flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                title={!canClassify ? t('admin.sector.enterTitleFirst') : t('admin.sector.aiSuggestTooltip')}
              >
                <span className={`material-symbols-outlined text-[16px] ${isClassifying ? 'animate-spin' : ''}`}>
                  {isClassifying ? 'progress_activity' : 'auto_awesome'}
                </span>
                {isClassifying ? t('admin.sector.classifying') : t('admin.sector.aiSuggest')}
              </button>
            </div>
            <SelectField
              id="ilo-sector"
              options={iloOptions}
              placeholder={t('admin.sector.selectOrAi')}
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
            {isSubmitting ? t('common.creating') : t('admin.sector.createSector')}
          </button>
        </form>
      )}

      {/* Sectors table */}
      {!loading && (
        <SearchBar
          id="sectors-search"
          value={search}
          onChange={v => { setSearch(v); setPage(1) }}
          placeholder={t('admin.sector.searchSectors')}
        />
      )}
      {loading ? (
        <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
          {t('common.loading')}
        </span>
      ) : filteredSectors.length === 0 ? (
        <div className="border border-outline-variant rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-outline text-[48px] mb-4 block">category</span>
          <p className="font-poppins text-body-md text-on-surface-variant">
            {sectors.length === 0 ? t('admin.sector.noSectors') : t('admin.sector.noSearchResults')}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                    {t('admin.sector.title')}
                  </th>
                  <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                    {t('admin.sector.description')}
                  </th>
                  <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                    {t('admin.sector.iloSector')}
                  </th>
                  <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3 w-20">
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedSectors.map(s => (
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
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSectors.length > PER_PAGE && (
            <Pagination
              total={filteredSectors.length}
              page={safePage}
              perPage={PER_PAGE}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}

function OccupationsSection() {
  const { t } = useTranslation()
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
  const [editTasksInclude, setEditTasksInclude] = useState('')
  const [editIncludedOccupations, setEditIncludedOccupations] = useState('')
  const [editExcludedOccupations, setEditExcludedOccupations] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editLevel, setEditLevel] = useState('')
  const [editGroupId, setEditGroupId] = useState('')

  // Filters
  const [filterGroupId, setFilterGroupId] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Add form state
  const [title, setTitle] = useState('')
  const [definition, setDefinition] = useState('')
  const [tasksInclude, setTasksInclude] = useState('')
  const [includedOccupations, setIncludedOccupations] = useState('')
  const [excludedOccupations, setExcludedOccupations] = useState('')
  const [notes, setNotes] = useState('')
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
    setEditTasksInclude(selected.tasks_include || '')
    setEditIncludedOccupations(selected.included_occupations || '')
    setEditExcludedOccupations(selected.excluded_occupations || '')
    setEditNotes(selected.notes || '')
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

    if (!editTitle.trim()) { setEditError(t('admin.occupation.title') + ' is required'); return }
    if (!editLevel) { setEditError(t('admin.occupation.level') + ' is required'); return }
    if (!editGroupId) { setEditError(t('admin.occupation.selectGroup')); return }

    setIsSaving(true)
    const result = await updateOccupation(selected.id, {
      title: editTitle.trim(),
      definition: editDefinition.trim() || null,
      tasks_include: editTasksInclude.trim() || null,
      included_occupations: editIncludedOccupations.trim() || null,
      excluded_occupations: editExcludedOccupations.trim() || null,
      notes: editNotes.trim() || null,
      level: parseInt(editLevel),
      group_id: parseInt(editGroupId),
    })

    if (result.data) {
      setSelected(result.data)
      setIsEditing(false)
      await loadData()
    } else {
      setEditError(result.error || t('api.failedToUpdateOccupation'))
    }
    setIsSaving(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!title.trim()) { setFormError(t('admin.occupation.title') + ' is required'); return }
    if (!level) { setFormError(t('admin.occupation.level') + ' is required'); return }
    if (!groupId) { setFormError(t('admin.occupation.selectGroup')); return }

    setIsSubmitting(true)
    const result = await createOccupation({
      title: title.trim(),
      definition: definition.trim() || null,
      tasks_include: tasksInclude.trim() || null,
      included_occupations: includedOccupations.trim() || null,
      excluded_occupations: excludedOccupations.trim() || null,
      notes: notes.trim() || null,
      level: parseInt(level),
      group_id: parseInt(groupId),
    })

    if (result.data) {
      setTitle('')
      setDefinition('')
      setTasksInclude('')
      setIncludedOccupations('')
      setExcludedOccupations('')
      setNotes('')
      setLevel('')
      setGroupId('')
      setShowForm(false)
      await loadData()
    } else {
      setFormError(result.error || t('api.failedToCreateOccupation'))
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
    { value: '1', label: t('admin.levelOption.1') },
    { value: '2', label: t('admin.levelOption.2') },
    { value: '3', label: t('admin.levelOption.3') },
    { value: '4', label: t('admin.levelOption.4') },
  ]

  const q = search.toLowerCase()
  const filtered = q
    ? occupations.filter(o =>
        o.title.toLowerCase().includes(q) ||
        (o.definition && o.definition.toLowerCase().includes(q)) ||
        o.group.name.toLowerCase().includes(q)
      )
    : occupations

  const PER_PAGE = 20
  const occTotalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safeOccPage = Math.min(page, occTotalPages)
  const paged = filtered.slice((safeOccPage - 1) * PER_PAGE, safeOccPage * PER_PAGE)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="font-poppins text-h1 text-on-surface">{t('admin.occupations')}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="font-poppins text-label-sm bg-primary text-on-primary px-6 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? t('common.cancel') : t('admin.occupation.addOccupation')}
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
            label={t('admin.occupation.level')}
            id="occ-level"
            options={levelOptions}
            placeholder={t('admin.occupation.selectLevel')}
            value={level}
            onChange={setLevel}
          />
          <InputField
            label={t('admin.occupation.title')}
            id="occ-title"
            placeholder={t('admin.occupation.titlePlaceholder')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <div className="flex flex-col gap-unit">
            <label
              className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
              htmlFor="occ-definition"
            >
              {t('admin.occupation.definition')}
            </label>
            <textarea
              id="occ-definition"
              placeholder={t('admin.occupation.definitionPlaceholder')}
              value={definition}
              onChange={e => setDefinition(e.target.value)}
              rows={3}
              className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline resize-none"
            />
          </div>
          <div className="flex flex-col gap-unit">
            <label
              className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
              htmlFor="occ-tasks"
            >
              {t('admin.occupation.tasksInclude')}
            </label>
            <textarea
              id="occ-tasks"
              placeholder={t('admin.occupation.tasksIncludePlaceholder')}
              value={tasksInclude}
              onChange={e => setTasksInclude(e.target.value)}
              rows={3}
              className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline resize-none"
            />
          </div>
          <div className="flex flex-col gap-unit">
            <label
              className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
              htmlFor="occ-included"
            >
              {t('admin.occupation.includedOccupations')}
            </label>
            <textarea
              id="occ-included"
              placeholder={t('admin.occupation.includedOccupationsPlaceholder')}
              value={includedOccupations}
              onChange={e => setIncludedOccupations(e.target.value)}
              rows={2}
              className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline resize-none"
            />
          </div>
          <div className="flex flex-col gap-unit">
            <label
              className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
              htmlFor="occ-excluded"
            >
              {t('admin.occupation.excludedOccupations')}
            </label>
            <textarea
              id="occ-excluded"
              placeholder={t('admin.occupation.excludedOccupationsPlaceholder')}
              value={excludedOccupations}
              onChange={e => setExcludedOccupations(e.target.value)}
              rows={2}
              className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline resize-none"
            />
          </div>
          <div className="flex flex-col gap-unit">
            <label
              className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
              htmlFor="occ-notes"
            >
              {t('admin.occupation.notes')}
            </label>
            <textarea
              id="occ-notes"
              placeholder={t('admin.occupation.notesPlaceholder')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline resize-none"
            />
          </div>
          <SelectField
            label={t('admin.occupation.occupationGroup')}
            id="occ-group"
            options={groupOptions}
            placeholder={t('admin.occupation.selectGroup')}
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
            {isSubmitting ? t('common.creating') : t('admin.occupation.createOccupation')}
          </button>
        </form>
      )}

      {/* Search + Filters */}
      {!loading && (
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-grow min-w-[200px]">
            <SearchBar
              id="occ-search"
              value={search}
              onChange={v => { setSearch(v); setPage(1) }}
              placeholder={t('admin.occupation.searchOccupations')}
            />
          </div>
          <div className="w-56">
            <SelectField
              id="filter-group"
              options={groupOptions}
              placeholder={t('admin.occupation.allGroups')}
              value={filterGroupId}
              onChange={val => { setFilterGroupId(val); setPage(1) }}
            />
          </div>
          <div className="w-48">
            <SelectField
              id="filter-level"
              options={levelOptions}
              placeholder={t('admin.occupation.allLevels')}
              value={filterLevel}
              onChange={val => { setFilterLevel(val); setPage(1) }}
            />
          </div>
          {(search || filterGroupId || filterLevel) && (
            <button
              onClick={() => { setSearch(''); setFilterGroupId(''); setFilterLevel(''); setPage(1) }}
              className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 cursor-pointer flex items-center gap-1 uppercase tracking-wider pb-2 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list_off</span>
              {t('common.clear')}
            </button>
          )}
        </div>
      )}

      {/* Table + Detail panel */}
      <div className="flex gap-6">
        {/* Table */}
        <div className={`flex-grow min-w-0 ${selected ? 'hidden lg:block' : ''}`}>
          {loading ? (
            <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
              {t('common.loading')}
            </span>
          ) : filtered.length === 0 ? (
            <div className="border border-outline-variant rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-outline text-[48px] mb-4 block">work</span>
              <p className="font-poppins text-body-md text-on-surface-variant">
                {t('admin.occupation.notFound')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low">
                      <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                        {t('admin.occupation.title')}
                      </th>
                      <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3 w-20">
                        {t('admin.occupation.level')}
                      </th>
                      <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                        {t('admin.occupation.group')}
                      </th>
                      <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3 w-20">
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(o => (
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
                            {t('common.delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length > PER_PAGE && (
                <Pagination
                  total={filtered.length}
                  page={safeOccPage}
                  perPage={PER_PAGE}
                  onPageChange={setPage}
                />
              )}
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
                  label={t('admin.occupation.title')}
                  id="edit-title"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
                <SelectField
                  label={t('admin.occupation.level')}
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
                    {t('admin.occupation.definition')}
                  </label>
                  <textarea
                    id="edit-definition"
                    value={editDefinition}
                    onChange={e => setEditDefinition(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-unit">
                  <label
                    className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
                    htmlFor="edit-tasks"
                  >
                    {t('admin.occupation.tasksInclude')}
                  </label>
                  <textarea
                    id="edit-tasks"
                    value={editTasksInclude}
                    onChange={e => setEditTasksInclude(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-unit">
                  <label
                    className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
                    htmlFor="edit-included"
                  >
                    {t('admin.occupation.includedOccupations')}
                  </label>
                  <textarea
                    id="edit-included"
                    value={editIncludedOccupations}
                    onChange={e => setEditIncludedOccupations(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-unit">
                  <label
                    className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
                    htmlFor="edit-excluded"
                  >
                    {t('admin.occupation.excludedOccupations')}
                  </label>
                  <textarea
                    id="edit-excluded"
                    value={editExcludedOccupations}
                    onChange={e => setEditExcludedOccupations(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-unit">
                  <label
                    className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
                    htmlFor="edit-notes"
                  >
                    {t('admin.occupation.notes')}
                  </label>
                  <textarea
                    id="edit-notes"
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 resize-none"
                  />
                </div>
                <SelectField
                  label={t('admin.occupation.occupationGroup')}
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
                    {isSaving ? t('common.saving') : t('admin.occupation.saveChanges')}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="font-poppins text-label-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300 cursor-pointer uppercase tracking-wider"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-6 p-6 flex-grow overflow-y-auto">
                <div className="flex flex-col gap-1">
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">{t('admin.occupation.level')}</span>
                  <span className="font-poppins text-body-md text-on-surface">
                    {selected.level} — {t(`admin.level.${selected.level}`)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">{t('admin.occupation.group')}</span>
                  <span className="font-poppins text-body-md text-on-surface">
                    {selected.group.name}
                  </span>
                  <span className="font-poppins text-label-sm text-on-surface-variant">
                    {t('admin.occupation.skillLevel', { level: selected.group.skill_level })}
                  </span>
                </div>
                {selected.definition && (
                  <div className="flex flex-col gap-1">
                    <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">{t('admin.occupation.definition')}</span>
                    <p className="font-poppins text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                      {selected.definition}
                    </p>
                  </div>
                )}
                {selected.tasks_include && (
                  <div className="flex flex-col gap-1">
                    <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">Tasks Include</span>
                    <p className="font-poppins text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                      {selected.tasks_include}
                    </p>
                  </div>
                )}
                {selected.included_occupations && (
                  <div className="flex flex-col gap-1">
                    <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">Included Occupations</span>
                    <p className="font-poppins text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                      {selected.included_occupations}
                    </p>
                  </div>
                )}
                {selected.excluded_occupations && (
                  <div className="flex flex-col gap-1">
                    <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">Excluded Occupations</span>
                    <p className="font-poppins text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                      {selected.excluded_occupations}
                    </p>
                  </div>
                )}
                {selected.notes && (
                  <div className="flex flex-col gap-1">
                    <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">Notes</span>
                    <p className="font-poppins text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                      {selected.notes}
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">{t('admin.occupation.created')}</span>
                  <span className="font-poppins text-body-md text-on-surface-variant">
                    {new Date(selected.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">{t('admin.occupation.updated')}</span>
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
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="font-poppins text-label-sm text-error hover:text-on-error-container transition-colors duration-300 cursor-pointer uppercase tracking-wider flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    {t('common.delete')}
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
          {t('common.backToList')}
        </button>
      )}
    </div>
  )
}

function EducationSection() {
  const { t } = useTranslation()
  const [levels, setLevels] = useState<EducationLevelType[]>([])
  const [iscedLevels, setIscedLevels] = useState<IscedLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iscedLevelId, setIscedLevelId] = useState('')

  async function loadData() {
    const [levelsRes, iscedRes] = await Promise.all([listEducationLevels(), listIscedLevels()])
    if (levelsRes.data) setLevels(levelsRes.data)
    if (iscedRes.data) setIscedLevels(iscedRes.data)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) { setFormError(t('validation.nameRequired')); return }
    if (!iscedLevelId) { setFormError(t('admin.education.selectIscedLevelRequired')); return }

    setIsSubmitting(true)
    const result = await createEducationLevel({
      name: name.trim(),
      description: description.trim() || null,
      isced_level_id: parseInt(iscedLevelId),
    })

    if (result.data) {
      setName('')
      setDescription('')
      setIscedLevelId('')
      setShowForm(false)
      await loadData()
    } else {
      setFormError(result.error || t('api.failedToCreateEducationLevel'))
    }
    setIsSubmitting(false)
  }

  async function handleDelete(id: number) {
    const result = await deleteEducationLevel(id)
    if (result.status === 204 || result.data !== undefined) {
      await loadData()
    }
  }

  const iscedOptions = iscedLevels.map(l => ({
    value: String(l.id),
    label: `Level ${l.level} — ${l.name}`,
  }))

  const q = search.toLowerCase()
  const filtered = q
    ? levels.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        l.isced_level.name.toLowerCase().includes(q)
      )
    : levels

  const PER_PAGE = 20
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="font-poppins text-h1 text-on-surface">{t('admin.education')}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="font-poppins text-label-sm bg-primary text-on-primary px-6 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? t('common.cancel') : t('admin.education.addLevel')}
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
            label="Name"
            id="edu-name"
            placeholder={t('admin.education.namePlaceholder')}
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <div className="flex flex-col gap-unit">
            <label
              className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
              htmlFor="edu-description"
            >
              Description
            </label>
            <textarea
              id="edu-description"
              placeholder={t('admin.education.descriptionPlaceholder')}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline resize-none"
            />
          </div>
          <SelectField
            label="ISCED Level"
            id="edu-isced"
            options={iscedOptions}
            placeholder={t('admin.education.selectIscedLevel')}
            value={iscedLevelId}
            onChange={setIscedLevelId}
          />
          {iscedLevelId && (
            <div className="flex items-center gap-unit">
              <span className="material-symbols-outlined text-primary text-[14px]">check_circle</span>
              <span className="font-poppins text-label-sm text-primary">
                {iscedLevels.find(l => String(l.id) === iscedLevelId)?.name}
              </span>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="self-start font-poppins text-label-sm bg-primary text-on-primary px-6 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? t('common.creating') : t('admin.education.createLevel')}
          </button>
        </form>
      )}

      {/* Search */}
      {!loading && (
        <SearchBar
          id="edu-search"
          value={search}
          onChange={v => { setSearch(v); setPage(1) }}
          placeholder={t('admin.education.searchLevels')}
        />
      )}

      {/* Table */}
      {loading ? (
        <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
          {t('common.loading')}
        </span>
      ) : filtered.length === 0 ? (
        <div className="border border-outline-variant rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-outline text-[48px] mb-4 block">school</span>
          <p className="font-poppins text-body-md text-on-surface-variant">
            {levels.length === 0 ? t('admin.education.noLevels') : t('admin.education.noSearchResults')}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                    Name
                  </th>
                  <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                    Description
                  </th>
                  <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3">
                    ISCED Level
                  </th>
                  <th className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider px-6 py-3 w-20">
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map(l => (
                  <tr key={l.id} className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors duration-300 group">
                    <td className="px-6 py-4 font-medium">{l.name}</td>
                    <td className="px-6 py-4 text-on-surface-variant max-w-xs truncate">
                      {l.description || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-poppins text-label-sm bg-surface-container text-on-surface-variant px-3 py-1 rounded-default">
                        L{l.isced_level.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(l.id)}
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
          {filtered.length > PER_PAGE && (
            <Pagination
              total={filtered.length}
              page={safePage}
              perPage={PER_PAGE}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// World-atlas uses ISO 3166-1 numeric codes as geometry IDs.
// Map them to the alpha-2 codes stored in our DB.
const NUMERIC_TO_ALPHA2: Record<string, string> = {
  '004': 'AF', '008': 'AL', '012': 'DZ', '024': 'AO', '032': 'AR',
  '036': 'AU', '040': 'AT', '048': 'BH', '050': 'BD', '051': 'AM',
  '056': 'BE', '064': 'BT', '068': 'BO', '070': 'BA', '072': 'BW',
  '076': 'BR', '096': 'BN', '100': 'BG', '104': 'MM', '108': 'BI',
  '112': 'BY', '116': 'KH', '120': 'CM', '124': 'CA', '140': 'CF',
  '144': 'LK', '148': 'TD', '152': 'CL', '156': 'CN', '170': 'CO',
  '178': 'CG', '180': 'CD', '188': 'CR', '191': 'HR', '192': 'CU',
  '196': 'CY', '203': 'CZ', '204': 'BJ', '208': 'DK', '214': 'DO',
  '218': 'EC', '222': 'SV', '226': 'GQ', '231': 'ET', '232': 'ER',
  '233': 'EE', '242': 'FJ', '246': 'FI', '250': 'FR', '266': 'GA',
  '270': 'GM', '268': 'GE', '276': 'DE', '288': 'GH', '300': 'GR',
  '320': 'GT', '324': 'GN', '328': 'GY', '332': 'HT', '340': 'HN',
  '348': 'HU', '352': 'IS', '356': 'IN', '360': 'ID', '364': 'IR',
  '368': 'IQ', '372': 'IE', '376': 'IL', '380': 'IT', '384': 'CI',
  '388': 'JM', '392': 'JP', '400': 'JO', '398': 'KZ', '404': 'KE',
  '408': 'KP', '410': 'KR', '414': 'KW', '417': 'KG', '418': 'LA',
  '422': 'LB', '426': 'LS', '428': 'LV', '430': 'LR', '434': 'LY',
  '440': 'LT', '442': 'LU', '450': 'MG', '454': 'MW', '458': 'MY',
  '466': 'ML', '478': 'MR', '484': 'MX', '496': 'MN', '498': 'MD',
  '499': 'ME', '504': 'MA', '508': 'MZ', '512': 'OM', '516': 'NA',
  '524': 'NP', '528': 'NL', '540': 'NC', '548': 'VU', '554': 'NZ',
  '558': 'NI', '562': 'NE', '566': 'NG', '586': 'PK', '591': 'PA',
  '598': 'PG', '600': 'PY', '604': 'PE', '608': 'PH', '616': 'PL',
  '620': 'PT', '630': 'PR', '634': 'QA', '642': 'RO', '643': 'RU',
  '646': 'RW', '682': 'SA', '686': 'SN', '688': 'RS', '694': 'SL',
  '702': 'SG', '703': 'SK', '704': 'VN', '705': 'SI', '706': 'SO',
  '710': 'ZA', '716': 'ZW', '724': 'ES', '728': 'SS', '729': 'SD',
  '740': 'SR', '748': 'SZ', '752': 'SE', '756': 'CH', '760': 'SY',
  '762': 'TJ', '764': 'TH', '768': 'TG', '772': 'TO', '780': 'TT',
  '784': 'AE', '788': 'TN', '792': 'TR', '795': 'TM', '800': 'UG',
  '804': 'UA', '807': 'MK', '818': 'EG', '826': 'GB', '834': 'TZ',
  '840': 'US', '854': 'BF', '858': 'UY', '860': 'UZ', '862': 'VE',
  '887': 'YE', '894': 'ZM', '900': 'XK',
  // Additional common mappings
  '010': 'AQ', '031': 'AZ', '044': 'BS', '052': 'BB', '060': 'BM',
  '084': 'BZ', '090': 'SB', '132': 'CV', '136': 'KY', '146': 'CX',
  '162': 'CC', '166': 'CK', '174': 'KM', '184': 'CK', '234': 'FO',
  '238': 'FK', '241': 'GF', '254': 'GP', '258': 'PF', '260': 'TF',
  '275': 'PS', '304': 'GL', '308': 'GD', '312': 'GP', '316': 'GU',
  '334': 'HM', '336': 'VA', '374': 'IM', '438': 'LI', '470': 'MT',
  '474': 'MQ', '500': 'MS', '520': 'NR', '531': 'CW', '533': 'AW',
  '534': 'SX', '535': 'BQ', '544': 'NU', '556': 'NF', '574': 'MP',
  '578': 'NO', '580': 'UM', '581': 'UM', '583': 'FM', '584': 'MH',
  '585': 'PW', '596': 'ST', '612': 'PN', '624': 'GW', '626': 'TL',
  '652': 'BL', '654': 'SH', '659': 'KN', '660': 'AI', '662': 'LC',
  '663': 'MF', '666': 'PM', '670': 'VC', '674': 'SM', '678': 'ST',
  '680': 'EH', '690': 'SC', '700': 'GS', '718': 'LC', '732': 'EH',
  '744': 'SJ', '761': 'TJ', '776': 'WS', '796': 'TC', '798': 'TV',
  '808': 'MK', '831': 'GG', '832': 'JE', '833': 'IM',
}

function LanguagesSection() {
  const { t } = useTranslation()
  const [countries, setCountries] = useState<Country[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedCountry, setSelectedCountry] = useState<CountryWithLanguages | null>(null)
  const [countryLanguages, setCountryLanguages] = useState<LanguageBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPanel, setLoadingPanel] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [addSearchResults, setAddSearchResults] = useState<Language[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [countriesRes, languagesRes] = await Promise.all([listCountries(), listLanguages()])
      if (countriesRes.data) setCountries(countriesRes.data)
      if (languagesRes.data) setLanguages(languagesRes.data)
      setLoading(false)
    }
    load()
  }, [])

  // Build a quick lookup: alpha2 -> country
  const countryByAlpha2 = new Map<string, Country>()
  for (const c of countries) {
    countryByAlpha2.set(c.code.toUpperCase(), c)
  }

  async function selectCountry(country: Country) {
    setLoadingPanel(true)
    setSelectedCountry(null)
    setCountryLanguages([])
    setError('')
    setAddSearch('')
    setAddSearchResults([])

    const [countryRes, langRes] = await Promise.all([getCountry(country.id), getCountryLanguages(country.id)])
    if (countryRes.data) setSelectedCountry(countryRes.data)
    if (langRes.data) setCountryLanguages(langRes.data)
    setLoadingPanel(false)
  }

  function closePanel() {
    setSelectedCountry(null)
    setCountryLanguages([])
    setError('')
  }

  async function handleAddLanguage(language: Language) {
    if (!selectedCountry) return
    const result = await addLanguageToCountry(selectedCountry.id, language.id)
    if (result.error) {
      setError(result.error)
    } else {
      setCountryLanguages(prev => [...prev, { id: language.id, code: language.code, name: language.name }])
      setAddSearch('')
      setAddSearchResults([])
    }
  }

  async function handleRemoveLanguage(languageId: number) {
    if (!selectedCountry) return
    const result = await removeLanguageFromCountry(selectedCountry.id, languageId)
    if (result.status === 204 || !result.error) {
      setCountryLanguages(prev => prev.filter(l => l.id !== languageId))
    } else {
      setError(result.error || 'Failed to remove language')
    }
  }

  useEffect(() => {
    if (!addSearch.trim()) {
      setAddSearchResults([])
      return
    }
    const q = addSearch.toLowerCase()
    const filtered = languages
      .filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
      )
      .filter(l => !countryLanguages.some(cl => cl.id === l.id))
      .slice(0, 10)
    setAddSearchResults(filtered)
  }, [addSearch, languages, countryLanguages])

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-poppins text-h1 text-on-surface">{t('admin.languages')}</h2>

      {loading ? (
        <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
          {t('common.loading')}
        </span>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* World Map */}
          <div className={`flex-grow ${selectedCountry ? 'hidden lg:block' : ''}`}>
            <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
              <ComposableMap projectionConfig={{ scale: 140 }}>
                <ZoomableGroup center={[0, 0]} zoom={1} minZoom={1} maxZoom={4}>
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map(geo => {
                        const numericCode = geo.id?.toString()?.padStart(3, '0')
                        const alpha2 = NUMERIC_TO_ALPHA2[numericCode] ?? ''
                        const countryData = alpha2 ? countryByAlpha2.get(alpha2) : undefined
                        const hasLanguages = countryData && selectedCountry?.id === countryData.id

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            onClick={() => countryData && selectCountry(countryData)}
                            style={{
                              default: {
                                fill: hasLanguages ? '#1a1c1c' : countryData ? '#747878' : '#c4c7c7',
                                stroke: '#f9f9f9',
                                strokeWidth: 0.5,
                                outline: 'none',
                              },
                              hover: {
                                fill: countryData ? '#000000' : '#c4c7c7',
                                stroke: '#f9f9f9',
                                strokeWidth: 0.5,
                                outline: 'none',
                                cursor: countryData ? 'pointer' : 'default',
                              },
                              pressed: {
                                fill: countryData ? '#5e5e5e' : '#c4c7c7',
                                stroke: '#f9f9f9',
                                strokeWidth: 0.5,
                                outline: 'none',
                              },
                            }}
                          />
                        )
                      })
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
            </div>
            <p className="font-poppins text-label-sm text-on-surface-variant mt-4 text-center">
              {t('admin.languages.mapHint')}
            </p>
          </div>

          {/* Country Detail Panel */}
          {selectedCountry && (
            <div className="w-full lg:w-96 flex-shrink-0 border border-outline-variant rounded-xl bg-surface-container-lowest overflow-hidden flex flex-col">
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
                <div className="flex flex-col min-w-0">
                  <span className="font-poppins text-body-md font-medium truncate">
                    {selectedCountry.name}
                  </span>
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                    {selectedCountry.area}
                  </span>
                </div>
                <button
                  onClick={closePanel}
                  className="font-poppins text-on-surface-variant hover:text-on-surface transition-colors duration-300 cursor-pointer flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Panel body */}
              <div className="flex flex-col gap-5 p-6 flex-grow overflow-y-auto">
                {error && (
                  <p className="font-poppins text-label-sm text-error">{error}</p>
                )}

                {/* Language search for adding */}
                <div className="flex flex-col gap-unit">
                  <label className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                    {t('admin.languages.addLanguage')}
                  </label>
                  <input
                    type="text"
                    value={addSearch}
                    onChange={e => setAddSearch(e.target.value)}
                    placeholder={t('admin.languages.searchPlaceholder')}
                    className="w-full bg-transparent border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline"
                  />
                  {addSearchResults.length > 0 && (
                    <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest max-h-48 overflow-y-auto">
                      {addSearchResults.map(l => (
                        <button
                          key={l.id}
                          onClick={() => handleAddLanguage(l)}
                          className="w-full text-left px-4 py-2 hover:bg-surface-container transition-colors duration-300 cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-poppins text-body-md text-on-surface">{l.name}</span>
                          <span className="font-poppins text-label-sm text-on-surface-variant">{l.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current languages */}
                <div className="flex flex-col gap-unit">
                  <label className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                    {t('admin.languages.languages')} ({countryLanguages.length})
                  </label>
                  {loadingPanel ? (
                    <span className="font-poppins text-label-sm text-on-surface-variant">{t('common.loading')}</span>
                  ) : countryLanguages.length === 0 ? (
                    <p className="font-poppins text-body-md text-on-surface-variant">
                      {t('admin.languages.noLanguages')}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {countryLanguages.map(l => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between px-4 py-2 border border-outline-variant rounded-xl group"
                        >
                          <div className="flex flex-col">
                            <span className="font-poppins text-body-md text-on-surface">{l.name}</span>
                            <span className="font-poppins text-label-sm text-on-surface-variant">{l.code}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveLanguage(l.id)}
                            className="opacity-0 group-hover:opacity-100 font-poppins text-label-sm text-error hover:text-on-error-container transition-opacity duration-300 cursor-pointer uppercase tracking-wider"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile back button */}
      {selectedCountry && (
        <button
          onClick={closePanel}
          className="lg:hidden font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 cursor-pointer flex items-center gap-1 uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          {t('common.backToMap')}
        </button>
      )}
    </div>
  )
}
