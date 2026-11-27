import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import {
  getPlaceAutocomplete,
  getPlaceDetails,
  getRoadRoute,
  geocodeAddress,
  reverseGeocodeCoords,
} from '../utils/googleMapsService.js'

/**
 * GET /api/maps/geocode?address=...
 */
export const geocode = asyncHandler(async (req, res) => {
  const { address } = req.query
  if (!address || typeof address !== 'string' || address.trim().length < 2) {
    return res.status(400).json(new ApiResponse(400, null, 'address parameter is required.'))
  }

  const location = await geocodeAddress(address)
  if (!location) {
    return res.status(404).json(new ApiResponse(404, null, 'Address could not be geocoded.'))
  }

  return res.status(200).json(new ApiResponse(200, { location }, 'Address geocoded successfully.'))
})

/**
 * GET /api/maps/reverse-geocode?lat=...&lng=...
 */
export const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query
  if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) {
    return res.status(400).json(new ApiResponse(400, null, 'Valid lat and lng query parameters are required.'))
  }

  const result = await reverseGeocodeCoords(Number(lat), Number(lng))
  return res.status(200).json(new ApiResponse(200, { location: result }, 'Coordinates reverse geocoded.'))
})

/**
 * GET /api/maps/autocomplete?input=...
 */
export const autocomplete = asyncHandler(async (req, res) => {
  const { input } = req.query
  if (!input || input.trim().length < 2) {
    return res.status(200).json(new ApiResponse(200, { suggestions: [] }, 'No input provided'))
  }

  const suggestions = await getPlaceAutocomplete(input)
  return res
    .status(200)
    .json(new ApiResponse(200, { suggestions }, 'Place suggestions retrieved.'))
})

/**
 * GET /api/maps/place-details?placeId=...
 */
export const placeDetails = asyncHandler(async (req, res) => {
  const { placeId } = req.query
  if (!placeId) {
    return res.status(400).json(new ApiResponse(400, null, 'placeId is required.'))
  }

  const details = await getPlaceDetails(placeId)
  if (!details) {
    return res.status(404).json(new ApiResponse(404, null, 'Place details not found.'))
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { details }, 'Place details retrieved successfully.'))
})

/**
 * POST /api/maps/route
 * Body: { originLat, originLng, destLat, destLng, originAddress, destAddress, travelMode }
 */
export const computeRoute = asyncHandler(async (req, res) => {
  let { originLat, originLng, destLat, destLng, originAddress, destAddress, travelMode } = req.body

  // If coordinates are missing, resolve from addresses
  if ((originLat == null || isNaN(Number(originLat))) && originAddress) {
    const geoO = await geocodeAddress(originAddress)
    if (geoO) {
      originLat = geoO.lat
      originLng = geoO.lng
    }
  }

  if ((destLat == null || isNaN(Number(destLat))) && destAddress) {
    const geoD = await geocodeAddress(destAddress)
    if (geoD) {
      destLat = geoD.lat
      destLng = geoD.lng
    }
  }

  if (originLat == null || originLng == null || destLat == null || destLng == null) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'originLat, originLng, destLat, destLng (or resolvable addresses) are required.'))
  }

  const route = await getRoadRoute({
    originLat,
    originLng,
    destLat,
    destLng,
    originAddress,
    destAddress,
    travelMode,
  })

  if (!route) {
    return res.status(400).json(new ApiResponse(400, null, 'Unable to compute route.'))
  }

  return res.status(200).json(new ApiResponse(200, { route }, 'Route computed successfully.'))
})
