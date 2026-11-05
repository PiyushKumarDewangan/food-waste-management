import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { VolunteerProfile } from '../models/VolunteerProfile.js'
import { User } from '../models/User.js'
import { Exchange } from '../models/Exchange.js'
import { FoodDonation } from '../models/FoodDonation.js'
import { ReceiverProfile } from '../models/ReceiverProfile.js'
import { DonorProfile } from '../models/DonorProfile.js'
import { Notification } from '../models/Notification.js'
import { OrderIssue } from '../models/OrderIssue.js'
import { createDonorNotification } from '../utils/notificationService.js'

const safeNotify = async (payload) => {
  try {
    await Notification.create(payload)
  } catch (e) {
    // Non-blocking
  }
}

/**
 * Volunteer-facing profile & dashboard logic, plus the admin review actions.
 */

/**
 * Helper to synchronously compute and update real-time volunteer rating and stats.
 */
export async function syncVolunteerRating(volunteerUserId) {
  if (!volunteerUserId) return null

  const completedExchanges = await Exchange.find({
    volunteer: volunteerUserId,
    status: 'completed',
  })

  const totalDeliveries = completedExchanges.length
  const allRatings = []

  completedExchanges.forEach((ex) => {
    let hasRoleFeedback = false
    if (typeof ex.donorFeedback?.rating === 'number' && ex.donorFeedback.rating > 0) {
      allRatings.push(ex.donorFeedback.rating)
      hasRoleFeedback = true
    }
    if (typeof ex.receiverFeedback?.rating === 'number' && ex.receiverFeedback.rating > 0) {
      allRatings.push(ex.receiverFeedback.rating)
      hasRoleFeedback = true
    }
    if (!hasRoleFeedback) {
      if (typeof ex.feedback?.rating === 'number' && ex.feedback.rating > 0) {
        allRatings.push(ex.feedback.rating)
      } else if (typeof ex.rating === 'number' && ex.rating > 0) {
        allRatings.push(ex.rating)
      }
    }
  })

  const reviewsCount = allRatings.length
  const avgRating = reviewsCount > 0
    ? Number((allRatings.reduce((sum, r) => sum + r, 0) / reviewsCount).toFixed(1))
    : 0

  const updatedProfile = await VolunteerProfile.findOneAndUpdate(
    { user: volunteerUserId },
    {
      $set: {
        rating: avgRating,
        totalDeliveriesCompleted: totalDeliveries,
        totalReviewsCount: reviewsCount,
      },
    },
    { new: true }
  )

  // Sync snapshot in active/recent exchanges
  await Exchange.updateMany(
    { volunteer: volunteerUserId },
    {
      $set: {
        'volunteerInfo.rating': avgRating,
        'volunteerInfo.deliveriesCompleted': totalDeliveries,
      },
    }
  )

  return { avgRating, reviewsCount, totalDeliveries, updatedProfile }
}

