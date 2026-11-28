import L from 'leaflet'

/**
 * Authentic Google Maps Tile Providers
 * Uses real Google Maps tiles: Roadmap, Satellite Hybrid, and Terrain
 * Completely free, high performance, zero watermark, zero API key required
 */
export const TILE_PROVIDERS = {
  roadmap: {
    name: 'Google Maps (Roadmap)',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    options: {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxZoom: 20,
      attribution: '&copy; Google Maps',
    },
  },
  satellite: {
    name: 'Google Maps (Satellite)',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    options: {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxZoom: 20,
      attribution: '&copy; Google Maps',
    },
  },
  terrain: {
    name: 'Google Maps (Terrain)',
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    options: {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxZoom: 20,
      attribution: '&copy; Google Maps',
    },
  },
  esri: {
    name: 'Esri Street Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; DeLorme, NAVTEQ, TomTom',
    },
  },
}

// Aliases to guarantee backwards compatibility and prevent blank maps
TILE_PROVIDERS.streets = TILE_PROVIDERS.roadmap
TILE_PROVIDERS.voyager = TILE_PROVIDERS.roadmap

/**
 * Google Maps Navigation Polyline Styles
 * Signature Google Maps Route Blue and Stage Navigation Colors
 */
export const ROUTE_STYLES = {
  // Stage 1: Volunteer Courier -> Donor Pickup (Google Signature Navigation Blue)
  stage1: {
    glow: {
      color: '#185abc',
      weight: 8,
      opacity: 0.38,
      lineCap: 'round',
      lineJoin: 'round',
    },
    core: {
      color: '#1a73e8',
      weight: 5,
      opacity: 1.0,
      lineCap: 'round',
      lineJoin: 'round',
    },
  },
  // Stage 2: Donor Pickup -> Receiver Drop-off (Google Maps Signature Navigation Blue #1A73E8)
  stage2: {
    glow: {
      color: '#185abc',
      weight: 8,
      opacity: 0.38,
      lineCap: 'round',
      lineJoin: 'round',
    },
    core: {
      color: '#1a73e8',
      weight: 5,
      opacity: 1.0,
      lineCap: 'round',
      lineJoin: 'round',
    },
  },
  // Default Google Blue Route
  transit: {
    glow: {
      color: '#185abc',
      weight: 8,
      opacity: 0.38,
      lineCap: 'round',
      lineJoin: 'round',
    },
    core: {
      color: '#4285f4',
      weight: 5,
      opacity: 1.0,
      lineCap: 'round',
      lineJoin: 'round',
    },
  },
  // Fallback dashed line
  fallback: {
    glow: {
      color: '#80868b',
      weight: 6,
      opacity: 0.3,
      dashArray: '6, 6',
    },
    core: {
      color: '#5f6368',
      weight: 3,
      opacity: 0.85,
      dashArray: '6, 6',
    },
  },
}

/**
 * Google Maps Style Pickup Marker (Marker A)
 * Google Green origin pin with clean Material floating pill
 */
export function createPickupMarker({ label = 'Pickup Point (A)', isDone = false } = {}) {
  const pinBg = isDone ? '#5f6368' : '#34a853'
  const pinShadow = isDone ? 'rgba(95, 99, 104, 0.4)' : 'rgba(52, 168, 83, 0.45)'

  return L.divIcon({
    className: 'google-pickup-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 10px ${pinShadow}); transform: translate(0, -50%);">
        <div style="width: 36px; height: 36px; border-radius: 50% 50% 50% 3px; transform: rotate(-45deg); background: ${pinBg}; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(60,64,67,0.3);">
          <div style="transform: rotate(45deg); font-weight: 800; font-size: 14px; color: #ffffff; font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            A
          </div>
        </div>
        <div style="margin-top: -3px; background: #ffffff; color: #202124; font-size: 11px; font-weight: 600; padding: 2.5px 8px; border-radius: 6px; letter-spacing: 0.1px; white-space: nowrap; border: 1px solid #dadce0; box-shadow: 0 1px 4px rgba(60,64,67,0.25); font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          ${label}
        </div>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 48],
  })
}

/**
 * Iconic Google Maps Red Pin Drop-off Marker (Marker B)
 * Real Google Maps Red Teardrop Pin (#EA4335)
 */
export function createDropoffMarker({ label = 'Drop-off Point (B)', isDone = false } = {}) {
  const pinBg = isDone ? '#5f6368' : '#ea4335'
  const pinShadow = isDone ? 'rgba(95, 99, 104, 0.4)' : 'rgba(234, 67, 53, 0.45)'

  return L.divIcon({
    className: 'google-dropoff-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 5px 12px ${pinShadow}); transform: translate(0, -50%);">
        <div style="width: 36px; height: 36px; border-radius: 50% 50% 50% 3px; transform: rotate(-45deg); background: ${pinBg}; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(60,64,67,0.35);">
          <div style="transform: rotate(45deg); font-weight: 800; font-size: 14px; color: #ffffff; font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            B
          </div>
        </div>
        <div style="margin-top: -3px; background: #ffffff; color: #202124; font-size: 11px; font-weight: 600; padding: 2.5px 8px; border-radius: 6px; letter-spacing: 0.1px; white-space: nowrap; border: 1px solid #dadce0; box-shadow: 0 1px 4px rgba(60,64,67,0.25); font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          ${label}
        </div>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 48],
  })
}

