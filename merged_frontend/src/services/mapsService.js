import apiClient from './apiClient'

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
 * Compute road route geometry, road distance and ETA duration via Google Routes API
 */
export async function getRoadRoute({ originLat, originLng, destLat, destLng, travelMode = 'DRIVE' }) {
  if (originLat == null || originLng == null || destLat == null || destLng == null) {
    return null
  }
  try {
    const res = await apiClient.post('/maps/route', {
      originLat,
      originLng,
      destLat,
      destLng,
      travelMode,
    })
    return res?.data?.route || null
  } catch (error) {
    console.warn('getRoadRoute failed:', error.message)
    return null
  }
}