// GET /api/volunteers/me/reviews — get all reviews for this volunteer
export const getVolunteerReviews = asyncHandler(async (req, res) => {
  const exchanges = await Exchange.find({
    volunteer: req.user._id,
    status: 'completed',
    $or: [
      { 'donorFeedback.rating': { $gt: 0 } },
      { 'receiverFeedback.rating': { $gt: 0 } },
      { 'feedback.rating': { $gt: 0 } },
      { rating: { $gt: 0 } },
    ],
  })
    .populate('donation', 'title category quantity unit')
    .populate('receiver', 'fullName organizationName phone')
    .populate('donor', 'fullName organizationName phone')
    .sort({ updatedAt: -1 })

  const reviews = []

  for (const ex of exchanges) {
    let hasRoleFeedback = false

    // 1. Donor Feedback
    if (ex.donorFeedback?.rating && ex.donorFeedback.rating > 0) {
      reviews.push({
        _id: `${ex._id}_donor`,
        exchangeId: ex._id,
        orderNo: ex.orderNo || `FD-${ex._id.toString().slice(-6).toUpperCase()}`,
        rating: ex.donorFeedback.rating,
        comment: (ex.donorFeedback.comment || '').trim(),
        submittedAt: ex.donorFeedback.submittedAt || ex.deliveredAt || ex.updatedAt,
        deliveryTitle: ex.donation?.title || 'Food Delivery',
        category: ex.donation?.category || 'Cooked Meals',
        quantity: ex.donation?.quantity || 1,
        unit: ex.donation?.unit || 'Servings',
        reviewerName: ex.donor?.fullName || ex.donor?.organizationName || 'Donor Partner',
        reviewerRole: 'Donor',
      })
      hasRoleFeedback = true
    }

    // 2. Receiver Feedback
    if (ex.receiverFeedback?.rating && ex.receiverFeedback.rating > 0) {
      reviews.push({
        _id: `${ex._id}_receiver`,
        exchangeId: ex._id,
        orderNo: ex.orderNo || `FD-${ex._id.toString().slice(-6).toUpperCase()}`,
        rating: ex.receiverFeedback.rating,
        comment: (ex.receiverFeedback.comment || '').trim(),
        submittedAt: ex.receiverFeedback.submittedAt || ex.deliveredAt || ex.updatedAt,
        deliveryTitle: ex.donation?.title || 'Food Delivery',
        category: ex.donation?.category || 'Cooked Meals',
        quantity: ex.donation?.quantity || 1,
        unit: ex.donation?.unit || 'Servings',
        reviewerName: ex.receiver?.fullName || ex.receiver?.organizationName || 'Receiver Partner',
        reviewerRole: 'Receiver',
      })
      hasRoleFeedback = true
    }

    // 3. Fallback: Legacy feedback or rating (when specific role fields are unset)
    if (!hasRoleFeedback) {
      const legacyRating = ex.feedback?.rating || ex.rating
      if (legacyRating && legacyRating > 0) {
        const isDonor =
          ex.feedback?.role === 'donor' ||
          (ex.feedback?.submittedBy && ex.donor?._id && ex.feedback.submittedBy.equals(ex.donor._id))
        const reviewerRole = isDonor ? 'Donor' : 'Receiver'
        const reviewerName = isDonor
          ? (ex.donor?.fullName || ex.donor?.organizationName || 'Donor Partner')
          : (ex.receiver?.fullName || ex.receiver?.organizationName || 'Receiver Partner')

        reviews.push({
          _id: ex._id,
          exchangeId: ex._id,
          orderNo: ex.orderNo || `FD-${ex._id.toString().slice(-6).toUpperCase()}`,
          rating: legacyRating,
          comment: (ex.feedback?.comment || '').trim(),
          submittedAt: ex.feedback?.submittedAt || ex.deliveredAt || ex.updatedAt,
          deliveryTitle: ex.donation?.title || 'Food Delivery',
          category: ex.donation?.category || 'Cooked Meals',
          quantity: ex.donation?.quantity || 1,
          unit: ex.donation?.unit || 'Servings',
          reviewerName,
          reviewerRole,
        })
      }
    }
  }

  // Sort newest first by submission date
  reviews.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))

  const avgRating = reviews.length > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
    : 0

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        totalCount: reviews.length,
        averageRating: avgRating,
      },
      'Volunteer reviews fetched successfully.'
    )
  )
})

