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
 * Compute road route geometry, road distance and ETA duration via Google Routes API
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
    return res?.data?.route || null
  } catch (error) {
    console.warn('getRoadRoute failed:', error.message)
    return null
  }
}
