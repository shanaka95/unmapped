import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Rectangle, useMap, Popup } from 'react-leaflet'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { getViewport, updateSettlement, getSettlementStats, type GridCell, type SettlementStats } from '../api/settlements'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

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

function MapEvents({ onMoveEnd }: { onMoveEnd: () => void }) {
  const map = useMap()
  useEffect(() => {
    map.on('moveend', onMoveEnd)
    return () => { map.off('moveend', onMoveEnd) }
  }, [map, onMoveEnd])
  return null
}

export default function SettlementMap() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const [cells, setCells] = useState<GridCell[]>([])
  const [stats, setStats] = useState<SettlementStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingCell, setEditingCell] = useState<GridCell | null>(null)
  const [editType, setEditType] = useState('')
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    getSettlementStats().then(res => {
      if (res.data) setStats(res.data)
    })
  }, [])

  const loadViewport = useCallback(async (map: L.Map) => {
    setLoading(true)
    const bounds = map.getBounds()
    const zoom = map.getZoom()
    const res = await getViewport({
      sw_lat: bounds.getSouth(),
      sw_lng: bounds.getWest(),
      ne_lat: bounds.getNorth(),
      ne_lng: bounds.getEast(),
      zoom,
    })
    if (res.data) setCells(res.data)
    setLoading(false)
  }, [])

  function handleMapReady(map: L.Map) {
    mapRef.current = map
    loadViewport(map)
  }

  async function handleSave() {
    if (!editingCell?.id) return
    await updateSettlement(editingCell.id, editType)
    setEditingCell(null)
    setCells(prev => prev.map(c => c.id === editingCell.id ? { ...c, settlement_type: editType } : c))
  }

  function getCellBounds(cell: GridCell, zoom: number): [[number, number], [number, number]] {
    if (zoom >= 8) {
      // Individual settlement: 0.09° (~10km) squares
      const half = 0.045
      return [
        [cell.lat - half, cell.lng - half],
        [cell.lat + half, cell.lng + half],
      ]
    } else if (zoom >= 4) {
      // 1-degree grid cells — fill entire degree square
      const latFloor = Math.floor(cell.lat)
      const lngFloor = Math.floor(cell.lng)
      return [[latFloor, lngFloor], [latFloor + 1, lngFloor + 1]]
    } else {
      // 5-degree grid cells — fill entire 5° square
      const latBase = Math.floor(cell.lat / 5) * 5
      const lngBase = Math.floor(cell.lng / 5) * 5
      return [[latBase, lngBase], [latBase + 5, lngBase + 5]]
    }
  }

  const mapZoom = mapRef.current?.getZoom() ?? 3

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
                {loading ? t('common.loading') : t('admin.stats.totalUsers').replace('Users', 'Settlements')}
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
          <MapContainer
            center={[20, 0]}
            zoom={3}
            style={{ height: '100%', width: '100%', minHeight: 'calc(100vh - 130px)' }}
            ref={ref => { if (ref) handleMapReady(ref) }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents onMoveEnd={() => {
              const map = (document.querySelector('.leaflet-container') as any)?._map
              if (map) loadViewport(map)
            }} />

            {cells.map((cell, i) => {
              const bounds = getCellBounds(cell, mapZoom)
              return (
                <Rectangle
                  key={`${cell.lat}-${cell.lng}-${cell.settlement_type}-${i}`}
                  bounds={bounds}
                  pathOptions={{
                    color: 'rgba(0,0,0,0.15)',
                    weight: 0.5,
                    fillColor: TYPE_COLORS[cell.settlement_type] || '#999',
                    fillOpacity: mapZoom >= 8 ? 0.7 : 0.6,
                  }}
                  eventHandlers={{
                    click: () => {
                      if (cell.id) {
                        setEditingCell(cell)
                        setEditType(cell.settlement_type)
                      }
                    },
                  }}
                >
                  {cell.id && editingCell?.id === cell.id && (
                    <Popup>
                      <div className="font-poppins text-body-md">
                        <p className="font-medium mb-2">{TYPE_LABELS[cell.settlement_type]}</p>
                        <select
                          value={editType}
                          onChange={e => setEditType(e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2"
                        >
                          {ALL_TYPES.map(t => (
                            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleSave}
                          className="bg-black text-white text-xs uppercase px-3 py-1 rounded"
                        >
                          Save
                        </button>
                      </div>
                    </Popup>
                  )}
                </Rectangle>
              )
            })}
          </MapContainer>

          {/* Mobile legend overlay */}
          <div className="lg:hidden absolute top-4 right-4 z-[1000] bg-surface-container-lowest border border-outline-variant rounded-xl p-3 shadow-lg">
            <h3 className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
              {loading ? '...' : stats?.total?.toLocaleString() ?? '...'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {ALL_TYPES.map(type => (
                <div key={type} className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: TYPE_COLORS[type] }}
                  />
                  <span className="font-poppins text-label-sm text-on-surface-variant">
                    {TYPE_LABELS[type]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
