import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { ReceiverProfile } from '../models/ReceiverProfile.js'
import { User } from '../models/User.js'

/**
 * Receiver-facing profile & dashboard logic, plus the admin review actions
 * for approving/rejecting a receiver's verification documents.
 */

// GET /api/receivers/me — fetch the logged-in receiver's profile
export const getMyReceiverProfile = asyncHandler(async (req, res) => {
  const profile = await ReceiverProfile.findOne({ user: req.user._id })
  if (!profile) throw new ApiError(404, 'Receiver profile not found.')
  return res.status(200).json(new ApiResponse(200, { profile }, 'Receiver profile fetched.'))
})

// PATCH /api/receivers/me — update receiver profile fields
export const updateMyReceiverProfile = asyncHandler(async (req, res) => {
  // TODO: whitelist updatable fields (organizationAddress, storageCapacity, operatingHours, etc.)
  throw new ApiError(501, 'Not implemented yet.')
})

// GET /api/receivers/pending — admin-only: list receivers awaiting review
// Supports simple pagination via ?page=1&limit=20
export const listPendingReceivers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const skip = (page - 1) * limit

  const filter = { reviewStatus: 'pending' }

  const [profiles, total] = await Promise.all([
    ReceiverProfile.find(filter)
      .populate('user', 'fullName email phone city status createdAt')
      .sort({ createdAt: 1 }) // oldest first — first come, first reviewed
      .skip(skip)
      .limit(limit),
    ReceiverProfile.countDocuments(filter),
  ])

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        profiles,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      'Pending receivers fetched.'
    )
  )
})

// PATCH /api/receivers/:id/approve — admin-only: approve a receiver's registration
// :id refers to the ReceiverProfile _id
export const approveReceiver = asyncHandler(async (req, res) => {
  const profile = await ReceiverProfile.findById(req.params.id)
  if (!profile) throw new ApiError(404, 'Receiver profile not found.')

  if (profile.reviewStatus === 'approved') {
    throw new ApiError(409, 'This receiver has already been approved.')
  }

  profile.reviewStatus = 'approved'
  profile.reviewedBy = req.user._id
  profile.reviewedAt = new Date()
  profile.rejectionReason = null
  await profile.save()

  const user = await User.findByIdAndUpdate(profile.user, { status: 'active' }, { new: true })

  // TODO: send an approval email/notification to user.email once an email
  // service is wired up (see authController.forgotPassword TODO for the
  // same dependency).

  return res
    .status(200)
    .json(new ApiResponse(200, { profile, user: user?.toSafeObject() }, 'Receiver approved successfully.'))
})

// PATCH /api/receivers/:id/reject — admin-only: reject a receiver's registration
// Body: { reason?: string }
export const rejectReceiver = asyncHandler(async (req, res) => {
  const profile = await ReceiverProfile.findById(req.params.id)
  if (!profile) throw new ApiError(404, 'Receiver profile not found.')

  if (profile.reviewStatus === 'rejected') {
    throw new ApiError(409, 'This receiver has already been rejected.')
  }

  profile.reviewStatus = 'rejected'
  profile.reviewedBy = req.user._id
  profile.reviewedAt = new Date()
  profile.rejectionReason = req.body.reason || 'Did not meet verification requirements.'
  await profile.save()

  const user = await User.findByIdAndUpdate(profile.user, { status: 'rejected' }, { new: true })

  // TODO: send a rejection email/notification (include profile.rejectionReason)
  // once an email service is wired up.

  return res
    .status(200)
    .json(new ApiResponse(200, { profile, user: user?.toSafeObject() }, 'Receiver rejected.'))
})
