import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import {
  getPlaceAutocomplete,
  getPlaceDetails,
  getRoadRoute,
} from '../utils/googleMapsService.js'

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
 * Body: { originLat, originLng, destLat, destLng, travelMode }
 */
export const computeRoute = asyncHandler(async (req, res) => {
  const { originLat, originLng, destLat, destLng, travelMode } = req.body

  if (originLat == null || originLng == null || destLat == null || destLng == null) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'originLat, originLng, destLat, destLng are required.'))
  }

  const route = await getRoadRoute({
    originLat,
    originLng,
    destLat,
    destLng,
    travelMode,
  })

  if (!route) {
    return res.status(400).json(new ApiResponse(400, null, 'Unable to compute route.'))
  }

  return res.status(200).json(new ApiResponse(200, { route }, 'Route computed successfully.'))
})
