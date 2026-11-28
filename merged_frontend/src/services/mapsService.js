import apiClient from './apiClient'

/**
 * Geocode a human-readable address to latitude, longitude and formatted address
 */
export async function geocodeAddress(address) {
  if (!address || typeof address !== 'string' || address.trim().length < 2) return null
  try {
    const res = await apiClient.get(`/maps/geocode?address=${encodeURIComponent(address.trim())}`)
    return res?.data?.location || null
  } catch (error) {
    console.warn('geocodeAddress failed:', error.message)
    return null
  }
}

/**
 * Autocomplete address query via backend Google Places proxy
 */
export async function getAddressSuggestions(query) {
  if (!query || query.trim().length < 2) return []
  try {
    const res = await apiClient.get(`/maps/autocomplete?input=${encodeURIComponent(query.trim())}`)
    return res?.data?.suggestions || []
  } catch (error) {
    console.warn('getAddressSuggestions failed:', error.message)
    return []
  }
}

/**
 * Fetch coordinates and formatted address for a selected place
 */
export async function getPlaceLocation(placeId) {
  if (!placeId) return null
  try {
    const res = await apiClient.get(`/maps/place-details?placeId=${encodeURIComponent(placeId)}`)
    return res?.data?.details || null
  } catch (error) {
    console.warn('getPlaceLocation failed:', error.message)
    return null
  }
}

/**
 * Reverse geocode coordinates to a human-readable street address
 */
export async function reverseGeocodeCoords(lat, lng) {
  if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) return null
  try {
    const res = await apiClient.get(`/maps/reverse-geocode?lat=${Number(lat)}&lng=${Number(lng)}`)
    return res?.data?.location || null
  } catch (error) {
    console.warn('reverseGeocodeCoords failed:', error.message)
    return null
  }
}

/**
 * Compute road route geometry, road distance and ETA duration.
 * Tries backend routing endpoint first, with resilient direct client-side OSRM fallback
 * so road routes ALWAYS render without requiring a paid or billed Google API key.
 */
export async function getRoadRoute({
  originLat,
  originLng,
  destLat,
  destLng,
  originAddress,
  destAddress,
  travelMode = 'DRIVE',
}) {
  // 1. Try backend road routing endpoint first
  try {
    const res = await apiClient.post('/maps/route', {
      originLat,
      originLng,
      destLat,
      destLng,
      originAddress,
      destAddress,
      travelMode,
    })
    if (res?.data?.route) {
      return res.data.route
    }
  } catch (error) {
    console.warn('Backend /maps/route failed or unauthorized, falling back to direct browser OSRM:', error.message)
  }

  // 2. Direct client-side OSRM Driving Engine fallback (requires ZERO API key, 100% free, open CORS)
  if (originLat != null && originLng != null && destLat != null && destLng != null) {
    try {
      const oLat = Number(originLat)
      const oLng = Number(originLng)
      const dLat = Number(destLat)
      const dLng = Number(destLng)
      if (!isNaN(oLat) && !isNaN(oLng) && !isNaN(dLat) && !isNaN(dLng)) {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`
        const osrmRes = await fetch(osrmUrl)
        if (osrmRes.ok) {
          const data = await osrmRes.json()
          const r = data?.routes?.[0]
          if (r && r.geometry?.coordinates?.length > 0) {
            const distanceMeters = Math.round(r.distance || 0)
            const distanceKm = Number((distanceMeters / 1000).toFixed(1))
            const durationSeconds = Math.round(r.duration || (distanceKm / 35) * 3600)
            const mins = Math.max(1, Math.round(durationSeconds / 60))
            const durationText = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} mins`
            // OSRM GeoJSON is [lng, lat], Leaflet polyline needs [lat, lng]
            const coordinates = r.geometry.coordinates.map(([lng, lat]) => [lat, lng])
            return {
              distanceMeters,
              distanceKm,
              durationSeconds,
              durationText,
              coordinates,
              encodedPolyline: '',
              provider: 'OSRM Driving Engine (Free Open Road Routing)',
              isFallback: false,
            }
          }
        }
      }
    } catch (osrmDirectErr) {
      console.warn('Direct browser OSRM routing failed:', osrmDirectErr.message)
    }
  }

  return null
}