/**
 * Google Maps Live Navigation Courier Marker
 * Google Blue Location Dot (#1A73E8) with pulsating radar wave ring and vehicle icon
 */
export function createCourierMarker({
  transportType = 'bicycle',
  heading = null,
  volunteerName = 'Volunteer Courier',
  stage = 1,
} = {}) {
  const iconSVGs = {
    bicycle: `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18.5" cy="17.5" r="3.5"/>
        <circle cx="5.5" cy="17.5" r="3.5"/>
        <circle cx="15" cy="5" r="1"/>
        <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
      </svg>
    `,
    motorcycle: `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="5" cy="16" r="3"/>
        <circle cx="19" cy="16" r="3"/>
        <path d="M19 13V9l-4-4h-4l-3 4"/>
        <path d="M8 16h8"/>
      </svg>
    `,
    car: `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    `,
    walking: `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="m13 4 2 2v4l-4 4-2-2 2-2V4z"/>
        <path d="M9 20v-4l3-3"/>
        <path d="m6 16 3-3"/>
      </svg>
    `,
  }

  const cleanTransport = (transportType || 'bicycle').toLowerCase()
  const vehicleSvg =
    iconSVGs[cleanTransport] ||
    (cleanTransport.includes('car')
      ? iconSVGs.car
      : cleanTransport.includes('motor') || cleanTransport.includes('bike')
      ? iconSVGs.motorcycle
      : cleanTransport.includes('walk')
      ? iconSVGs.walking
      : iconSVGs.bicycle)

  const coreBg = '#1a73e8'
  const pulseRingColor = 'rgba(26, 115, 232, 0.35)'

  return L.divIcon({
    className: 'google-courier-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(0, -50%);">
        <style>
          @keyframes google-radar-ripple {
            0% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(1.6); opacity: 0.25; }
            100% { transform: scale(2.3); opacity: 0; }
          }
        </style>
        <!-- Pulsing radar accuracy ring -->
        <div style="position: absolute; top: 6px; width: 44px; height: 44px; border-radius: 50%; background: ${pulseRingColor}; animation: google-radar-ripple 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite; pointer-events: none;"></div>
        
        <!-- Google Navigation circular vehicle disc -->
        <div style="position: relative; width: 42px; height: 42px; border-radius: 50%; background: ${coreBg}; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(60,64,67,0.35); display: flex; align-items: center; justify-content: center; z-index: 2;">
          ${vehicleSvg}
          ${
            heading != null
              ? `<div style="position: absolute; top: -6px; right: -6px; width: 14px; height: 14px; background: #ffffff; border: 1.5px solid #1a73e8; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg);">
                  <div style="width: 0; height: 0; border-left: 3px solid transparent; border-right: 3px solid transparent; border-bottom: 5px solid #1a73e8;"></div>
                </div>`
              : ''
          }
        </div>

        <!-- Google Style Material Pill -->
        <div style="margin-top: 3px; background: #ffffff; color: #202124; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; letter-spacing: 0.1px; white-space: nowrap; border: 1px solid #dadce0; box-shadow: 0 2px 6px rgba(60,64,67,0.25); font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; z-index: 2;">
          ${volunteerName}
        </div>
      </div>
    `,
    iconSize: [44, 60],
    iconAnchor: [22, 36],
  })
}

/**
 * Iconic Google Maps Red Pin (for LocationPickerModal)
 */
export function createDraggablePin({ label = 'Drag to adjust' } = {}) {
  return L.divIcon({
    className: 'google-draggable-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab; filter: drop-shadow(0 6px 14px rgba(234, 67, 53, 0.5)); transform: translate(0, -50%);">
        <div style="width: 42px; height: 42px; border-radius: 50% 50% 50% 3px; transform: rotate(-45deg); background: linear-gradient(135deg, #ea4335 0%, #c5221f 100%); border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(60,64,67,0.35);">
          <div style="transform: rotate(45deg); width: 14px; height: 14px; background: #ffffff; border-radius: 50%; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);"></div>
        </div>
        <div style="margin-top: -4px; background: #202124; color: #ffffff; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 6px; letter-spacing: 0.2px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          ${label}
        </div>
      </div>
    `,
    iconSize: [42, 56],
    iconAnchor: [21, 52],
  })
}

/**
 * Fit bounds with safe padding and max zoom
 */
export function fitMapBounds(map, points, { padding = [50, 50], maxZoom = 16 } = {}) {
  if (!map || !points || points.length === 0) return
  const validPoints = points.filter(
    (p) => p && typeof p[0] === 'number' && typeof p[1] === 'number' && !isNaN(p[0]) && !isNaN(p[1])
  )
  if (validPoints.length === 0) return
  if (validPoints.length === 1) {
    map.flyTo(validPoints[0], Math.min(maxZoom, 15), { animate: true, duration: 0.8 })
    return
  }

  const bounds = L.latLngBounds(validPoints)
  map.flyToBounds(bounds, {
    padding: padding,
    maxZoom: maxZoom,
    animate: true,
    duration: 0.8,
  })
}