// GET /api/volunteers/me — fetch the logged-in volunteer's profile & live stats
export const getMyVolunteerProfile = asyncHandler(async (req, res) => {
  let profile = await VolunteerProfile.findOne({ user: req.user._id }).populate(
    'user',
    'fullName email phone city avatar'
  )

  if (!profile) {
    profile = await VolunteerProfile.create({
      user: req.user._id,
      availableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      preferredTime: 'Morning (09:00 - 12:00)',
      serviceRadius: '5 km',
      transportType: 'bicycle',
      guidelinesAccepted: true,
      reviewStatus: 'approved',
      isOnDuty: true,
    })
    profile = await VolunteerProfile.findById(profile._id).populate(
      'user',
      'fullName email phone city avatar'
    )
  }

  // Calculate live stats from actual completed exchanges
  const completedExchanges = await Exchange.find({
    volunteer: req.user._id,
    status: 'completed',
  }).populate('donation')

  const totalDeliveries = completedExchanges.length
  let totalMeals = 0
  completedExchanges.forEach((ex) => {
    totalMeals += (ex.donation?.quantity || 1)
  })
  const foodRescuedKg = Math.round(totalMeals * 0.4)
  const co2PreventedKg = Math.round(foodRescuedKg * 1.83)
  const hoursVolunteered = Math.round(totalDeliveries * 1.5)

  const allRatings = []
  completedExchanges.forEach((ex) => {
    let hasRoleFeedback = false
    if (typeof ex.donorFeedback?.rating === 'number' && ex.donorFeedback.rating > 0) {
      allRatings.push(ex.donorFeedback.rating)
      hasRoleFeedback = true
    }
    if (typeof ex.receiverFeedback?.rating === 'number' && ex.receiverFeedback.rating > 0) {
      allRatings.push(ex.receiverFeedback.rating)
      hasRoleFeedback = true
    }
    if (!hasRoleFeedback) {
      if (typeof ex.feedback?.rating === 'number' && ex.feedback.rating > 0) {
        allRatings.push(ex.feedback.rating)
      } else if (typeof ex.rating === 'number' && ex.rating > 0) {
        allRatings.push(ex.rating)
      }
    }
  })
  const reviewsCount = allRatings.length
  const avgRating = reviewsCount > 0
    ? Number((allRatings.reduce((sum, r) => sum + r, 0) / reviewsCount).toFixed(1))
    : 0

  // Persist synced rating & delivery count
  if (profile.rating !== avgRating || profile.totalDeliveriesCompleted !== totalDeliveries || profile.totalReviewsCount !== reviewsCount) {
    profile.rating = avgRating
    profile.totalDeliveriesCompleted = totalDeliveries
    profile.totalReviewsCount = reviewsCount
    await profile.save()
  }

  const stats = {
    totalDeliveriesCompleted: totalDeliveries,
    totalMealsDelivered: totalMeals,
    foodRescuedKg,
    co2PreventedKg,
    hoursVolunteered,
    rating: avgRating,
    reviewsCount,
  }

  return res.status(200).json(new ApiResponse(200, { profile, stats }, 'Volunteer profile fetched.'))
})

