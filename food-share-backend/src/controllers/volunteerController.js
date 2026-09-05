import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { VolunteerProfile } from '../models/VolunteerProfile.js'
import { User } from '../models/User.js'

/**
 * Volunteer-facing profile & dashboard logic, plus the admin review actions.
 */

// GET /api/volunteers/me — fetch the logged-in volunteer's profile
export const getMyVolunteerProfile = asyncHandler(async (req, res) => {
  const profile = await VolunteerProfile.findOne({ user: req.user._id })
  if (!profile) throw new ApiError(404, 'Volunteer profile not found.')
  return res.status(200).json(new ApiResponse(200, { profile }, 'Volunteer profile fetched.'))
})

// PATCH /api/volunteers/me — update volunteer profile fields (availability, transport, etc.)
export const updateMyVolunteerProfile = asyncHandler(async (req, res) => {
  // TODO: whitelist updatable fields (availableDays, preferredTime, serviceRadius, transportType)
  throw new ApiError(501, 'Not implemented yet.')
})

// GET /api/volunteers/pending — admin-only: list volunteers awaiting review
// Supports simple pagination via ?page=1&limit=20
export const listPendingVolunteers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const skip = (page - 1) * limit

  const filter = { reviewStatus: 'pending' }

  const [profiles, total] = await Promise.all([
    VolunteerProfile.find(filter)
      .populate('user', 'fullName email phone city status createdAt')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    VolunteerProfile.countDocuments(filter),
  ])

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        profiles,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      'Pending volunteers fetched.'
    )
  )
})

// PATCH /api/volunteers/:id/approve — admin-only: approve a volunteer's registration
// :id refers to the VolunteerProfile _id
export const approveVolunteer = asyncHandler(async (req, res) => {
  const profile = await VolunteerProfile.findById(req.params.id)
  if (!profile) throw new ApiError(404, 'Volunteer profile not found.')

  if (profile.reviewStatus === 'approved') {
    throw new ApiError(409, 'This volunteer has already been approved.')
  }

  profile.reviewStatus = 'approved'
  profile.reviewedBy = req.user._id
  profile.reviewedAt = new Date()
  profile.rejectionReason = null
  await profile.save()

  const user = await User.findByIdAndUpdate(profile.user, { status: 'active' }, { new: true })

  // TODO: send an approval email/notification once an email service is wired up.

  return res
    .status(200)
    .json(new ApiResponse(200, { profile, user: user?.toSafeObject() }, 'Volunteer approved successfully.'))
})

// PATCH /api/volunteers/:id/reject — admin-only: reject a volunteer's registration
// Body: { reason?: string }
export const rejectVolunteer = asyncHandler(async (req, res) => {
  const profile = await VolunteerProfile.findById(req.params.id)
  if (!profile) throw new ApiError(404, 'Volunteer profile not found.')

  if (profile.reviewStatus === 'rejected') {
    throw new ApiError(409, 'This volunteer has already been rejected.')
  }

  profile.reviewStatus = 'rejected'
  profile.reviewedBy = req.user._id
  profile.reviewedAt = new Date()
  profile.rejectionReason = req.body.reason || 'Did not meet verification requirements.'
  await profile.save()

  const user = await User.findByIdAndUpdate(profile.user, { status: 'rejected' }, { new: true })

  // TODO: send a rejection email/notification once an email service is wired up.

  return res
    .status(200)
    .json(new ApiResponse(200, { profile, user: user?.toSafeObject() }, 'Volunteer rejected.'))
})

// GET /api/volunteers/me/deliveries — list this volunteer's assigned deliveries
export const getMyDeliveries = asyncHandler(async (req, res) => {
  // TODO: once a Delivery model exists, query it here filtered by volunteer = req.user._id
  throw new ApiError(501, 'Not implemented yet — requires the Delivery model.')
})
