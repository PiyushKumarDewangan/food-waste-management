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
import { autoCancelExpiredDonationsAndExchanges } from '../utils/expiryManager.js'
import { calculateRoadDistanceKm, geocodeAddress } from '../utils/googleMapsService.js'

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
  let totalDistanceKm = 0
  let totalVolunteeredMinutes = 0

  completedExchanges.forEach((ex) => {
    totalMeals += (ex.donation?.quantity || 1)

    // Calculate distance from recorded distance or coordinates
    let dist = 0
    if (typeof ex.distance === 'number' && ex.distance > 0) {
      dist = ex.distance
    } else if (typeof ex.distance === 'string' && parseFloat(ex.distance) > 0) {
      dist = parseFloat(ex.distance)
    } else if (ex.pickupCoords?.lat != null && ex.dropoffCoords?.lat != null) {
      const R = 6371
      const dLat = ((ex.dropoffCoords.lat - ex.pickupCoords.lat) * Math.PI) / 180
      const dLon = ((ex.dropoffCoords.lng - ex.pickupCoords.lng) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((ex.pickupCoords.lat * Math.PI) / 180) *
          Math.cos((ex.dropoffCoords.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      dist = Number((R * c).toFixed(1))
    } else {
      dist = 3.5
    }
    totalDistanceKm += dist

    // Calculate actual hours volunteered from recorded timestamps
    if (ex.deliveredAt && ex.pickedUpAt) {
      const diffMs = new Date(ex.deliveredAt) - new Date(ex.pickedUpAt)
      if (diffMs > 0 && diffMs < 12 * 3600 * 1000) {
        totalVolunteeredMinutes += Math.round(diffMs / 60000)
      } else {
        totalVolunteeredMinutes += 30
      }
    } else if (ex.deliveredAt && ex.createdAt) {
      const diffMs = new Date(ex.deliveredAt) - new Date(ex.createdAt)
      if (diffMs > 0 && diffMs < 6 * 3600 * 1000) {
        totalVolunteeredMinutes += Math.round(diffMs / 60000)
      } else {
        totalVolunteeredMinutes += 30
      }
    } else {
      totalVolunteeredMinutes += 30
    }
  })

  totalDistanceKm = Number(totalDistanceKm.toFixed(1))
  const foodRescuedKg = Math.round(totalMeals * 0.4)
  const co2PreventedKg = Math.round(foodRescuedKg * 1.83)
  const hoursVolunteered = Number((totalVolunteeredMinutes / 60).toFixed(1))

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
    totalDistanceKm,
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
    lat,
    lng,
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

  // Enforce: Bicycle and Walking have no vehicle registration number
  const activeTransport = transportType || profile.transportType || 'bicycle'
  if (['walking', 'bicycle'].includes(activeTransport)) {
    profile.vehicleNumber = ''
  } else if (vehicleNumber !== undefined) {
    profile.vehicleNumber = vehicleNumber.trim()
  }

  // Manage kilometer limit based on vehicle type
  if (serviceRadius) {
    const rawKm = parseInt(serviceRadius) || 5
    let maxAllowed = 25
    if (activeTransport === 'walking') maxAllowed = 5
    else if (activeTransport === 'bicycle') maxAllowed = 12
    else if (activeTransport === 'motorcycle') maxAllowed = 20
    const clampedKm = Math.min(Math.max(1, rawKm), maxAllowed)
    profile.serviceRadius = `${clampedKm} km`
  }
  if (operatingNeighborhood) profile.operatingNeighborhood = operatingNeighborhood
  if (lat != null && !isNaN(Number(lat))) profile.lat = Number(lat)
  if (lng != null && !isNaN(Number(lng))) profile.lng = Number(lng)
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
// :id refers to the VolunteerProfile _id or User _id
export const approveVolunteer = asyncHandler(async (req, res) => {
  let profile = await VolunteerProfile.findById(req.params.id)
  if (!profile && mongoose.Types.ObjectId.isValid(req.params.id)) {
    profile = await VolunteerProfile.findOne({ user: req.params.id })
  }
  if (!profile) throw new ApiError(404, 'Volunteer profile not found.')

  if (profile.reviewStatus === 'approved') {
    const user = profile.user ? await User.findById(profile.user) : null
    return res
      .status(200)
      .json(new ApiResponse(200, { profile, user: user?.toSafeObject ? user.toSafeObject() : user }, 'Volunteer is already approved.'))
  }

  profile.reviewStatus = 'approved'
  profile.reviewedBy = req.user._id
  profile.reviewedAt = new Date()
  profile.rejectionReason = null
  await profile.save()

  const user = profile.user ? await User.findByIdAndUpdate(profile.user, { status: 'active' }, { new: true }) : null

  return res
    .status(200)
    .json(new ApiResponse(200, { profile, user: user?.toSafeObject ? user.toSafeObject() : user }, 'Volunteer approved successfully.'))
})

// PATCH /api/volunteers/:id/reject — admin-only: reject a volunteer's registration
// Body: { reason?: string }
export const rejectVolunteer = asyncHandler(async (req, res) => {
  let profile = await VolunteerProfile.findById(req.params.id)
  if (!profile && mongoose.Types.ObjectId.isValid(req.params.id)) {
    profile = await VolunteerProfile.findOne({ user: req.params.id })
  }
  if (!profile) throw new ApiError(404, 'Volunteer profile not found.')

  if (profile.reviewStatus === 'rejected') {
    const user = profile.user ? await User.findById(profile.user) : null
    return res
      .status(200)
      .json(new ApiResponse(200, { profile, user: user?.toSafeObject ? user.toSafeObject() : user }, 'Volunteer is already rejected.'))
  }

  profile.reviewStatus = 'rejected'
  profile.reviewedBy = req.user._id
  profile.reviewedAt = new Date()
  profile.rejectionReason = req.body?.reason || 'Did not meet verification criteria.'
  await profile.save()

  const user = profile.user ? await User.findByIdAndUpdate(profile.user, { status: 'rejected' }, { new: true }) : null

  return res
    .status(200)
    .json(new ApiResponse(200, { profile, user: user?.toSafeObject ? user.toSafeObject() : user }, 'Volunteer rejected.'))
})

// Helper to compute Haversine distance in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null
  const R = 6371
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((R * c).toFixed(1))
}

// GET /api/volunteers/me/available-deliveries — list deliveries needing a volunteer courier
export const getAvailableDeliveries = asyncHandler(async (req, res) => {
  await autoCancelExpiredDonationsAndExchanges()

  const profile = await VolunteerProfile.findOne({ user: req.user._id })
  if (profile && profile.isOnDuty === false && req.query.includeOffDuty !== 'true') {
    return res.status(200).json(
      new ApiResponse(200, { deliveries: [] }, 'Volunteer is currently off-duty.')
    )
  }

  const deliveries = await Exchange.find({
    deliveryType: 'volunteer_delivery',
    status: 'searching_for_volunteer',
    volunteer: null,
  })
    .populate('donation', 'title category quantity unit imageUrl pickupAddress pickupWindow lat lng donorOrganization')
    .populate('items.donation', 'title category quantity unit imageUrl')
    .populate('donor', 'fullName phone city address')
    .populate('receiver', 'fullName phone city address organizationName')
    .sort({ createdAt: -1 })

  // Fill in coordinates & receiver details
  const populated = await Promise.all(
    deliveries.map(async (d) => {
      const doc = d.toObject()
      if ((!doc.pickupCoords || doc.pickupCoords.lat == null) && doc.donation?.lat != null) {
        doc.pickupCoords = { lat: doc.donation.lat, lng: doc.donation.lng }
      }

      // Look up and prioritize actual Donor Profile address
      if (doc.donor) {
        const dProfile = await DonorProfile.findOne({ user: doc.donor._id || doc.donor }).lean()
        if (dProfile?.pickupAddress) {
          doc.pickupAddress = dProfile.pickupAddress
        } else if (doc.donor?.address && (!doc.pickupAddress || ['Donor Address', 'Donor Pickup Location', 'Indore'].includes(doc.pickupAddress.trim()))) {
          doc.pickupAddress = doc.donor.address
        }
      }

      // Look up and prioritize actual Receiver Profile address (dropoffAddress entered by receiver in Profile)
      if (doc.receiver) {
        const rProfile = await ReceiverProfile.findOne({ user: doc.receiver._id || doc.receiver }).lean()
        if (rProfile) {
          if (rProfile.lat != null && rProfile.lng != null && (!doc.dropoffCoords || doc.dropoffCoords.lat == null)) {
            doc.dropoffCoords = { lat: rProfile.lat, lng: rProfile.lng }
          }
          // Prioritize dropoffAddress entered by user in Profile
          const realReceiverAddr =
            (rProfile.dropoffAddress && !['87 Elm Street, Downtown, CA 90210', 'Receiver Address', 'Indore'].includes(rProfile.dropoffAddress.trim())
              ? rProfile.dropoffAddress.trim()
              : null) ||
            (doc.receiver?.address && !['Indore'].includes(doc.receiver.address.trim()) ? doc.receiver.address.trim() : null) ||
            (rProfile.organizationAddress && !['87 Elm Street, Downtown, CA 90210', 'Receiver Address', 'Indore'].includes(rProfile.organizationAddress.trim())
              ? rProfile.organizationAddress.trim()
              : null) ||
            rProfile.dropoffAddress ||
            rProfile.organizationAddress ||
            ''
          if (realReceiverAddr) {
            doc.dropoffAddress = realReceiverAddr
            if (doc._id) {
              Exchange.updateOne({ _id: doc._id }, { $set: { dropoffAddress: realReceiverAddr } }).catch(() => {})
            }
          }
        }
        if (!doc.dropoffAddress || ['Receiver Address', 'Receiver Delivery Address', 'Indore'].includes(doc.dropoffAddress.trim())) {
          if (doc.receiver?.address) {
            doc.dropoffAddress = doc.receiver.address
          }
        }
      }

      if (!doc.distance && doc.pickupCoords?.lat != null && doc.dropoffCoords?.lat != null) {
        const km = await calculateRoadDistanceKm(
          doc.pickupCoords.lat,
          doc.pickupCoords.lng,
          doc.dropoffCoords.lat,
          doc.dropoffCoords.lng,
          profile?.transportType || 'car'
        )
        if (km) doc.distance = `${km} km`
      }
      return doc
    })
  )

  const maxRadiusKm = parseInt(profile?.serviceRadius) || 25
  const deliveriesToReturn = populated.map((doc) => {
    const km = parseFloat(doc.distance)
    const exceedsDefaultRadius = !isNaN(km) && km > maxRadiusKm
    return {
      ...doc,
      exceedsDefaultRadius,
      suggestedTransport: !isNaN(km) && km > 15 ? 'car' : !isNaN(km) && km > 6 ? 'motorcycle' : (profile?.transportType || 'bicycle'),
    }
  })

  // Sort available pool with newest first
  deliveriesToReturn.sort((a, b) => {
    const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime()
    const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime()
    return timeB - timeA
  })

  return res.status(200).json(
    new ApiResponse(200, { deliveries: deliveriesToReturn }, 'Available deliveries fetched.')
  )
})

// GET /api/volunteers/me/dispatch-request — returns the genuine available or latest dispatch request for modal preview / accept
export const getLatestDispatchRequest = asyncHandler(async (req, res) => {
  await autoCancelExpiredDonationsAndExchanges()

  const profile = await VolunteerProfile.findOne({ user: req.user._id })
  if (profile && profile.isOnDuty === false) {
    return res.status(200).json(
      new ApiResponse(200, { delivery: null }, 'Volunteer is currently off-duty. No incoming dispatches.')
    )
  }

  const transportType = profile?.transportType || 'bicycle'
  let defaultSimKm = '1.8 km'
  if (transportType === 'walking') defaultSimKm = '1.2 km'
  else if (transportType === 'bicycle') defaultSimKm = '2.4 km'
  else if (transportType === 'motorcycle') defaultSimKm = '5.5 km'
  else defaultSimKm = '8.0 km'

  // 1. First priority: Real unassigned exchange needing volunteer courier
  let exchange = await Exchange.findOne({
    deliveryType: 'volunteer_delivery',
    status: 'searching_for_volunteer',
    volunteer: null,
  })
    .populate('donation', 'title category quantity unit imageUrl pickupAddress pickupWindow lat lng donorOrganization')
    .populate('items.donation', 'title category quantity unit imageUrl')
    .populate('donor', 'fullName phone city address')
    .populate('receiver', 'fullName phone city address organizationName')
    .sort({ createdAt: -1 })

  // 2. Second priority: If no unassigned, look for any exchange involving this volunteer or in the system
  if (!exchange) {
    exchange = await Exchange.findOne({
      $or: [
        { volunteer: req.user._id },
        { 'volunteerInfo.name': req.user.fullName },
        { status: { $in: ['volunteer_assigned', 'picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit', 'searching_for_volunteer'] } },
      ],
    })
      .populate('donation', 'title category quantity unit imageUrl pickupAddress pickupWindow lat lng donorOrganization')
      .populate('items.donation', 'title category quantity unit imageUrl')
      .populate('donor', 'fullName phone city address')
      .populate('receiver', 'fullName phone city address organizationName')
      .sort({ updatedAt: -1 })
  }

  // 3. Third priority: Any recent exchange in the system
  if (!exchange) {
    exchange = await Exchange.findOne({})
      .populate('donation', 'title category quantity unit imageUrl pickupAddress pickupWindow lat lng donorOrganization')
      .populate('items.donation', 'title category quantity unit imageUrl')
      .populate('donor', 'fullName phone city address')
      .populate('receiver', 'fullName phone city address organizationName')
      .sort({ updatedAt: -1 })
  }

  if (exchange) {
    const doc = exchange.toObject()
    if ((!doc.pickupCoords || doc.pickupCoords.lat == null) && doc.donation?.lat != null) {
      doc.pickupCoords = { lat: doc.donation.lat, lng: doc.donation.lng }
    }
    if ((!doc.dropoffCoords || doc.dropoffCoords.lat == null) && doc.receiver) {
      const rProfile = await ReceiverProfile.findOne({ user: doc.receiver._id || doc.receiver }).lean()
      if (rProfile) {
        if (rProfile.lat != null && rProfile.lng != null) {
          doc.dropoffCoords = { lat: rProfile.lat, lng: rProfile.lng }
        }
        if (!doc.dropoffAddress) {
          doc.dropoffAddress = rProfile.dropoffAddress || rProfile.organizationAddress || ''
        }
      }
    }
    if (!doc.distance && doc.pickupCoords?.lat != null && doc.dropoffCoords?.lat != null) {
      const km = await calculateRoadDistanceKm(
        doc.pickupCoords.lat,
        doc.pickupCoords.lng,
        doc.dropoffCoords.lat,
        doc.dropoffCoords.lng,
        profile?.transportType || 'car'
      )
      if (km) doc.distance = `${km} km`
    }
    return res.status(200).json(
      new ApiResponse(200, { delivery: doc }, 'Dispatch request retrieved.')
    )
  }

  // 4. Fourth priority: Most recent FoodDonation (e.g. Rasmalai)
  const donation = await FoodDonation.findOne({ status: { $ne: 'expired' } })
    .populate('donor', 'fullName phone city address')
    .sort({ createdAt: -1 })

  if (donation) {
    return res.status(200).json(
      new ApiResponse(200, {
        delivery: {
          _id: donation._id,
          isDonationOnly: true,
          donation,
          donor: donation.donor,
          donorName: donation.donorOrganization || donation.donor?.fullName || 'Local Community Donor',
          pickupAddress: donation.pickupAddress || donation.donor?.address || 'Donor Pickup Location',
          receiverOrg: 'Community Food Shelter',
          dropoffAddress: 'Community Distribution Center',
          title: donation.title,
          servings: donation.quantity,
          unit: donation.unit,
          distance: `~${defaultSimKm} away`,
        }
      }, 'Live donation request retrieved.')
    )
  }

  return res.status(200).json(
    new ApiResponse(200, { delivery: null }, 'No delivery requests available.')
  )
})

// GET /api/volunteers/me/deliveries — list this volunteer's assigned deliveries
export const getMyDeliveries = asyncHandler(async (req, res) => {
  await autoCancelExpiredDonationsAndExchanges()

  const userVolId = req.user._id
  const userName = req.user.fullName
  const volunteerProfile = await VolunteerProfile.findOne({ user: userVolId }).lean()

  // Auto-link any cancelled exchanges that this volunteer accepted or reported on
  if (userName) {
    await Exchange.updateMany(
      {
        volunteer: null,
        status: 'cancelled',
        $or: [
          { 'volunteerInfo.name': userName },
          { 'timeline.note': new RegExp(userName, 'i') },
        ],
      },
      { $set: { volunteer: userVolId } }
    )
  }

  const { status } = req.query

  const volunteerFilter = {
    $or: [
      { volunteer: userVolId },
      ...(userName ? [{ 'volunteerInfo.name': userName }] : []),
    ],
  }

  let filter = { ...volunteerFilter }

  if (status === 'active') {
    filter.status = { $in: ['volunteer_assigned', 'picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'] }
  } else if (status === 'completed') {
    filter.status = 'completed'
  } else if (status === 'cancelled') {
    filter.status = 'cancelled'
  } else if (status === 'history') {
    filter.status = { $in: ['completed', 'cancelled'] }
  } else if (status && status !== 'all') {
    filter.status = status
  }

  const deliveries = await Exchange.find(filter)
    .populate('donation', 'title category quantity unit imageUrl pickupAddress pickupWindow lat lng donorOrganization')
    .populate('items.donation', 'title category quantity unit imageUrl')
    .populate('donor', 'fullName phone city address')
    .populate('receiver', 'fullName phone city address organizationName')
    .sort({ updatedAt: -1 })

  const counts = {
    all: await Exchange.countDocuments(volunteerFilter),
    active: await Exchange.countDocuments({
      ...volunteerFilter,
      status: { $in: ['volunteer_assigned', 'picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'] },
    }),
    completed: await Exchange.countDocuments({ ...volunteerFilter, status: 'completed' }),
    cancelled: await Exchange.countDocuments({ ...volunteerFilter, status: 'cancelled' }),
    available: await Exchange.countDocuments({
      deliveryType: 'volunteer_delivery',
      status: 'searching_for_volunteer',
      volunteer: null,
    }),
  }

  // Sanitize: do NOT send pickupCode or deliveryCode to volunteer!
  // The volunteer must obtain pickupCode from donor and deliveryCode from receiver.
  const populated = await Promise.all(
    deliveries.map(async (d) => {
      const doc = d.toObject()
      delete doc.pickupCode
      delete doc.deliveryCode

      // Attach cancellation reason if cancelled
      if (doc.status === 'cancelled') {
        const lastCancelled = (doc.timeline || []).filter((t) => t.step === 'cancelled').pop()
        doc.cancellationReason =
          lastCancelled?.note ||
          lastCancelled?.title ||
          'Safe consumption window passed or delivery cancelled.'
        doc.cancelledAt = lastCancelled?.time || doc.updatedAt
      }

      if ((!doc.pickupCoords || doc.pickupCoords.lat == null) && doc.donation?.lat != null) {
        doc.pickupCoords = { lat: doc.donation.lat, lng: doc.donation.lng }
      }

      // Look up and prioritize actual Donor Profile address
      if (doc.donor) {
        const dProfile = await DonorProfile.findOne({ user: doc.donor._id || doc.donor }).lean()
        if (dProfile?.pickupAddress) {
          doc.pickupAddress = dProfile.pickupAddress
        } else if (doc.donor?.address && (!doc.pickupAddress || ['Donor Address', 'Donor Pickup Location', 'Indore'].includes(doc.pickupAddress.trim()))) {
          doc.pickupAddress = doc.donor.address
        }
      }

      // Look up and prioritize actual Receiver Profile address (dropoffAddress entered by receiver in Profile)
      if (doc.receiver) {
        const rProfile = await ReceiverProfile.findOne({ user: doc.receiver._id || doc.receiver }).lean()
        if (rProfile) {
          if (rProfile.lat != null && rProfile.lng != null && (!doc.dropoffCoords || doc.dropoffCoords.lat == null)) {
            doc.dropoffCoords = { lat: rProfile.lat, lng: rProfile.lng }
          }
          // Prioritize dropoffAddress entered by user in Profile
          const realReceiverAddr =
            (rProfile.dropoffAddress && !['87 Elm Street, Downtown, CA 90210', 'Receiver Address', 'Indore'].includes(rProfile.dropoffAddress.trim())
              ? rProfile.dropoffAddress.trim()
              : null) ||
            (doc.receiver?.address && !['Indore'].includes(doc.receiver.address.trim()) ? doc.receiver.address.trim() : null) ||
            (rProfile.organizationAddress && !['87 Elm Street, Downtown, CA 90210', 'Receiver Address', 'Indore'].includes(rProfile.organizationAddress.trim())
              ? rProfile.organizationAddress.trim()
              : null) ||
            rProfile.dropoffAddress ||
            rProfile.organizationAddress ||
            ''
          if (realReceiverAddr) {
            doc.dropoffAddress = realReceiverAddr
            if (doc._id) {
              Exchange.updateOne({ _id: doc._id }, { $set: { dropoffAddress: realReceiverAddr } }).catch(() => {})
            }
          }
        }
        if (!doc.dropoffAddress || ['Receiver Address', 'Receiver Delivery Address', 'Indore'].includes(doc.dropoffAddress.trim())) {
          if (doc.receiver?.address) {
            doc.dropoffAddress = doc.receiver.address
          }
        }
      }
      // Auto-resolve missing coordinates dynamically
      if ((!doc.pickupCoords || doc.pickupCoords.lat == null) && doc.pickupAddress) {
        const geoP = await geocodeAddress(doc.pickupAddress)
        if (geoP) doc.pickupCoords = { lat: geoP.lat, lng: geoP.lng }
      }
      if ((!doc.dropoffCoords || doc.dropoffCoords.lat == null) && doc.dropoffAddress) {
        const geoD = await geocodeAddress(doc.dropoffAddress)
        if (geoD) doc.dropoffCoords = { lat: geoD.lat, lng: geoD.lng }
      }

      if (!doc.distance && doc.pickupCoords?.lat != null && doc.dropoffCoords?.lat != null) {
        const taskTransport =
          doc.transportType ||
          doc.volunteerInfo?.transportType ||
          volunteerProfile?.transportType ||
          'car'
        try {
          const km = await calculateRoadDistanceKm(
            doc.pickupCoords.lat,
            doc.pickupCoords.lng,
            doc.dropoffCoords.lat,
            doc.dropoffCoords.lng,
            taskTransport
          )
          if (km) doc.distance = `${km} km`
        } catch {
          const hDist = calculateDistanceKm(
            doc.pickupCoords.lat,
            doc.pickupCoords.lng,
            doc.dropoffCoords.lat,
            doc.dropoffCoords.lng
          )
          if (hDist) doc.distance = `${hDist} km`
        }
      }
      return doc
    })
  )

  // Sort deliveries with most recent at top and older ones at bottom
  populated.sort((a, b) => {
    const timeB = new Date(b.deliveredAt || b.cancelledAt || b.updatedAt || b.createdAt || 0).getTime()
    const timeA = new Date(a.deliveredAt || a.cancelledAt || a.updatedAt || a.createdAt || 0).getTime()
    return timeB - timeA
  })

  return res.status(200).json(
    new ApiResponse(200, { deliveries: populated, counts }, 'Deliveries fetched.')
  )
})

// POST /api/volunteers/me/deliveries/:id/accept — volunteer accepts an available delivery
export const acceptDelivery = asyncHandler(async (req, res) => {
  const profile = await VolunteerProfile.findOne({ user: req.user._id })
  if (profile && profile.isOnDuty === false) {
    throw new ApiError(400, 'You are currently off-duty. Please switch to on-duty to accept new deliveries.')
  }

  const taskTransport = req.body?.transportType || profile?.transportType || 'bicycle'
  const taskVehicleNumber = req.body?.vehicleNumber || (taskTransport === profile?.transportType ? profile?.vehicleNumber : '') || ''

  // Resolve initial volunteer dispatch coordinates (live GPS > profile base location > geocoded base neighborhood)
  let volLat = req.body?.lat != null && !isNaN(Number(req.body.lat)) ? Number(req.body.lat) : (profile?.lat ?? null)
  let volLng = req.body?.lng != null && !isNaN(Number(req.body.lng)) ? Number(req.body.lng) : (profile?.lng ?? null)

  if ((volLat == null || volLng == null) && profile?.operatingNeighborhood) {
    const geoVol = await geocodeAddress(profile.operatingNeighborhood)
    if (geoVol) {
      volLat = geoVol.lat
      volLng = geoVol.lng
    }
  }

  const volunteerCoordsPayload = (volLat != null && volLng != null) ? { lat: volLat, lng: volLng } : null

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
          transportType: taskTransport,
          vehicleNumber: taskVehicleNumber,
          deliveriesCompleted: profile?.totalDeliveriesCompleted || 0,
        },
        courierPhone: req.user.phone || '',
        volunteerCoords: volunteerCoordsPayload,
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
          note: `${req.user.fullName} accepted the delivery via ${taskTransport}. En route to pickup.`,
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

  // Notify volunteer
  await safeNotify({
    user: req.user._id,
    title: 'Delivery Run Assigned',
    message: `You accepted the delivery for ${updatedExchange.donation?.title || 'Food Donation'}. Head to donor pickup location.`,
    type: 'delivery',
    link: '/volunteer/deliveries',
    relatedId: updatedExchange._id,
  })

  const doc = updatedExchange.toObject()
  delete doc.pickupCode
  delete doc.deliveryCode

  return res.status(200).json(new ApiResponse(200, { delivery: doc }, 'Delivery accepted successfully!'))
})

// PATCH /api/volunteers/me/deliveries/:id/transport — switch vehicle for this specific delivery task only
export const switchDeliveryTransport = asyncHandler(async (req, res) => {
  const { transportType } = req.body
  if (!transportType) {
    throw new ApiError(400, 'Transport type is required.')
  }

  const exchange = await Exchange.findOne({
    _id: req.params.id,
    volunteer: req.user._id,
  })

  if (!exchange) {
    throw new ApiError(404, 'Delivery task not found or you are not the assigned volunteer.')
  }

  if (!exchange.volunteerInfo) {
    exchange.volunteerInfo = {}
  }
  exchange.volunteerInfo.transportType = transportType

  exchange.timeline.push({
    step: exchange.status,
    title: `Vehicle Switched to ${transportType.charAt(0).toUpperCase() + transportType.slice(1)}`,
    time: new Date(),
    actor: 'Volunteer',
    note: `Courier switched vehicle to ${transportType} for this specific task. Profile default remains unchanged.`,
  })

  await exchange.save()

  return res.status(200).json(
    new ApiResponse(200, { exchange, transportType }, 'Vehicle switched for this delivery run.')
  )
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

  // Check if issue requires full order cancellation (food expired/spoiled, cannot complete, or food passed safe time)
  const isCancelReason =
    reason === 'food_expired_spoiled' ||
    reason === 'cannot_deliver_cancel' ||
    reason === 'food_spoiled' ||
    (exchange.donation?.expiresAt && new Date(exchange.donation.expiresAt) <= new Date()) ||
    (exchange.donation?.bestBefore && new Date(exchange.donation.bestBefore) <= new Date())

  if (isCancelReason) {
    const reasonLabel =
      reason === 'food_expired_spoiled'
        ? 'Food Expired / Spoiled'
        : reason === 'cannot_deliver_cancel'
        ? 'Courier Unable to Complete Delivery'
        : 'Food Safety / Expiry Limit Exceeded'

    // Log OrderIssue record
    if (exchange.receiver) {
      await OrderIssue.create({
        order: exchange._id,
        receiver: exchange.receiver._id || exchange.receiver,
        issueType: 'food_spoilage',
        description: `Volunteer ${req.user.fullName} reported: ${reasonLabel}. Details: ${note || 'Order cancelled.'}`,
        status: 'open',
      }).catch(() => {})
    }

    exchange.status = 'cancelled'
    exchange.volunteer = req.user._id
    exchange.volunteerStatus = 'none'
    exchange.stage = 1

    exchange.timeline.push({
      step: 'cancelled',
      title: `Order Cancelled: ${reasonLabel}`,
      time: new Date(),
      actor: 'Volunteer',
      note: `Courier reported issue: ${note || reasonLabel}. Order cancelled for food safety.`,
    })

    if (reason === 'food_expired_spoiled' && exchange.donation?._id) {
      await FoodDonation.findByIdAndUpdate(exchange.donation._id, { status: 'expired' })
    }

    await exchange.save()

    // Notify Receiver that order is cancelled
    if (exchange.receiver) {
      await safeNotify({
        user: exchange.receiver._id || exchange.receiver,
        title: `Order Cancelled: ${exchange.donation?.title || 'Food Order'}`,
        message: `Your delivery order #${exchange.orderNo} was cancelled because the courier reported: ${reasonLabel}. Details: ${note || 'Cannot complete delivery.'}`,
        type: 'delivery',
        category: 'system',
        relatedId: exchange._id,
      })
    }

    // Notify Donor
    if (exchange.donor) {
      await createDonorNotification(exchange.donor._id || exchange.donor, {
        title: 'Delivery Run Cancelled',
        message: `Delivery run #${exchange.orderNo} for "${exchange.donation?.title || 'Donation'}" was cancelled: ${reasonLabel}. Details: ${note || 'Issue reported.'}`,
        category: 'general',
        type: 'delivery',
        relatedId: exchange._id,
      })
    }

    return res.status(200).json(
      new ApiResponse(200, { exchange, cancelled: true }, 'Delivery run cancelled and order updated.')
    )
  }

  // Otherwise, for vehicle breakdown or personal emergency with fresh food: release back to pool
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

  // Code verified! Automatically advances to en route to receiver
  exchange.status = 'picked_up_by_volunteer'
  exchange.volunteerStatus = 'in_transit'
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

  // Notify volunteer
  await safeNotify({
    user: req.user._id,
    title: 'Food Pickup Verified',
    message: `You verified pickup for ${exchange.donation?.title || 'food'}. Handover from donor is complete.`,
    type: 'delivery',
    link: '/volunteer/deliveries',
    relatedId: exchange._id,
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
    const fd = await FoodDonation.findById(donationId)
    if (fd && (fd.quantity <= 0 || fd.servings <= 0)) {
      fd.status = 'completed'
      await fd.save()
    }
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

  // Notify volunteer
  await safeNotify({
    user: req.user._id,
    title: 'Delivery Completed! 🎉',
    message: `You successfully delivered ${exchange.donation?.title || 'the food'}. Thank you for your service!`,
    type: 'delivery',
    link: '/volunteer/history',
    relatedId: exchange._id,
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