// PATCH /api/volunteers/me — update volunteer profile fields (availability, transport, duty, etc.)
export const updateMyVolunteerProfile = asyncHandler(async (req, res) => {
  const {
    isOnDuty,
    transportType,
    vehicleNumber,
    serviceRadius,
    operatingNeighborhood,
    emergencyContact,
    smartDispatch,
    fullName,
    phone,
  } = req.body

  let profile = await VolunteerProfile.findOne({ user: req.user._id })
  if (!profile) {
    profile = await VolunteerProfile.create({
      user: req.user._id,
      availableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      preferredTime: 'Morning (09:00 - 12:00)',
      serviceRadius: '5 km',
      transportType: transportType || 'bicycle',
      guidelinesAccepted: true,
      reviewStatus: 'approved',
      isOnDuty: true,
    })
  }

  if (typeof isOnDuty === 'boolean') profile.isOnDuty = isOnDuty
  if (transportType) profile.transportType = transportType
  if (vehicleNumber !== undefined) profile.vehicleNumber = vehicleNumber
  if (serviceRadius) profile.serviceRadius = serviceRadius
  if (operatingNeighborhood) profile.operatingNeighborhood = operatingNeighborhood
  if (emergencyContact !== undefined) profile.emergencyContact = emergencyContact
  if (typeof smartDispatch === 'boolean') profile.smartDispatch = smartDispatch

  await profile.save()

  if (fullName || phone) {
    await User.findByIdAndUpdate(req.user._id, {
      ...(fullName && { fullName: fullName.trim() }),
      ...(phone && { phone: phone.trim() }),
    })
  }

  profile = await VolunteerProfile.findById(profile._id).populate(
    'user',
    'fullName email phone city avatar'
  )

  return res.status(200).json(new ApiResponse(200, { profile }, 'Volunteer profile updated successfully.'))
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

// GET /api/volunteers/me/available-deliveries — list deliveries needing a volunteer courier
export const getAvailableDeliveries = asyncHandler(async (req, res) => {
  const deliveries = await Exchange.find({
    deliveryType: 'volunteer_delivery',
    status: 'searching_for_volunteer',
    volunteer: null,
  })
    .populate('donation', 'title category quantity unit imageUrl pickupAddress pickupWindow')
    .populate('donor', 'fullName phone city')
    .populate('receiver', 'fullName phone city')
    .sort({ createdAt: -1 })

  return res.status(200).json(
    new ApiResponse(200, { deliveries }, 'Available deliveries fetched.')
  )
})

// GET /api/volunteers/me/deliveries — list this volunteer's assigned deliveries
export const getMyDeliveries = asyncHandler(async (req, res) => {
  const { status } = req.query
  const filter = {
    volunteer: req.user._id,
  }

  if (status === 'active') {
    filter.status = { $in: ['volunteer_assigned', 'picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'] }
  } else if (status === 'completed') {
    filter.status = 'completed'
  }

  const deliveries = await Exchange.find(filter)
    .populate('donation', 'title category quantity unit imageUrl pickupAddress pickupWindow')
    .populate('donor', 'fullName phone city')
    .populate('receiver', 'fullName phone city')
    .sort({ updatedAt: -1 })

  const counts = {
    all: await Exchange.countDocuments({ volunteer: req.user._id }),
    active: await Exchange.countDocuments({
      volunteer: req.user._id,
      status: { $in: ['volunteer_assigned', 'picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'] },
    }),
    completed: await Exchange.countDocuments({ volunteer: req.user._id, status: 'completed' }),
    available: await Exchange.countDocuments({
      deliveryType: 'volunteer_delivery',
      status: 'searching_for_volunteer',
      volunteer: null,
    }),
  }

  // Sanitize: do NOT send pickupCode or deliveryCode to volunteer!
  // The volunteer must obtain pickupCode from donor and deliveryCode from receiver.
  const sanitized = deliveries.map((d) => {
    const doc = d.toObject()
    delete doc.pickupCode
    delete doc.deliveryCode
    return doc
  })

  return res.status(200).json(
    new ApiResponse(200, { deliveries: sanitized, counts }, 'Deliveries fetched.')
  )
})

// POST /api/volunteers/me/deliveries/:id/accept — volunteer accepts an available delivery
export const acceptDelivery = asyncHandler(async (req, res) => {
  const profile = await VolunteerProfile.findOne({ user: req.user._id })

  // Atomic findOneAndUpdate ensures strict concurrency control against race conditions
  const updatedExchange = await Exchange.findOneAndUpdate(
    {
      _id: req.params.id,
      deliveryType: 'volunteer_delivery',
      status: 'searching_for_volunteer',
      volunteer: null,
    },
    {
      $set: {
        volunteer: req.user._id,
        volunteerInfo: {
          name: req.user.fullName,
          phone: req.user.phone || '',
          avatar: req.user.avatar || '',
          rating: profile?.rating || 0,
          transportType: profile?.transportType || 'bicycle',
          vehicleNumber: profile?.vehicleNumber || '',
          deliveriesCompleted: profile?.totalDeliveriesCompleted || 0,
        },
        courierPhone: req.user.phone || '',
        volunteerStatus: 'assigned',
        status: 'volunteer_assigned',
        stage: 2,
      },
      $push: {
        timeline: {
          step: 'volunteer_assigned',
          title: `Volunteer Assigned (${req.user.fullName})`,
          time: new Date(),
          actor: 'Volunteer',
          note: `${req.user.fullName} accepted the delivery via ${profile?.transportType || 'courier'}. En route to pickup.`,
        },
      },
    },
    { new: true }
  )
    .populate('donation')
    .populate('donor', 'fullName')
    .populate('receiver', 'fullName')

  if (!updatedExchange) {
    const existing = await Exchange.findById(req.params.id)
    if (!existing) throw new ApiError(404, 'Delivery not found.')
    throw new ApiError(409, 'This delivery has already been accepted by another volunteer or is no longer available.')
  }

  // Notify donor (respects donor's volunteerCourierUpdates preference): Share pickup code upon arrival
  await createDonorNotification(updatedExchange.donor._id || updatedExchange.donor, {
    title: 'Volunteer Courier Assigned',
    message: `${req.user.fullName} has accepted your food delivery for ${updatedExchange.donation?.title}. Share your 4-digit pickup code #${updatedExchange.pickupCode} when they arrive.`,
    category: 'volunteerCourierUpdates',
    type: 'delivery',
    link: '/donor/exchanges',
    relatedId: updatedExchange._id,
  })

  // Notify receiver
  await safeNotify({
    user: updatedExchange.receiver._id || updatedExchange.receiver,
    title: 'Volunteer Assigned to Your Order',
    message: `${req.user.fullName} will be transporting ${updatedExchange.donation?.title} to your location.`,
    type: 'order',
    link: '/receiver/pickups',
  })

  const doc = updatedExchange.toObject()
  delete doc.pickupCode
  delete doc.deliveryCode

  return res.status(200).json(new ApiResponse(200, { delivery: doc }, 'Delivery accepted successfully!'))
})

// POST /api/volunteers/me/deliveries/:id/report-issue — volunteer reports issue & reassigns delivery run
export const reportIssueAndReassign = asyncHandler(async (req, res) => {
  const { reason, note } = req.body
  const exchange = await Exchange.findById(req.params.id)
    .populate('donation')
    .populate('donor', 'fullName')
    .populate('receiver', 'fullName')

  if (!exchange) throw new ApiError(404, 'Delivery not found.')

  if (!exchange.volunteer || !exchange.volunteer.equals(req.user._id)) {
    throw new ApiError(403, 'You are not assigned to this delivery.')
  }

  // Log OrderIssue record
  if (exchange.receiver) {
    await OrderIssue.create({
      order: exchange._id,
      receiver: exchange.receiver._id || exchange.receiver,
      issueType: reason === 'vehicle_problem' ? 'unresponsive_courier' : 'other',
      description: `Volunteer ${req.user.fullName} reported issue: ${reason || 'Delivery run issue'}. Details: ${note || 'Reassigned.'}`,
      status: 'open',
    }).catch(() => {})
  }

  // Release delivery run back to searching_for_volunteer
  exchange.volunteer = null
  exchange.volunteerInfo = {
    name: '',
    phone: '',
    avatar: '',
    rating: 0,
    transportType: 'other',
    vehicleNumber: '',
    deliveriesCompleted: 0,
  }
  exchange.courierPhone = ''
  exchange.volunteerStatus = 'searching_volunteer'
  exchange.status = 'searching_for_volunteer'
  exchange.stage = 1

  exchange.timeline.push({
    step: 'searching_for_volunteer',
    title: `Run Reassigned: ${reason || 'Volunteer Issue'}`,
    time: new Date(),
    actor: 'Volunteer',
    note: `${req.user.fullName} reported an issue (${reason || 'issue'}). Delivery is back in the pool for another courier.`,
  })

  await exchange.save()

  // Notify donor
  await safeNotify({
    user: exchange.donor._id || exchange.donor,
    title: 'Delivery Run Reassigned',
    message: `${req.user.fullName} had an unexpected issue (${reason || 'issue'}). Your delivery is back in the pool for another volunteer.`,
    type: 'exchange',
    link: '/donor/exchanges',
  })

  return res.status(200).json(new ApiResponse(200, null, 'Issue reported and delivery returned to pool.'))
})

// POST /api/volunteers/me/deliveries/:id/cancel — volunteer cancels before pickup
export const cancelDelivery = asyncHandler(async (req, res) => {
  const exchange = await Exchange.findById(req.params.id)
    .populate('donation')
    .populate('donor', 'fullName')

  if (!exchange) throw new ApiError(404, 'Delivery not found.')

  if (!exchange.volunteer || !exchange.volunteer.equals(req.user._id)) {
    throw new ApiError(403, 'You are not assigned to this delivery.')
  }

  if (exchange.status !== 'volunteer_assigned') {
    throw new ApiError(400, 'Cannot cancel a delivery that has already been picked up or completed.')
  }

  // Reset to searching state without fake volunteer
  exchange.volunteer = null
  exchange.volunteerInfo = {
    name: '',
    phone: '',
    avatar: '',
    rating: 0,
    transportType: 'other',
    vehicleNumber: '',
    deliveriesCompleted: 0,
  }
  exchange.courierPhone = ''
  exchange.volunteerStatus = 'searching_volunteer'
  exchange.status = 'searching_for_volunteer'
  exchange.stage = 1

  exchange.timeline.push({
    step: 'accepted',
    title: 'Volunteer Cancelled — Re-opened for Assignment',
    time: new Date(),
    actor: 'Volunteer',
    note: `${req.user.fullName} had to cancel. Order is back in the available pool for another volunteer.`,
  })

  await exchange.save()

  // Notify donor (respects donor's volunteerCourierUpdates preference)
  await createDonorNotification(exchange.donor._id || exchange.donor, {
    title: 'Volunteer Courier Re-assignment',
    message: `${req.user.fullName} cancelled their pickup. Your delivery has been placed back in the pool for another volunteer.`,
    category: 'volunteerCourierUpdates',
    type: 'delivery',
    link: '/donor/exchanges',
    relatedId: exchange._id,
  })

  return res.status(200).json(new ApiResponse(200, null, 'Delivery cancelled and reopened for assignment.'))
})

// POST /api/volunteers/me/deliveries/:id/verify-pickup — volunteer verifies pickup code from donor
export const verifyVolunteerPickup = asyncHandler(async (req, res) => {
  const { code } = req.body
  const exchange = await Exchange.findById(req.params.id)
    .populate('donation')
    .populate('donor', 'fullName')
    .populate('receiver', 'fullName')

  if (!exchange) throw new ApiError(404, 'Delivery not found.')

  if (!exchange.volunteer || !exchange.volunteer.equals(req.user._id)) {
    throw new ApiError(403, 'You are not assigned to this delivery.')
  }

  if (exchange.status !== 'volunteer_assigned') {
    if (['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit', 'completed'].includes(exchange.status)) {
      throw new ApiError(400, 'Pickup has already been verified for this delivery.')
    }
    throw new ApiError(400, `Cannot verify pickup when delivery status is '${exchange.status}'.`)
  }

  const cleanEntered = (code || '').toString().replace(/[^0-9]/g, '')
  const cleanExpected = (exchange.pickupCode || '').toString().replace(/[^0-9]/g, '')

  if (!cleanEntered || cleanEntered !== cleanExpected) {
    throw new ApiError(400, 'Incorrect verification code. Please ask the donor for the correct code.')
  }

  // Code verified! Consumed for first handover
  exchange.status = 'picked_up_by_volunteer'
  exchange.volunteerStatus = 'picked_up'
  exchange.stage = 3
  exchange.pickedUpAt = new Date()
  exchange.pickedUpBy = req.user._id

  exchange.timeline.push({
    step: 'picked_up_by_volunteer',
    title: 'Food Picked Up by Courier',
    time: new Date(),
    actor: 'Volunteer',
    note: `${req.user.fullName} entered the matching 4-digit pickup code and collected ${exchange.donation?.title || 'food'}.`,
  })

  await exchange.save()

  // Notify donor that handover is complete (respects donor's volunteerCourierUpdates preference)
  await createDonorNotification(exchange.donor._id || exchange.donor, {
    title: 'Food Picked Up by Courier',
    message: `${req.user.fullName} verified your pickup code and has collected the food. Your handover is complete!`,
    category: 'volunteerCourierUpdates',
    type: 'delivery',
    link: '/donor/exchanges',
    relatedId: exchange._id,
  })

  // Notify receiver that food is picked up and inform them of their delivery code
  await safeNotify({
    user: exchange.receiver._id || exchange.receiver,
    title: 'Your Food is on the Way!',
    message: `${req.user.fullName} collected your food from the donor. Share your Delivery Verification Code #${exchange.deliveryCode} when they arrive.`,
    type: 'order',
    link: '/receiver/pickups',
  })

  const doc = exchange.toObject()
  delete doc.pickupCode
  delete doc.deliveryCode

  return res.status(200).json(new ApiResponse(200, { delivery: doc }, 'Pickup verified successfully!'))
})

// POST /api/volunteers/me/deliveries/:id/start-delivery — volunteer starts transit to receiver
export const startVolunteerDelivery = asyncHandler(async (req, res) => {
  const exchange = await Exchange.findById(req.params.id)
    .populate('donation')
    .populate('receiver', 'fullName')

  if (!exchange) throw new ApiError(404, 'Delivery not found.')

  if (!exchange.volunteer || !exchange.volunteer.equals(req.user._id)) {
    throw new ApiError(403, 'You are not assigned to this delivery.')
  }

  if (exchange.status !== 'picked_up_by_volunteer') {
    throw new ApiError(400, 'Must verify pickup before starting delivery.')
  }

  exchange.status = 'out_for_delivery'
  exchange.volunteerStatus = 'in_transit'
  exchange.stage = 4

  exchange.timeline.push({
    step: 'out_for_delivery',
    title: 'Out for Delivery',
    time: new Date(),
    actor: 'Volunteer',
    note: `${req.user.fullName} is en route to the dropoff location.`,
  })

  await exchange.save()

  // Notify receiver
  await safeNotify({
    user: exchange.receiver._id || exchange.receiver,
    title: 'Volunteer Courier En Route',
    message: `${req.user.fullName} is heading to your dropoff address with ${exchange.donation?.title}.`,
    type: 'order',
    link: '/receiver/pickups',
  })

  const doc = exchange.toObject()
  delete doc.pickupCode
  delete doc.deliveryCode

  return res.status(200).json(new ApiResponse(200, { delivery: doc }, 'Delivery is now in transit.'))
})

// POST /api/volunteers/me/deliveries/:id/verify-delivery — volunteer verifies delivery code from receiver
export const verifyVolunteerDelivery = asyncHandler(async (req, res) => {
  const { code } = req.body
  const exchange = await Exchange.findById(req.params.id)
    .populate('donation')
    .populate('donor', 'fullName')
    .populate('receiver', 'fullName')

  if (!exchange) throw new ApiError(404, 'Delivery not found.')

  if (!exchange.volunteer || !exchange.volunteer.equals(req.user._id)) {
    throw new ApiError(403, 'You are not assigned to this delivery.')
  }

  const allowedStatuses = ['out_for_delivery', 'picked_up_by_volunteer', 'in_transit']
  if (!allowedStatuses.includes(exchange.status)) {
    if (exchange.status === 'completed') {
      return res.status(200).json(new ApiResponse(200, { delivery: exchange.toObject() }, 'Delivery already completed.'))
    }
    throw new ApiError(400, `Cannot verify delivery when status is '${exchange.status}'.`)
  }

  const cleanEntered = (code || '').toString().replace(/[^0-9]/g, '')
  const cleanExpected = (exchange.deliveryCode || '').toString().replace(/[^0-9]/g, '')

  if (!cleanEntered || cleanEntered !== cleanExpected) {
    throw new ApiError(400, 'Incorrect verification code. Please ask the receiver for their delivery code.')
  }

  // Delivery Code verified! Complete exchange
  exchange.status = 'completed'
  exchange.volunteerStatus = 'delivered'
  exchange.stage = 5
  exchange.deliveredAt = new Date()
  exchange.deliveredBy = req.user._id
  exchange.handoverConfirmed = true

  exchange.timeline.push({
    step: 'completed',
    title: 'Delivery Confirmed & Completed',
    time: new Date(),
    actor: 'Volunteer',
    note: `${req.user.fullName} verified the receiver's 4-digit delivery code. Physical handover complete.`,
  })

  if (exchange.donation) {
    const donationId = exchange.donation._id || exchange.donation
    await FoodDonation.findByIdAndUpdate(donationId, { status: 'completed' })
  }

  await exchange.save()

  // Update profile metrics
  await VolunteerProfile.findOneAndUpdate(
    { user: req.user._id },
    { $inc: { totalDeliveriesCompleted: 1 } }
  )

  await ReceiverProfile.findOneAndUpdate(
    { user: exchange.receiver._id || exchange.receiver },
    { $inc: { totalDonationsReceived: 1 } }
  )

  const meals = exchange.donation?.quantity || 1
  await DonorProfile.findOneAndUpdate(
    { user: exchange.donor._id || exchange.donor },
    { $inc: { totalMealsShared: meals } }
  )

  // Notify receiver
  await safeNotify({
    user: exchange.receiver._id || exchange.receiver,
    title: 'Food Donation Delivered',
    message: `${req.user.fullName} completed the delivery of ${exchange.donation?.title}. Please leave a rating & feedback!`,
    type: 'order',
    link: '/receiver/history',
  })

  // Notify donor (respects donor's exchangeCompleted preference)
  await createDonorNotification(exchange.donor._id || exchange.donor, {
    title: 'Delivery Completed',
    message: `Your food donation ${exchange.donation?.title} was safely delivered to the receiver by ${req.user.fullName}.`,
    category: 'exchangeCompleted',
    type: 'exchange_completed',
    link: '/donor/exchanges',
    relatedId: exchange._id,
  })

  const doc = exchange.toObject()
  delete doc.pickupCode
  delete doc.deliveryCode

  return res.status(200).json(new ApiResponse(200, { delivery: doc }, 'Delivery confirmed and completed successfully!'))
})

// PATCH /api/volunteers/me/deliveries/:id/location — live GPS broadcast from volunteer
export const updateDeliveryLocation = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { lat, lng, heading } = req.body

  if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) {
    throw new ApiError(400, 'Valid lat and lng numbers are required.')
  }

  const exchange = await Exchange.findOneAndUpdate(
    {
      _id: id,
      volunteer: req.user._id,
      status: { $in: ['volunteer_assigned', 'picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'] },
    },
    {
      $set: {
        volunteerCoords: {
          lat: Number(lat),
          lng: Number(lng),
          heading: heading != null && !isNaN(Number(heading)) ? Number(heading) : null,
          updatedAt: new Date(),
        },
      },
    },
    { new: true }
  )

  if (!exchange) {
    throw new ApiError(404, 'Active delivery not found for this volunteer.')
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        volunteerCoords: exchange.volunteerCoords,
        status: exchange.status,
      },
      'Location updated successfully.'
    )
  )
})
