import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { getProfile, updateProfile, listCountries, listLanguages, type Country, type Language } from '../api/profile'
import { listEducationLevels, type EducationLevel } from '../api/educationLevels'
import { classifyLocation } from '../api/settlements'
import { listWorkExperiences, createWorkExperience, updateWorkExperience, deleteWorkExperience, type WorkExperience } from '../api/workExperiences'
import Footer from '../components/Footer'

const TOTAL_STEPS = 7

const SETTLEMENT_TYPES = [
  { value: 'urban', label: 'Urban' },
  { value: 'suburban', label: 'Suburban' },
  { value: 'rural', label: 'Rural' },
] as const

const POPULAR_LANG_CODES = ['eng', 'spa', 'fra', 'deu', 'por', 'rus', 'ara', 'zho', 'hin', 'jpn']

interface GeoSuggestion {
  display_name: string
  lat: string
  lon: string
  name?: string
}

export default function Onboarding() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [dob, setDob] = useState('')
  const [country, setCountry] = useState('')
  const [countryName, setCountryName] = useState('')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [settlementType, setSettlementType] = useState<string | null>(null)
  const [educationLevelId, setEducationLevelId] = useState<number | null>(null)
  const [selectedLangIds, setSelectedLangIds] = useState<number[]>([])

  // Work experience
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([])
  const [showExpForm, setShowExpForm] = useState(false)
  const [editingExpId, setEditingExpId] = useState<number | null>(null)
  const [expJobTitle, setExpJobTitle] = useState('')
  const [expCompany, setExpCompany] = useState('')
  const [expIndustry, setExpIndustry] = useState('')
  const [expStartDate, setExpStartDate] = useState('')
  const [expEndDate, setExpEndDate] = useState('')
  const [expIsCurrent, setExpIsCurrent] = useState(false)

  // Informal work
  const [informalWork, setInformalWork] = useState('')

  // Self-taught skills
  const [selfTaughtSkills, setSelfTaughtSkills] = useState('')

  // Reference data
  const [countries, setCountries] = useState<Country[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([])
  const [countrySearch, setCountrySearch] = useState('')
  const [languageSearch, setLanguageSearch] = useState('')
  const [detectingLocation, setDetectingLocation] = useState(false)

  // Geo search state
  const [regionSuggestions, setRegionSuggestions] = useState<GeoSuggestion[]>([])
  const [citySuggestions, setCitySuggestions] = useState<GeoSuggestion[]>([])
  const [regionSearching, setRegionSearching] = useState(false)
  const [citySearching, setCitySearching] = useState(false)
  const [showRegionSuggestions, setShowRegionSuggestions] = useState(false)
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const regionTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const cityTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [classifyingPlace, setClassifyingPlace] = useState(false)

  useEffect(() => {
    async function load() {
      const [profileRes, countriesRes, langsRes, eduRes, expRes] = await Promise.all([
        getProfile(),
        listCountries(),
        listLanguages(),
        listEducationLevels(),
        listWorkExperiences(),
      ])
      if (profileRes.data) {
        const p = profileRes.data
        setStep(p.current_step || 1)
        setDob(p.date_of_birth ?? '')
        setCountry(p.country ?? '')
        setCountryName('') // derived below after countries load
        setRegion(p.region ?? '')
        setCity(p.city ?? '')
        setLatitude(p.latitude)
        setLongitude(p.longitude)
        setSettlementType(p.settlement_type)
        setEducationLevelId(p.education_level_id)
        setInformalWork(p.informal_work ?? '')
        setSelfTaughtSkills(p.self_taught_skills ?? '')
        setSelectedLangIds(p.language_ids ?? [])
      }
      if (countriesRes.data) {
        setCountries(countriesRes.data)
        // Restore countryName from loaded countries if a country code is saved
        if (country) {
          const match = countriesRes.data.find(c => c.code === country)
          if (match) setCountryName(match.name)
        }
      }
      if (langsRes.data) setLanguages(langsRes.data)
      if (eduRes.data) setEducationLevels(eduRes.data)
      if (expRes.data) setWorkExperiences(expRes.data)
      setLoading(false)
    }
    load()
  }, [])

  async function saveStep(stepNum: number, data: Record<string, unknown>) {
    setSaving(true)
    setError('')
    const res = await updateProfile({ ...data, current_step: stepNum })
    if (!res.data) {
      setError(res.error || t('api.failedToSave'))
      setSaving(false)
      return false
    }
    setSaving(false)
    return true
  }

  async function handleNext() {
    if (step === 1) {
      const ok = await saveStep(2, { date_of_birth: dob || null })
      if (ok) setStep(2)
    } else if (step === 2) {
      const ok = await saveStep(3, {
        country: country || null,
        region: region || null,
        city: city || null,
        latitude,
        longitude,
        settlement_type: settlementType,
      })
      if (ok) setStep(3)
    } else if (step === 3) {
      const ok = await saveStep(4, { education_level_id: educationLevelId })
      if (ok) setStep(4)
    } else if (step === 4) {
      // Work experience is optional — always proceed
      setStep(5)
    } else if (step === 5) {
      const ok = await saveStep(6, { informal_work: informalWork || null })
      if (ok) setStep(6)
    } else if (step === 6) {
      const ok = await saveStep(7, { self_taught_skills: selfTaughtSkills || null })
      if (ok) setStep(7)
    }
  }

  async function handleBack() {
    if (step > 1) setStep(step - 1)
  }

  async function handleComplete() {
    setSaving(true)
    setError('')
    const res = await updateProfile({
      language_ids: selectedLangIds,
      informal_work: informalWork || null,
      self_taught_skills: selfTaughtSkills || null,
      is_complete: true,
      current_step: 7,
    })
    if (res.data) {
      navigate('/career-assistant', { replace: true })
    } else {
      setError(res.error || t('api.failedToCompleteProfile'))
    }
    setSaving(false)
  }

  async function handleDetectLocation() {
    if (!navigator.geolocation) { setError(t('onboarding.geoNotSupported')); return }
    setDetectingLocation(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLatitude(lat)
        setLongitude(lng)

        // Classify settlement type
        const classifyRes = await classifyLocation(lat, lng)
        if (classifyRes.data) {
          setSettlementType(classifyRes.data.settlement_type)
        }

        // Reverse geocode for country/city
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await resp.json()
          if (data.address) {
            const addr = data.address
            if (addr.country) {
              const match = countries.find(c => c.name === addr.country)
              if (match) setCountry(match.code)
              else setCountry(addr.country)
            }
            if (addr.state || addr.region) setRegion(addr.state || addr.region || '')
            if (addr.city || addr.town || addr.village) {
              setCity(addr.city || addr.town || addr.village || '')
            }
          }
        } catch {
          // Reverse geocoding failed, user can fill manually
        }
        setDetectingLocation(false)
      },
      () => {
        setError(t('onboarding.locationDenied'))
        setDetectingLocation(false)
      },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }

  // Debounced Nominatim search for regions/admin areas within selected country
  const searchRegion = useCallback((query: string) => {
    if (regionTimerRef.current) clearTimeout(regionTimerRef.current)
    if (!query.trim() || !countryName) { setRegionSuggestions([]); setShowRegionSuggestions(false); return }
    regionTimerRef.current = setTimeout(async () => {
      setRegionSearching(true)
      try {
        const params = new URLSearchParams({
          q: query,
          countrycodes: countryName.toLowerCase(),
          format: 'json',
          limit: '6',
          addressdetails: '1',
        })
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { 'Accept-Language': 'en' },
        })
        const data = await resp.json()
        setRegionSuggestions(data.map((item: { display_name: string; lat: string; lon: string }) => ({
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
        })))
        setShowRegionSuggestions(true)
      } catch {
        setRegionSuggestions([])
      }
      setRegionSearching(false)
    }, 400)
  }, [countryName])

  // Debounced Nominatim search for cities within selected country
  const searchCity = useCallback((query: string) => {
    if (cityTimerRef.current) clearTimeout(cityTimerRef.current)
    if (!query.trim() || !countryName) { setCitySuggestions([]); setShowCitySuggestions(false); return }
    cityTimerRef.current = setTimeout(async () => {
      setCitySearching(true)
      try {
        const params = new URLSearchParams({
          q: query,
          countrycodes: countryName.toLowerCase(),
          format: 'json',
          limit: '6',
        })
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { 'Accept-Language': 'en' },
        })
        const data = await resp.json()
        setCitySuggestions(data.map((item: { display_name: string; lat: string; lon: string }) => ({
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
        })))
        setShowCitySuggestions(true)
      } catch {
        setCitySuggestions([])
      }
      setCitySearching(false)
    }, 400)
  }, [countryName])

  // Classify settlement type from coordinates
  async function classifySettlementFromCoords(lat: number, lng: number) {
    setClassifyingPlace(true)
    try {
      const classifyRes = await classifyLocation(lat, lng)
      if (classifyRes.data) {
        setSettlementType(classifyRes.data.settlement_type)
      }
    } catch {
      // Could not classify — user can pick manually
    }
    setClassifyingPlace(false)
  }

  // Pick a region suggestion and auto-classify
  function pickRegion(suggestion: GeoSuggestion) {
    setRegion(suggestion.display_name)
    setShowRegionSuggestions(false)
    setRegionSuggestions([])
    classifySettlementFromCoords(parseFloat(suggestion.lat), parseFloat(suggestion.lon))
  }

  // Pick a city suggestion and auto-classify
  function pickCity(suggestion: GeoSuggestion) {
    setCity(suggestion.display_name)
    setShowCitySuggestions(false)
    setCitySuggestions([])
    classifySettlementFromCoords(parseFloat(suggestion.lat), parseFloat(suggestion.lon))
  }

  // Work experience helpers
  function resetExpForm() {
    setShowExpForm(false)
    setEditingExpId(null)
    setExpJobTitle('')
    setExpCompany('')
    setExpIndustry('')
    setExpStartDate('')
    setExpEndDate('')
    setExpIsCurrent(false)
  }

  function startAddExperience() {
    resetExpForm()
    setShowExpForm(true)
  }

  function startEditExperience(exp: WorkExperience) {
    setEditingExpId(exp.id)
    setExpJobTitle(exp.job_title || '')
    setExpCompany(exp.company || '')
    setExpIndustry(exp.industry || '')
    setExpStartDate(exp.start_date || '')
    setExpEndDate(exp.end_date || '')
    setExpIsCurrent(exp.is_current)
    setShowExpForm(true)
  }

  async function handleSaveExperience() {
    if (!expJobTitle.trim()) return
    const payload = {
      job_title: expJobTitle || null,
      company: expCompany || null,
      industry: expIndustry || null,
      start_date: expStartDate || null,
      end_date: expIsCurrent ? null : (expEndDate || null),
      is_current: expIsCurrent,
    }
    if (editingExpId) {
      const res = await updateWorkExperience(editingExpId, payload)
      if (res.data) {
        const refreshed = await listWorkExperiences()
        if (refreshed.data) setWorkExperiences(refreshed.data)
      }
    } else {
      const res = await createWorkExperience(payload)
      if (res.data) {
        const refreshed = await listWorkExperiences()
        if (refreshed.data) setWorkExperiences(refreshed.data)
      }
    }
    resetExpForm()
  }

  async function handleDeleteExperience(id: number) {
    await deleteWorkExperience(id)
    const refreshed = await listWorkExperiences()
    if (refreshed.data) setWorkExperiences(refreshed.data)
  }

  if (loading) {
    return (
      <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
        <main className="flex-grow flex items-center justify-center">
          <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider animate-pulse">
            {t('common.loading')}
          </span>
        </main>
      </div>
    )
  }

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  const filteredCountries = countrySearch
    ? countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    : countries

  const filteredLanguages = languageSearch
    ? languages.filter(l => l.name.toLowerCase().includes(languageSearch.toLowerCase()))
    : languages

  const popularLangs = languages.filter(l => POPULAR_LANG_CODES.includes(l.code))

  const canProceed = step === 1
    ? true
    : step === 2
      ? !!settlementType
      : step === 3
        ? !!educationLevelId
        : step === 4
          ? true // work experience is optional
          : step === 5
            ? true // informal work is optional
            : step === 6
              ? true // self-taught skills is optional
              : selectedLangIds.length > 0

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-poppins text-body-md">
      {/* Progress bar */}
      <div className="w-full h-1 bg-surface-container">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  i + 1 <= step ? 'bg-primary' : 'bg-outline-variant'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 border border-error/30 rounded-xl bg-error-container">
              <p className="font-poppins text-label-sm text-error">{error}</p>
            </div>
          )}

          {/* Step 1: Welcome + DOB */}
          {step === 1 && (
            <div className="flex flex-col gap-8">
              <div className="text-center">
                <h1 className="font-poppins text-h1 text-on-surface">
                  {t('onboarding.welcome')}
                </h1>
                <p className="font-poppins text-body-lg text-on-surface-variant mt-2">
                  {t('onboarding.subtitle')}
                </p>
              </div>
              <div className="flex flex-col gap-unit">
                <label className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {t('onboarding.dateOfBirth')}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-3 text-on-surface text-body-lg focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300"
                />
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-poppins text-h1 text-on-surface">
                  {t('onboarding.location')}
                </h1>
                <p className="font-poppins text-body-md text-on-surface-variant mt-2">
                  {t('onboarding.locationSubtitle')}
                </p>
              </div>

              <button
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-outline-variant rounded-xl font-poppins text-label-sm uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary transition-colors duration-300 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${detectingLocation ? 'animate-spin' : ''}`}>
                  {detectingLocation ? 'progress_activity' : 'my_location'}
                </span>
                {detectingLocation ? t('onboarding.detecting') : t('onboarding.useMyLocation')}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-grow h-px bg-outline-variant" />
                <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {t('onboarding.or')}
                </span>
                <div className="flex-grow h-px bg-outline-variant" />
              </div>

              {/* Country */}
              <div className="flex flex-col gap-unit">
                <label className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {t('onboarding.country')}
                </label>
                <input
                  type="text"
                  value={countrySearch || country}
                  onChange={e => { setCountrySearch(e.target.value); setCountry('') }}
                  onFocus={() => setCountrySearch(countrySearch || country)}
                  placeholder={t('onboarding.searchCountry')}
                  className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline"
                />
                {countrySearch && !country && (
                  <div className="border border-outline-variant rounded-xl max-h-48 overflow-y-auto mt-1">
                    {filteredCountries.slice(0, 20).map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setCountry(c.code); setCountryName(c.name); setCountrySearch('') }}
                        className="w-full text-left px-4 py-2 hover:bg-surface-container transition-colors duration-200 cursor-pointer font-poppins text-body-sm"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
                {country && (
                  <span className="font-poppins text-label-sm text-primary mt-1">
                    {countries.find(c => c.code === country)?.name || country}
                  </span>
                )}
              </div>

              {/* Region */}
              <div className="flex flex-col gap-unit relative">
                <label className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {t('onboarding.region')}
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={e => { setRegion(e.target.value); searchRegion(e.target.value) }}
                  onFocus={() => { if (region.trim() && countryName) searchRegion(region) }}
                  placeholder={t('onboarding.regionPlaceholder')}
                  className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline"
                />
                {classifyingPlace && (
                  <span className="font-poppins text-label-sm text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                    {t('onboarding.detectingSettlement')}
                  </span>
                )}
                {showRegionSuggestions && regionSuggestions.length > 0 && (
                  <div className="border border-outline-variant rounded-xl max-h-48 overflow-y-auto mt-1 bg-surface shadow-lg z-10">
                    {regionSuggestions.map((s, i) => (
                      <button
                        key={s.lat + s.lon + i}
                        onClick={() => pickRegion(s)}
                        className="w-full text-left px-4 py-2 hover:bg-surface-container transition-colors duration-200 cursor-pointer font-poppins text-body-sm text-on-surface"
                      >
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
                {regionSearching && (
                  <span className="font-poppins text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                    {t('onboarding.searching')}
                  </span>
                )}
              </div>

              {/* City */}
              <div className="flex flex-col gap-unit relative">
                <label className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {t('onboarding.city')}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={e => { setCity(e.target.value); searchCity(e.target.value) }}
                  onFocus={() => { if (city.trim() && countryName) searchCity(city) }}
                  placeholder={t('onboarding.cityPlaceholder')}
                  className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline"
                />
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="border border-outline-variant rounded-xl max-h-48 overflow-y-auto mt-1 bg-surface shadow-lg z-10">
                    {citySuggestions.map((s, i) => (
                      <button
                        key={s.lat + s.lon + i}
                        onClick={() => pickCity(s)}
                        className="w-full text-left px-4 py-2 hover:bg-surface-container transition-colors duration-200 cursor-pointer font-poppins text-body-sm text-on-surface"
                      >
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
                {citySearching && (
                  <span className="font-poppins text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                    {t('onboarding.searching')}
                  </span>
                )}
              </div>

              {/* Settlement type pills */}
              <div className="flex flex-col gap-2">
                <label className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {t('onboarding.settlementType')}
                </label>
                <div className="flex gap-3">
                  {SETTLEMENT_TYPES.map(st => (
                    <button
                      key={st.value}
                      onClick={() => setSettlementType(st.value)}
                      className={`flex-1 px-4 py-3 rounded-xl font-poppins text-label-sm uppercase tracking-wider transition-all duration-300 cursor-pointer border ${
                        settlementType === st.value
                          ? 'bg-primary text-on-primary border-primary'
                          : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
                {settlementType && latitude !== null && (
                  <span className="font-poppins text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[14px]">check_circle</span>
                    {t('onboarding.detected')}: {settlementType}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Education */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-poppins text-h1 text-on-surface">
                  {t('onboarding.education')}
                </h1>
                <p className="font-poppins text-body-md text-on-surface-variant mt-2">
                  {t('onboarding.educationSubtitle')}
                </p>
              </div>

              <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2">
                {educationLevels.map(el => (
                  <button
                    key={el.id}
                    onClick={() => setEducationLevelId(el.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                      educationLevelId === el.id
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant hover:border-primary/50'
                    }`}
                  >
                    <span className={`font-poppins text-body-md block ${
                      educationLevelId === el.id ? 'text-primary font-medium' : 'text-on-surface'
                    }`}>
                      {el.name}
                    </span>
                    {el.description && (
                      <span className="font-poppins text-label-sm text-on-surface-variant block mt-1">
                        {el.description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Work Experience */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-poppins text-h1 text-on-surface">
                  {t('onboarding.workExperience')}
                </h1>
                <p className="font-poppins text-body-md text-on-surface-variant mt-2">
                  {t('onboarding.workExperienceSubtitle')}
                </p>
              </div>

              {/* Existing experiences */}
              {workExperiences.length > 0 && (
                <div className="flex flex-col gap-2">
                  {workExperiences.map(exp => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-xl border border-outline-variant flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-poppins text-body-md text-on-surface block">
                          {exp.job_title}
                        </span>
                        {exp.company && (
                          <span className="font-poppins text-label-sm text-on-surface-variant block">
                            {exp.company}
                          </span>
                        )}
                        {exp.industry && (
                          <span className="font-poppins text-label-sm text-on-surface-variant/70 block">
                            {exp.industry}
                          </span>
                        )}
                        <span className="font-poppins text-label-sm text-on-surface-variant/70 block mt-1">
                          {exp.start_date || '—'}
                          {' → '}
                          {exp.is_current ? t('onboarding.current') : (exp.end_date || '—')}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEditExperience(exp)}
                          className="p-1.5 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="p-1.5 rounded-full hover:bg-error-container transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px] text-error">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add / edit form */}
              {showExpForm ? (
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-primary bg-primary/5">
                  <span className="font-poppins text-label-sm text-primary uppercase tracking-wider">
                    {editingExpId ? t('onboarding.editExperience') : t('onboarding.addExperience')}
                  </span>
                  <input
                    type="text"
                    value={expJobTitle}
                    onChange={e => setExpJobTitle(e.target.value)}
                    placeholder={t('onboarding.jobTitlePlaceholder')}
                    className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline"
                  />
                  <input
                    type="text"
                    value={expCompany}
                    onChange={e => setExpCompany(e.target.value)}
                    placeholder={t('onboarding.companyPlaceholder')}
                    className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline"
                  />
                  <input
                    type="text"
                    value={expIndustry}
                    onChange={e => setExpIndustry(e.target.value)}
                    placeholder={t('onboarding.industryPlaceholder')}
                    className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline"
                  />
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="font-poppins text-label-sm text-on-surface-variant block mb-1">
                        {t('onboarding.startDate')}
                      </label>
                      <input
                        type="date"
                        value={expStartDate}
                        onChange={e => setExpStartDate(e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="font-poppins text-label-sm text-on-surface-variant block mb-1">
                        {t('onboarding.endDate')}
                      </label>
                      <input
                        type="date"
                        value={expEndDate}
                        onChange={e => setExpEndDate(e.target.value)}
                        disabled={expIsCurrent}
                        className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expIsCurrent}
                      onChange={e => { setExpIsCurrent(e.target.checked); if (e.target.checked) setExpEndDate('') }}
                      className="accent-primary"
                    />
                    <span className="font-poppins text-label-sm text-on-surface-variant">{t('onboarding.currentJob')}</span>
                  </label>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveExperience}
                      disabled={!expJobTitle.trim()}
                      className="flex-1 bg-primary text-on-primary py-3 rounded-default text-label-sm uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
                    >
                      {t('common.saving')}
                    </button>
                    <button
                      onClick={resetExpForm}
                      className="px-6 border border-outline-variant py-3 rounded-default text-label-sm uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={startAddExperience}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-outline-variant rounded-xl font-poppins text-label-sm uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary transition-colors duration-300 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  {t('onboarding.addExperience')}
                </button>
              )}

              {workExperiences.length === 0 && !showExpForm && (
                <span className="font-poppins text-label-sm text-on-surface-variant/60 text-center">
                  {t('onboarding.noExperience')}
                </span>
              )}
            </div>
          )}

          {/* Step 5: Informal Work */}
          {step === 5 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-poppins text-h1 text-on-surface">
                  {t('onboarding.informalWork')}
                </h1>
                <p className="font-poppins text-body-md text-on-surface-variant mt-2">
                  {t('onboarding.informalWorkSubtitle')}
                </p>
              </div>
              <div className="flex flex-col gap-unit">
                <textarea
                  value={informalWork}
                  onChange={e => setInformalWork(e.target.value)}
                  placeholder={t('onboarding.informalWorkPlaceholder')}
                  rows={5}
                  className="w-full bg-transparent border border-outline-variant rounded-xl px-4 py-3 text-on-surface text-body-md focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 6: Self-Taught Skills */}
          {step === 6 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-poppins text-h1 text-on-surface">
                  {t('onboarding.selfTaughtSkills')}
                </h1>
                <p className="font-poppins text-body-md text-on-surface-variant mt-2">
                  {t('onboarding.selfTaughtSkillsSubtitle')}
                </p>
              </div>
              <div className="flex flex-col gap-unit">
                <textarea
                  value={selfTaughtSkills}
                  onChange={e => setSelfTaughtSkills(e.target.value)}
                  placeholder={t('onboarding.selfTaughtSkillsPlaceholder')}
                  rows={5}
                  className="w-full bg-transparent border border-outline-variant rounded-xl px-4 py-3 text-on-surface text-body-md focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 7: Languages */}
          {step === 7 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="font-poppins text-h1 text-on-surface">
                  {t('onboarding.languages')}
                </h1>
                <p className="font-poppins text-body-md text-on-surface-variant mt-2">
                  {t('onboarding.languagesSubtitle')}
                </p>
              </div>

              {/* Selected chips */}
              {selectedLangIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedLangIds.map(id => {
                    const lang = languages.find(l => l.id === id)
                    if (!lang) return null
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-poppins text-label-sm"
                      >
                        {lang.name}
                        <button
                          onClick={() => setSelectedLangIds(prev => prev.filter(i => i !== id))}
                          className="cursor-pointer hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Popular languages */}
              <div className="flex flex-col gap-2">
                <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {t('onboarding.popular')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularLangs.map(l => {
                    const selected = selectedLangIds.includes(l.id)
                    return (
                      <button
                        key={l.id}
                        onClick={() => {
                          setSelectedLangIds(prev =>
                            selected ? prev.filter(i => i !== l.id) : [...prev, l.id]
                          )
                        }}
                        className={`px-3 py-1.5 rounded-full font-poppins text-label-sm transition-colors duration-300 cursor-pointer border ${
                          selected
                            ? 'bg-primary text-on-primary border-primary'
                            : 'border-outline-variant text-on-surface-variant hover:border-primary'
                        }`}
                      >
                        {l.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Search */}
              <input
                type="text"
                value={languageSearch}
                onChange={e => setLanguageSearch(e.target.value)}
                placeholder={t('onboarding.searchLanguage')}
                className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline"
              />

              {/* Language list */}
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {filteredLanguages.map(l => {
                  const selected = selectedLangIds.includes(l.id)
                  return (
                    <button
                      key={l.id}
                      onClick={() => {
                        setSelectedLangIds(prev =>
                          selected ? prev.filter(i => i !== l.id) : [...prev, l.id]
                        )
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer flex items-center justify-between ${
                        selected ? 'bg-primary/5 text-primary' : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <span className="font-poppins text-body-sm">{l.name}</span>
                      {selected && (
                        <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-10">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="font-poppins text-label-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300 cursor-pointer uppercase tracking-wider flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                {t('onboarding.back')}
              </button>
            ) : <div />}

            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                disabled={saving || !canProceed}
                className="font-poppins text-label-sm bg-primary text-on-primary px-8 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? t('common.saving') : t('onboarding.continue')}
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving || !canProceed}
                className="font-poppins text-label-sm bg-primary text-on-primary px-8 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? t('common.saving') : t('onboarding.complete')}
                <span className="material-symbols-outlined text-[16px]">check</span>
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
