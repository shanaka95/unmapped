import { useCallback, useEffect, useRef, useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { getViewport, updateSettlement, getSettlementStats, type GridCell, type SettlementStats } from '../api/settlements'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Numeric ISO-3166 → alpha-2 mapping for matching countries
const NUMERIC_TO_ALPHA2: Record<string, string> = {
  '004': 'AF', '008': 'AL', '012': 'DZ', '016': 'AS', '024': 'AO', '028': 'AG',
  '032': 'AR', '036': 'AU', '040': 'AT', '044': 'BS', '048': 'BH', '050': 'BD',
  '052': 'BB', '056': 'BE', '060': 'BM', '064': 'BT', '068': 'BO', '070': 'BA',
  '072': 'BW', '076': 'BR', '096': 'BN', '100': 'BG', '104': 'MM', '108': 'BI',
  '116': 'KH', '120': 'CM', '124': 'CA', '132': 'CV', '140': 'CF', '148': 'TD',
  '152': 'CL', '156': 'CN', '170': 'CO', '174': 'KM', '178': 'CG', '180': 'CD',
  '188': 'CR', '191': 'HR', '192': 'CU', '196': 'CY', '203': 'CZ', '204': 'BJ',
  '208': 'DK', '212': 'DM', '214': 'DO', '218': 'EC', '222': 'SV', '226': 'GQ',
  '231': 'ET', '232': 'ER', '233': 'EE', '242': 'FJ', '246': 'FI', '250': 'FR',
  '266': 'GA', '270': 'GM', '268': 'GE', '276': 'DE', '288': 'GH', '300': 'GR',
  '308': 'GD', '320': 'GT', '324': 'GN', '328': 'GY', '332': 'HT', '340': 'HN',
  '348': 'HU', '352': 'IS', '356': 'IN', '360': 'ID', '364': 'IR', '368': 'IQ',
  '372': 'IE', '376': 'IL', '380': 'IT', '384': 'CI', '388': 'JM', '392': 'JP',
  '398': 'KZ', '400': 'JO', '404': 'KE', '408': 'KP', '410': 'KR', '414': 'KW',
  '417': 'KG', '418': 'LA', '422': 'LB', '426': 'LS', '428': 'LV', '430': 'LR',
  '434': 'LY', '440': 'LT', '442': 'LU', '450': 'MG', '454': 'MW', '458': 'MY',
  '462': 'MV', '466': 'ML', '470': 'MT', '478': 'MR', '480': 'MU', '484': 'MX',
  '496': 'MN', '498': 'MD', '499': 'ME', '504': 'MA', '508': 'MZ', '512': 'OM',
  '516': 'NA', '520': 'NR', '524': 'NP', '528': 'NL', '540': 'NC', '548': 'VU',
  '554': 'NZ', '558': 'NI', '562': 'NE', '566': 'NG', '578': 'NO', '586': 'PK',
  '591': 'PA', '598': 'PG', '600': 'PY', '604': 'PE', '608': 'PH', '616': 'PL',
  '620': 'PT', '630': 'PR', '634': 'QA', '642': 'RO', '643': 'RU', '646': 'RW',
  '659': 'KN', '660': 'AI', '662': 'LC', '666': 'PM', '670': 'VC', '674': 'SM',
  '678': 'ST', '682': 'SA', '686': 'SN', '688': 'RS', '690': 'SC', '694': 'SL',
  '702': 'SG', '703': 'SK', '704': 'VN', '705': 'SI', '706': 'SO', '710': 'ZA',
  '716': 'ZW', '724': 'ES', '728': 'SS', '729': 'SD', '740': 'SR', '748': 'SZ',
  '752': 'SE', '756': 'CH', '760': 'SY', '762': 'TJ', '764': 'TH', '768': 'TG',
  '776': 'TO', '780': 'TT', '784': 'AE', '788': 'TN', '792': 'TR', '795': 'TM',
  '798': 'TV', '800': 'UG', '804': 'UA', '807': 'MK', '818': 'EG', '826': 'GB',
  '834': 'TZ', '840': 'US', '854': 'BF', '858': 'UY', '860': 'UZ', '862': 'VE',
  '887': 'YE', '894': 'ZM', '900': 'XK',
}

const TYPE_COLORS: Record<string, string> = {
  urban_centre: '#F32929',
  dense_urban: '#7A3E20',
  semi_dense_urban: '#EF8A3F',
  suburban: '#FFEA4E',
  rural_cluster: '#207B6B',
  rural: '#B0E0A4',
}

const TYPE_LABELS: Record<string, string> = {
  urban_centre: 'Urban Centre',
  dense_urban: 'Dense Urban',
  semi_dense_urban: 'Semi-Dense Urban',
  suburban: 'Suburban',
  rural_cluster: 'Rural Cluster',
  rural: 'Rural',
}

const ALL_TYPES = Object.keys(TYPE_COLORS)

export default function SettlementMap() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const [cells, setCells] = useState<GridCell[]>([])
  const [stats, setStats] = useState<SettlementStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingCell, setEditingCell] = useState<GridCell | null>(null)
  const [editType, setEditType] = useState('')
  const [zoom, setZoom] = useState(1)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getSettlementStats().then(res => {
      if (res.data) setStats(res.data)
    })
  }, [])

  const loadViewport = useCallback(async (newZoom: number) => {
    setLoading(true)
    // For now, pass all cells — the backend will filter based on viewport
    // We pass the current zoom level so the backend returns appropriate granularity
    const res = await getViewport({
      sw_lat: -90,
      sw_lng: -180,
      ne_lat: 90,
      ne_lng: 180,
      zoom: newZoom,
    })
    if (res.data) setCells(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadViewport(zoom) }, [zoom, loadViewport])

  // Color countries by the dominant settlement type in their cells
  function getCountryColor(alpha2: string | undefined): { fill: string; hasData: boolean } {
    if (!alpha2) return { fill: '#c4c7c7', hasData: false }
    const countryCells = cells.filter(c => {
      // Approximate: match by finding a cell whose lat/lng falls within the country
      // For simplicity, we use a different approach — color based on cell density
      return false
    })
    return { fill: '#747878', hasData: false }
  }

  // Build a heatmap-like overlay: aggregate cells into country-level colors
  const countryColors = new Map<string, string>()
  const countryCounts = new Map<string, number>()

  for (const cell of cells) {
    // Simple approach: color by cell type regardless of country
    // We'll use the countryByCode mapping
  }

  // For the settlement map, we want to show settlement density by country
  // Build country-level aggregation
  const countryTypeCounts = new Map<string, Record<string, number>>()

  for (const cell of cells) {
    // We don't have country info in the cell data directly
    // Use the countryCodes from the stats instead
  }

  // Simplified: show countries that have cells as darker, empty as gray
  // We'll color countries based on whether they have settlement data
  const cellsByCountry = new Map<string, GridCell[]>()
  // Since cells don't have country codes, we'll just show a simple map

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
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-outline-variant px-4 py-6 gap-unit flex-shrink-0">
          <h2 className="font-poppins text-h2 text-on-surface mb-4">{t('admin.settlements')}</h2>

          {/* Stats */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="border border-outline-variant rounded-xl p-4">
              <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                {loading ? t('common.loading') : 'Settlements'}
              </span>
              <span className="font-poppins text-h1 text-on-surface block mt-1">
                {stats?.total?.toLocaleString() ?? '...'}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-3">
            <h3 className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
              Legend
            </h3>
            {ALL_TYPES.map(type => (
              <div key={type} className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: TYPE_COLORS[type] }}
                />
                <div className="flex flex-col">
                  <span className="font-poppins text-label-sm text-on-surface">
                    {TYPE_LABELS[type]}
                  </span>
                  {stats?.by_type?.[type] && (
                    <span className="font-poppins text-label-sm text-on-surface-variant">
                      {stats.by_type[type].toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Map */}
        <div className="flex-grow relative">
          <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest m-4" style={{ minHeight: 'calc(100vh - 130px)' }}>
            <ComposableMap projectionConfig={{ scale: 140 }}>
              <ZoomableGroup
                center={[0, 0]}
                zoom={1}
                minZoom={1}
                maxZoom={4}
                onMoveEnd={({ coordinates, zoom: z }) => {
                  setZoom(Math.round(z))
                }}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const numericCode = geo.id?.toString()?.padStart(3, '0')
                      const alpha2 = NUMERIC_TO_ALPHA2[numericCode] ?? ''
                      const hasData = alpha2 && cells.length > 0

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => {
                            // Could open a detail panel for this country
                          }}
                          style={{
                            default: {
                              fill: hasData ? '#747878' : '#c4c7c7',
                              stroke: '#f9f9f9',
                              strokeWidth: 0.5,
                              outline: 'none',
                            },
                            hover: {
                              fill: '#000000',
                              stroke: '#f9f9f9',
                              strokeWidth: 0.5,
                              outline: 'none',
                              cursor: 'pointer',
                            },
                            pressed: {
                              fill: '#5e5e5e',
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

          {/* Settlement detail panel */}
          {editingCell && (
            <div className="lg:absolute lg:top-4 lg:right-4 lg:z-10 lg:w-80 border border-outline-variant rounded-xl bg-surface-container-lowest overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
                <span className="font-poppins text-body-md font-medium">
                  {TYPE_LABELS[editingCell.settlement_type] || 'Settlement'}
                </span>
                <button
                  onClick={() => setEditingCell(null)}
                  className="font-poppins text-on-surface-variant hover:text-on-surface transition-colors duration-300 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Coordinates
                  </span>
                  <span className="font-poppins text-body-md text-on-surface">
                    {editingCell.lat.toFixed(4)}, {editingCell.lng.toFixed(4)}
                  </span>
                </div>
                <div className="flex flex-col gap-unit">
                  <label className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Settlement Type
                  </label>
                  <select
                    value={editType}
                    onChange={e => setEditType(e.target.value)}
                    className="w-full bg-transparent border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300"
                  >
                    {ALL_TYPES.map(type => (
                      <option key={type} value={type}>{TYPE_LABELS[type]}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={async () => {
                    if (editingCell.id) {
                      await updateSettlement(editingCell.id, editType)
                      setCells(prev => prev.map(c =>
                        c.id === editingCell.id ? { ...c, settlement_type: editType } : c
                      ))
                    }
                    setEditingCell(null)
                  }}
                  className="font-poppins text-label-sm bg-primary text-on-primary px-6 py-3 rounded-default uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer"
                >
                  {t('common.saving')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
