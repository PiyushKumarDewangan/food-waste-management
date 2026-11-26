import { env } from '../config/env.js'

/**
 * Haversine formula to compute distance in kilometers between two coordinates
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null
  const nLat1 = Number(lat1)
  const nLon1 = Number(lon1)
  const nLat2 = Number(lat2)
  const nLon2 = Number(lon2)

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null
  if (nLat1 < -90 || nLat1 > 90 || nLat2 < -90 || nLat2 > 90) return null
  if (nLon1 < -180 || nLon1 > 180 || nLon2 < -180 || nLon2 > 180) return null

  const R = 6371 // Earth radius in km
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((R * c).toFixed(1))
}

// Simple in-memory cache to reduce external API quota consumption
const cache = new Map()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function getCached(key) {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() > item.expiresAt) {
    cache.delete(key)
    return null
  }
  return item.value
}

function setCached(key, value, ttl = CACHE_TTL_MS) {
  cache.set(key, { value, expiresAt: Date.now() + ttl })
}

/**
 * Autocomplete address queries using Google Places API (New)
 */
export async function getPlaceAutocomplete(input) {
  if (!input || typeof input !== 'string' || input.trim().length < 2) {
    return []
  }

  const trimmed = input.trim()
  const cacheKey = `autocomplete:${trimmed.toLowerCase()}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const apiKey = env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return []
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input: trimmed,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.warn('Google Places Autocomplete HTTP error:', response.status, errText)
      return []
    }

    const data = await response.json()
    const suggestions = (data.suggestions || []).map((s) => {
      const p = s.placePrediction || {}
      return {
        placeId: p.placeId || '',
        description: p.text?.text || '',
        mainText: p.structuredFormat?.mainText?.text || '',
        secondaryText: p.structuredFormat?.secondaryText?.text || '',
      }
    })

    setCached(cacheKey, suggestions)
    return suggestions
  } catch (error) {
    console.error('getPlaceAutocomplete error:', error.message)
    return []
  }
}

/**
 * Fetch place location (lat, lng) and formatted address using Places API (New)
 */
export async function getPlaceDetails(placeId) {
  if (!placeId) return null

  const cacheKey = `place:${placeId}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const apiKey = env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(
      placeId
    )}?fields=id,displayName,formattedAddress,location`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
      },
    })

    if (!response.ok) {
      console.warn('Google Place Details HTTP error:', response.status)
      return null
    }

    const data = await response.json()
    const result = {
      placeId: data.id,
      name: data.displayName?.text || '',
      address: data.formattedAddress || data.displayName?.text || '',
      lat: data.location?.latitude ?? null,
      lng: data.location?.longitude ?? null,
    }

    setCached(cacheKey, result)
    return result
  } catch (error) {
    console.error('getPlaceDetails error:', error.message)
    return null
  }
}

/**
 * Compute real road route, distance, travel duration, and polyline using Google Routes API
 */
export async function getRoadRoute({
  originLat,
  originLng,
  destLat,
  destLng,
  travelMode = 'DRIVE', // DRIVE, TWO_WHEELER, BICYCLE, WALK
}) {
  const oLat = Number(originLat)
  const oLng = Number(originLng)
  const dLat = Number(destLat)
  const dLng = Number(destLng)

  if (isNaN(oLat) || isNaN(oLng) || isNaN(dLat) || isNaN(dLng)) {
    return null
  }

  // Normalize travelMode for Google Routes API
  let mode = 'DRIVE'
  const lowerMode = (travelMode || '').toLowerCase()
  if (lowerMode.includes('bike') || lowerMode.includes('bicycle')) {
    mode = 'BICYCLE'
  } else if (lowerMode.includes('walk')) {
    mode = 'WALK'
  } else if (lowerMode.includes('motorcycle') || lowerMode.includes('two_wheeler')) {
    mode = 'TWO_WHEELER'
  }

  const cacheKey = `route:${oLat},${oLng}:${dLat},${dLng}:${mode}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const apiKey = env.GOOGLE_MAPS_API_KEY

  // Helper fallback if API key is not present or API call fails
  const computeFallback = () => {
    const haversineKm = calculateDistanceKm(oLat, oLng, dLat, dLng)
    if (haversineKm == null) return null
    return {
      distanceMeters: Math.round(haversineKm * 1000),
      distanceKm: Number(haversineKm.toFixed(1)),
      durationSeconds: Math.round((haversineKm / 30) * 3600), // ~30 km/h baseline
      durationText: `${Math.round(haversineKm * 2)} mins`,
      encodedPolyline: '',
      isFallback: true,
    }
  }

  if (!apiKey) {
    return computeFallback()
  }

  try {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: { latitude: oLat, longitude: oLng },
          },
        },
        destination: {
          location: {
            latLng: { latitude: dLat, longitude: dLng },
          },
        },
        travelMode: mode,
        routingPreference: mode === 'DRIVE' || mode === 'TWO_WHEELER' ? 'TRAFFIC_UNAWARE' : undefined,
      }),
    })

    if (!response.ok) {
      console.warn('Google Routes API HTTP error:', response.status)
      return computeFallback()
    }

    const data = await response.json()
    const route = data.routes?.[0]
    if (!route) {
      return computeFallback()
    }

    const distanceMeters = route.distanceMeters || 0
    const distanceKm = Number((distanceMeters / 1000).toFixed(1))
    const durationSeconds = parseInt(route.duration?.replace('s', '') || '0', 10)
    const mins = Math.max(1, Math.round(durationSeconds / 60))
    const durationText = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} mins`

    const result = {
      distanceMeters,
      distanceKm,
      durationSeconds,
      durationText,
      encodedPolyline: route.polyline?.encodedPolyline || '',
      isFallback: false,
    }

    setCached(cacheKey, result)
    return result
  } catch (error) {
    console.error('getRoadRoute error:', error.message)
    return computeFallback()
  }
}

/**
 * High-level helper to calculate road distance in KM with automatic fallback to Haversine
 */
export async function calculateRoadDistanceKm(lat1, lon1, lat2, lon2, travelMode = 'DRIVE') {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null
  }
  try {
    const route = await getRoadRoute({
      originLat: lat1,
      originLng: lon1,
      destLat: lat2,
      destLng: lon2,
      travelMode,
    })
    if (route && route.distanceKm != null) {
      return route.distanceKm
    }
  } catch {
    // ignore and fallback
  }
  return calculateDistanceKm(lat1, lon1, lat2, lon2)
}
