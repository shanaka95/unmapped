declare module 'react-simple-maps' {
  import { ComponentType, ReactNode } from 'react'

  export interface ComposableMapProps {
    projectionConfig?: {
      scale?: number
      center?: [number, number]
      rotate?: [number, number, number]
    }
    width?: number
    height?: number
    className?: string
    children?: ReactNode
  }

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    minZoom?: number
    maxZoom?: number
    onMoveStart?: (position: { coordinates: [number, number]; zoom: number }) => void
    onMove?: (position: { coordinates: [number, number]; zoom: number }) => void
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void
    children?: ReactNode
  }

  export interface GeographiesProps {
    geography: string | object
    children: (props: { geographies: Geography[] }) => ReactNode
  }

  export interface Geography {
    rsmKey: string
    id: string | number
    type: string
    properties: Record<string, unknown>
    geometry: object
  }

  export interface GeographyProps {
    geography: Geography
    onClick?: () => void
    onMouseEnter?: () => void
    onMouseLeave?: () => void
    style?: {
      default?: React.CSSProperties
      hover?: React.CSSProperties
      pressed?: React.CSSProperties
    }
    className?: string
    key?: string
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
}
