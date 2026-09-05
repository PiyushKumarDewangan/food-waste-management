import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { DonorProfile } from '../models/DonorProfile.js'

/**
 * Donor-facing profile & dashboard logic.
 * Scaffolded now so the route file has something real to import;
 * fill each of these in as the donor dashboard is built.
 */

// GET /api/donors/me — fetch the logged-in donor's profile
export const getMyDonorProfile = asyncHandler(async (req, res) => {
  const profile = await DonorProfile.findOne({ user: req.user._id })
  if (!profile) throw new ApiError(404, 'Donor profile not found.')
  return res.status(200).json(new ApiResponse(200, { profile }, 'Donor profile fetched.'))
})

// PATCH /api/donors/me — update donor profile fields (pickup address, availability, etc.)
export const updateMyDonorProfile = asyncHandler(async (req, res) => {
  // TODO: whitelist updatable fields (pickupAddress, pickupAvailability, organizationName, donorType)
  // and validate via a dedicated express-validator rule set before this handler runs.
  throw new ApiError(501, 'Not implemented yet.')
})

// GET /api/donors/me/donations — list this donor's posted food donations
export const getMyDonations = asyncHandler(async (req, res) => {
  // TODO: once a FoodDonation model exists, query it here filtered by donor = req.user._id
  throw new ApiError(501, 'Not implemented yet — requires the FoodDonation model.')
})

// POST /api/donors/me/donations — create a new food donation listing
export const createDonation = asyncHandler(async (req, res) => {
  // TODO: implement once the FoodDonation model + matching workflow is designed
  throw new ApiError(501, 'Not implemented yet — requires the FoodDonation model.')
})
