import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/User.js'
import { ReceiverProfile } from '../models/ReceiverProfile.js'
import { FoodDonation } from '../models/FoodDonation.js'
import { FoodRequest } from '../models/FoodRequest.js'
import { Exchange } from '../models/Exchange.js'
import { OrderIssue } from '../models/OrderIssue.js'
import { Notification } from '../models/Notification.js'
import { DonorProfile } from '../models/DonorProfile.js'
import { syncVolunteerRating } from './volunteerController.js'
import { createDonorNotification } from '../utils/notificationService.js'

const safeCreateNotification = async (payload) => {
  try {
    await Notification.create(payload)
  } catch (err) {
    console.error('Failed to create notification:', err.message)
  }
}

// Haversine formula to compute distance in kilometers between two coordinates
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    lat1 === '' ||
    lon1 === '' ||
    lat2 === '' ||
    lon2 === ''
  ) {
    return null
  }
  const nLat1 = Number(lat1)
  const nLon1 = Number(lon1)
  const nLat2 = Number(lat2)
  const nLon2 = Number(lon2)

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null
  if (nLat1 < -90 || nLat1 > 90 || nLat2 < -90 || nLat2 > 90) return null
  if (nLon1 < -180 || nLon1 > 180 || nLon2 < -180 || nLon2 > 180) return null

  const R = 6371 // Earth radius in kilometers
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return distance
}

export function formatDistanceKm(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) {
    return 'Distance unavailable'
  }
  if (distanceKm > 0 && distanceKm < 0.1) {
    return 'Less than 0.1 km away'
  }
  if (distanceKm === 0) {
    return 'Less than 0.1 km away'
  }
  return `${(Math.round(distanceKm * 10) / 10).toFixed(1)} km away`
}

// 1. GET /api/receiver/dashboard
export const getReceiverDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id

  // Ensure receiver profile exists
  let profile = await ReceiverProfile.findOne({ user: userId })
  if (!profile) {
    profile = await ReceiverProfile.create({
      user: userId,
      organizationName: req.user.fullName ? `${req.user.fullName}'s Organization` : 'Receiver Organization',
      contactPerson: req.user.fullName || 'Receiver Contact',
      organizationAddress: req.user.city ? `${req.user.city}, CA` : '87 Elm Street, Downtown, CA 90210',
      storageCapacity: 'Refrigerated & Dry',
      operatingHours: '08:00 - 18:00',
      phone: req.user.phone || '+1 (555) 280-4400',
      email: req.user.email || 'receiver@foodshare.org',
    })
  }

  // 1. Meals Received from completed orders in the current week (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const completedRecent = await Exchange.find({
    receiver: userId,
    status: { $in: ['completed', 'delivered'] },
    updatedAt: { $gte: sevenDaysAgo },
  }).populate('donation')

  const mealsReceived = completedRecent.reduce((acc, curr) => {
    return acc + (curr.donation?.quantity || curr.donation?.servings || 0)
  }, 0)

  const inProgressStatuses = [
    'accepted',
    'ready_for_pickup',
    'searching_for_volunteer',
    'volunteer_assigned',
    'picked_up_by_volunteer',
    'picked_up',
    'out_for_delivery',
    'in_transit',
  ]

  // 2. Active Deliveries count (ongoing exchanges)
  const activeDeliveries = await Exchange.countDocuments({
    receiver: userId,
    status: { $in: inProgressStatuses },
  })

  // 3. Pending Requests count (awaiting donor approval)
  const pendingRequests = await FoodRequest.countDocuments({
    receiver: userId,
    status: 'pending',
  })

  // 4. Volunteer Assistance count (active volunteer-assisted exchanges)
  const volunteerAssistance = await Exchange.countDocuments({
    receiver: userId,
    deliveryType: 'volunteer_delivery',
    status: { $in: inProgressStatuses },
  })

  // Active Delivery Tracking Card (find the top in_transit or picked_up delivery)
  let activeDelivery = await Exchange.findOne({
    receiver: userId,
    status: { $in: inProgressStatuses },
  })
    .populate('donation')
    .populate('donor', 'fullName city')
    .populate('volunteer', 'fullName phone')
    .sort({ updatedAt: -1 })

  // Expiring soon listings (items expiring within 6 hours)
  const now = new Date()
  const in6Hours = new Date(now.getTime() + 6 * 60 * 60 * 1000)

  const expiringSoonRaw = await FoodDonation.find({
    status: 'available',
    $or: [
      { expiresAt: { $gt: now, $lte: in6Hours } },
      { bestBefore: { $gt: now, $lte: in6Hours } },
    ],
  })
    .populate('donor', 'fullName organizationName')
    .limit(4)
    .sort({ expiresAt: 1, bestBefore: 1 })

  const expiringSoon = expiringSoonRaw.map((d) => {
    const expTime = d.expiresAt || d.bestBefore
    const diffMs = expTime ? expTime.getTime() - now.getTime() : 2 * 60 * 60 * 1000
    const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))
    const mins = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)))

    return {
      _id: d._id,
      title: d.title,
      donor: d.donorOrganization || d.donor?.organizationName || d.donor?.fullName || d.donorName || 'Local Donor',
      servings: d.servings || d.quantity,
      unit: d.unit || 'servings',
      countdown: `${hours}h ${mins}m`,
      imageUrl: d.imageUrl,
      pickupWindow: d.pickupWindow,
      deliveryOptions: d.deliveryOptions || ['volunteer', 'direct'],
    }
  })

  // Determine receiver-visible code:
  // - Direct pickup: receiver NEVER sees code in advance (receiver asks donor for code).
  // - Volunteer delivery: receiver sees deliveryCode ONLY after volunteer has picked up food.
  const isVolunteerInTransit =
    activeDelivery &&
    activeDelivery.deliveryType === 'volunteer_delivery' &&
    ['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit'].includes(activeDelivery.status)

  const receiverVisibleCode = isVolunteerInTransit ? activeDelivery.deliveryCode : null

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orgName: profile.organizationName || req.user.fullName || 'Receiver Organization',
        receiverName: profile.contactPerson || req.user.fullName || 'Receiver',
        stats: {
          mealsReceived: mealsReceived || 0,
          activeDeliveries: activeDeliveries || 0,
          pendingRequests: pendingRequests || 0,
          volunteerAssistance: volunteerAssistance || 0,
          // Compatibility fallbacks
          mealsThisWeek: mealsReceived || 0,
          volunteersDeployed: volunteerAssistance || 0,
        },
        activeDelivery: activeDelivery
          ? {
              _id: activeDelivery._id,
              orderNo: activeDelivery.orderNo || `FD-${activeDelivery._id.toString().slice(-8).toUpperCase()}`,
              donorName: activeDelivery.donation?.donorOrganization || activeDelivery.donor?.fullName || 'Spice Garden',
              receiverOrg: profile.organizationName || req.user.fullName || 'Receiver Organization',
              deliveryType: activeDelivery.deliveryType || 'volunteer_delivery',
              isDirectPickup: activeDelivery.deliveryType === 'direct_pickup',
              deliveryCode: receiverVisibleCode,
              handoverCode: receiverVisibleCode,
              status: activeDelivery.status,
              volunteerStatus: activeDelivery.volunteerStatus,
              stage: activeDelivery.stage || (activeDelivery.status === 'in_transit' ? 4 : 3),
              courier: activeDelivery.volunteer
                ? {
                    name: activeDelivery.volunteerInfo?.name || activeDelivery.volunteer?.fullName || 'Assigned Courier',
                    transport: activeDelivery.volunteerInfo?.transportType || 'Volunteer Courier',
                    eta: activeDelivery.eta || '~15 minutes',
                    rating: activeDelivery.volunteerInfo?.rating || 5.0,
                    phone: activeDelivery.courierPhone || activeDelivery.volunteerInfo?.phone || '',
                    avatar: activeDelivery.volunteerInfo?.avatar || '',
                  }
                : null,
              donationTitle: activeDelivery.donation?.title || 'Food Donation',
              servings: activeDelivery.donation?.quantity || activeDelivery.donation?.servings || 30,
              dropoffAddress: activeDelivery.dropoffAddress || profile.dropoffAddress,
              pickupAddress: activeDelivery.pickupAddress,
              pickupWindow: activeDelivery.pickupWindow || 'Flexible',
            }
          : null,
        expiringSoon,
      },
      'Receiver dashboard retrieved successfully.'
    )
  )
})

// 2. GET /api/receiver/badges
export const getReceiverBadges = asyncHandler(async (req, res) => {
  const userId = req.user._id

  const [pendingRequests, activePickups, unreadNotifications] = await Promise.all([
    FoodRequest.countDocuments({ receiver: userId, status: 'pending' }),
    Exchange.countDocuments({
      receiver: userId,
      status: { $in: ['accepted', 'ready_for_pickup', 'volunteer_assigned', 'picked_up', 'in_transit'] },
    }),
    Notification.countDocuments({ user: userId, isRead: false }),
  ])

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        requests: pendingRequests,
        pickups: activePickups,
        notifications: unreadNotifications,
      },
      'Badges count fetched.'
    )
  )
})

// 3. GET /api/receiver/listings
export const getReceiverListings = asyncHandler(async (req, res) => {
  const { q, category, dietary, radius = '10', sort = 'distance', lat, lng } = req.query
  const userId = req.user._id

  // Determine user coordinates (from query first, then profile)
  let userLat = lat != null && lat !== '' && !isNaN(Number(lat)) ? Number(lat) : null
  let userLng = lng != null && lng !== '' && !isNaN(Number(lng)) ? Number(lng) : null

  if (userLat == null || userLng == null) {
    const profile = await ReceiverProfile.findOne({ user: userId })
    if (profile?.lat != null && profile?.lng != null && !isNaN(Number(profile.lat)) && !isNaN(Number(profile.lng))) {
      userLat = Number(profile.lat)
      userLng = Number(profile.lng)
    }
  }

  const filter = { status: 'available' }

  // Keyword live search
  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), 'i')
    filter.$or = [
      { title: regex },
      { description: regex },
      { donorName: regex },
      { donorOrganization: regex },
      { pickupAddress: regex },
    ]
  }

  // Category filter
  if (category && category !== 'All') {
    if (category === 'Cooked Meals') {
      filter.category = { $in: ['Cooked Meal', 'Cooked Meals'] }
    } else if (category === 'Packaged Goods') {
      filter.category = { $in: ['Packaged & Canned', 'Packaged Goods'] }
    } else if (category === 'Beverages & Other') {
      filter.category = { $in: ['Beverages & Other', 'Beverages', 'Other'] }
    } else {
      filter.category = category
    }
  }

  // Dietary filters (if passed)
  if (dietary) {
    const dietaryList = Array.isArray(dietary)
      ? dietary
      : dietary.split(',').map((d) => d.trim()).filter(Boolean)
    if (dietaryList.length > 0) {
      filter.dietary = { $all: dietaryList }
    }
  }

  // Do not show fully expired listings
  const now = new Date()
  const expiryCondition = {
    $or: [
      { expiresAt: { $gt: now } },
      { bestBefore: { $gt: now } },
      { expiresAt: null, bestBefore: null },
    ],
  }

  if (filter.$or) {
    filter.$and = [{ $or: filter.$or }, expiryCondition]
    delete filter.$or
  } else {
    filter.$and = [expiryCondition]
  }

  const rawListings = await FoodDonation.find(filter).populate('donor', 'fullName organizationName city')

  // Map & calculate distance in KM + live countdown
  const listingsWithDistance = rawListings.map((doc) => {
    const docLat = doc.lat != null && !isNaN(Number(doc.lat)) ? Number(doc.lat) : null
    const docLng = doc.lng != null && !isNaN(Number(doc.lng)) ? Number(doc.lng) : null

    // Compute Haversine distance in km
    const distanceKm = calculateDistanceKm(userLat, userLng, docLat, docLng)
    const distanceFormatted = formatDistanceKm(distanceKm)

    const exp = doc.expiresAt || doc.bestBefore || new Date(Date.now() + 4 * 3600 * 1000)
    const diffMs = exp.getTime() - now.getTime()
    const isExpired = diffMs <= 0

    let countdown = 'Expired'
    if (!isExpired) {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      if (days > 0) {
        countdown = `${days}d ${hours}h`
      } else {
        countdown = `${hours}h ${mins}m`
      }
    }

    return {
      _id: doc._id,
      title: doc.title,
      category: doc.category,
      donor: doc.donorOrganization || doc.donor?.organizationName || doc.donor?.fullName || doc.donorName || 'Local Donor',
      distance: distanceFormatted,
      distanceVal: distanceKm,
      servings: doc.servings || doc.quantity,
      unit: doc.unit || 'servings',
      pickupWindow: doc.pickupWindow,
      deliveryTag: doc.deliveryOptions?.includes('volunteer')
        ? 'Volunteer Delivery Available'
        : 'Direct Pickup Only',
      deliveryType: doc.deliveryOptions?.includes('volunteer') ? 'volunteer' : 'direct',
      deliveryOptions: doc.deliveryOptions || ['volunteer', 'direct'],
      dietary: doc.dietary || [],
      imageUrl: doc.imageUrl || '',
      expiresAt: exp,
      diffMs,
      countdown,
      isExpired,
      description: doc.description,
      pickupAddress: doc.pickupAddress,
    }
  })

  // Distance filter by radius (in km)
  let filtered = listingsWithDistance.filter((item) => !item.isExpired)

  // Apply radius filter if radius is specified and user coordinates are available
  if (radius && radius !== 'all' && !isNaN(Number(radius))) {
    const maxRadius = parseFloat(radius)
    if (userLat != null && userLng != null) {
      // Do not silently treat missing coordinates as being within the radius
      filtered = filtered.filter(
        (item) => item.distanceVal != null && item.distanceVal <= maxRadius
      )
    }
  }

  // Sorting
  if (sort === 'expiring') {
    filtered.sort((a, b) => a.diffMs - b.diffMs)
  } else {
    // Sort by distance (known distance ascending, unknown distance at the end)
    filtered.sort((a, b) => {
      if (a.distanceVal == null && b.distanceVal == null) return 0
      if (a.distanceVal == null) return 1
      if (b.distanceVal == null) return -1
      return a.distanceVal - b.distanceVal
    })
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        listings: filtered,
        total: filtered.length,
        userLocationAvailable: userLat != null && userLng != null,
      },
      'Listings fetched.'
    )
  )
})

// 4. GET /api/receiver/listings/:id
export const getListingById = asyncHandler(async (req, res) => {
  const listing = await FoodDonation.findById(req.params.id)
  if (!listing) throw new ApiError(404, 'Listing not found.')

  return res.status(200).json(new ApiResponse(200, listing, 'Listing retrieved.'))
})

// 5. POST /api/receiver/requests
export const createFoodRequest = asyncHandler(async (req, res) => {
  const { listingId, servings, deliveryMethod, preferredDate, notes } = req.body
  const userId = req.user._id

  if (!listingId) throw new ApiError(400, 'Listing ID is required.')

  const listing = await FoodDonation.findById(listingId)
  if (!listing) throw new ApiError(404, 'Food listing not found.')

  const now = new Date()
  const isPastExpiry =
    (listing.bestBefore && listing.bestBefore <= now) ||
    (listing.expiresAt && listing.expiresAt <= now)

  if (listing.status !== 'available' || isPastExpiry) {
    if (isPastExpiry && listing.status === 'available') {
      listing.status = 'expired'
      await listing.save()
    }
    throw new ApiError(400, 'This food donation is no longer available or has expired.')
  }

  const requestedQty = Number(servings) || 1
  const availableQty = listing.servings || listing.quantity || 1
  if (requestedQty > availableQty) {
    throw new ApiError(400, `Requested servings (${requestedQty}) exceed available amount (${availableQty}).`)
  }

  const profile = await ReceiverProfile.findOne({ user: userId })

  // Authoritative completed exchanges count for this receiver
  const completedCount = await Exchange.countDocuments({
    receiver: userId,
    status: { $in: ['completed', 'delivered'] },
  })

  const selectedDeliveryPreference =
    deliveryMethod === 'direct_pickup' ||
    deliveryMethod === 'Direct Receiver Pickup' ||
    deliveryMethod === 'Self-Pickup'
      ? 'direct_pickup'
      : 'volunteer_delivery'

  const newRequest = await FoodRequest.create({
    donation: listing._id,
    donor: listing.donor,
    receiver: userId,
    receiverName: profile?.contactPerson || req.user.fullName,
    receiverOrganization: profile?.organizationName || req.user.fullName || 'Receiver Organization',
    receiverPhone: profile?.phone || req.user.phone,
    receiverExchangesCount: completedCount,
    message: notes || `Request for ${requestedQty} ${listing.unit || 'Servings'}`,
    requestedQuantity: requestedQty,
    requestedUnit: listing.unit || 'Servings',
    deliveryPreference: selectedDeliveryPreference,
    deliveryMethod: selectedDeliveryPreference,
    status: 'pending',
    preferredDate: preferredDate || new Date().toISOString().slice(0, 10),
    notes: notes || '',
  })

  // Check notification preferences and create in-app notification for receiver
  if (profile?.notificationPrefs?.requestStatusUpdates !== false) {
    await safeCreateNotification({
      user: userId,
      title: 'Request Submitted',
      message: `Your request for ${requestedQty} servings of ${listing.title} has been submitted for review.`,
      type: 'request',
      link: '/receiver/requests',
    })
  }

  // Notify the actual owner/donor of the listing (respects donor's newFoodRequest preference)
  await createDonorNotification(listing.donor, {
    title: 'New Food Request',
    message: `${req.user.fullName || profile?.organizationName || 'A receiver'} requested ${requestedQty} ${listing.unit || 'servings'} of "${listing.title}".`,
    category: 'newFoodRequest',
    type: 'request',
    link: '/donor/requests',
    relatedId: newRequest._id,
  })

  return res.status(201).json(
    new ApiResponse(201, newRequest, 'Food request submitted successfully.')
  )
})

// 6. GET /api/receiver/requests
export const getReceiverRequests = asyncHandler(async (req, res) => {
  const { status } = req.query
  const userId = req.user._id

  const filter = { receiver: userId }
  if (status && status !== 'all') {
    if (status === 'approved') {
      filter.status = { $in: ['approved', 'accepted'] }
    } else {
      filter.status = status
    }
  }

  const requests = await FoodRequest.find(filter)
    .populate('donation')
    .populate('donor', 'fullName organizationName')
    .sort({ createdAt: -1 })

  const allReqs = await FoodRequest.find({ receiver: userId })
  const counts = {
    all: allReqs.length,
    pending: allReqs.filter((r) => r.status === 'pending').length,
    approved: allReqs.filter((r) => r.status === 'approved' || r.status === 'accepted').length,
    declined: allReqs.filter((r) => r.status === 'declined').length,
  }

  const formatted = requests.map((r) => ({
    _id: r._id,
    title: r.donation?.title || 'Food Donation',
    donor: r.donation?.donorOrganization || r.donor?.fullName || 'Local Donor',
    servings: r.requestedQuantity,
    unit: r.requestedUnit || 'servings',
    date: r.preferredDate || r.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    method: r.deliveryPreference === 'direct_pickup' ? 'Self-Pickup' : 'Volunteer Courier',
    category: r.donation?.category || 'Cooked Meals',
    status: r.status === 'accepted' ? 'approved' : r.status,
    imageUrl: r.donation?.imageUrl || '',
  }))

  return res.status(200).json(
    new ApiResponse(200, { requests: formatted, counts }, 'Requests fetched.')
  )
})

// 7. PATCH /api/receiver/requests/:id/cancel
export const cancelFoodRequest = asyncHandler(async (req, res) => {
  const request = await FoodRequest.findOne({ _id: req.params.id, receiver: req.user._id })
  if (!request) throw new ApiError(404, 'Request not found.')
  if (request.status !== 'pending') {
    throw new ApiError(400, 'Only pending requests can be cancelled.')
  }

  request.status = 'cancelled'
  await request.save()

  return res.status(200).json(new ApiResponse(200, request, 'Request cancelled.'))
})

// 8. GET /api/receiver/pickups
export const getReceiverPickups = asyncHandler(async (req, res) => {
  const { tab = 'in_progress' } = req.query
  const userId = req.user._id

  const inProgressStatuses = [
    'accepted',
    'ready_for_pickup',
    'searching_for_volunteer',
    'volunteer_assigned',
    'picked_up_by_volunteer',
    'picked_up',
    'out_for_delivery',
    'in_transit',
  ]

  let statusFilter
  if (tab === 'completed') {
    statusFilter = { $in: ['completed', 'delivered'] }
  } else {
    statusFilter = { $in: inProgressStatuses }
  }

  const exchanges = await Exchange.find({
    receiver: userId,
    status: statusFilter,
  })
    .populate('donation')
    .populate('donor', 'fullName city')
    .populate('volunteer')
    .sort({ updatedAt: -1 })

  const [inProgressCount, completedCount] = await Promise.all([
    Exchange.countDocuments({
      receiver: userId,
      status: { $in: inProgressStatuses },
    }),
    Exchange.countDocuments({
      receiver: userId,
      status: { $in: ['completed', 'delivered'] },
    }),
  ])

  const formatted = exchanges.map((ex) => {
    const isDirect = ex.deliveryType === 'direct_pickup'
    const isVolunteerCourier = ex.deliveryType === 'volunteer_delivery'

    // Determine receiver-visible code:
    // Direct pickup: NEVER sent in advance. Only displayed if completed.
    // Volunteer delivery: receiver sees deliveryCode once food is collected by courier.
    let codeForReceiver = null
    if (isDirect) {
      codeForReceiver = ex.status === 'completed' ? ex.pickupCode : null
    } else {
      if (['picked_up_by_volunteer', 'picked_up', 'out_for_delivery', 'in_transit', 'completed'].includes(ex.status)) {
        codeForReceiver = ex.deliveryCode
      }
    }

    return {
      _id: ex._id,
      orderNo: ex.orderNo || `FD-${ex._id.toString().slice(-8).toUpperCase()}`,
      title: ex.donation?.title || 'Food Donation',
      servings: ex.donation?.quantity || ex.donation?.servings || 24,
      unit: ex.donation?.unit || 'servings',
      donor: ex.donation?.donorOrganization || ex.donor?.fullName || 'Local Donor',
      deliveryType: ex.deliveryType,
      isDirectPickup: isDirect,
      isVolunteerCourier,
      courier: ex.volunteer
        ? {
            name: ex.volunteerInfo?.name || ex.volunteer?.fullName || 'Assigned Courier',
            transport: ex.volunteerInfo?.transportType || 'Courier',
            eta: ex.eta || '~15 minutes',
            rating: typeof ex.volunteerInfo?.rating === 'number' ? ex.volunteerInfo.rating : 0,
            deliveriesCompleted: ex.volunteerInfo?.deliveriesCompleted || 0,
            phone: ex.courierPhone || ex.volunteerInfo?.phone || '',
            avatar: ex.volunteerInfo?.avatar || '',
          }
        : null,
      volunteerStatus: ex.volunteerStatus,
      pickupAddress: ex.pickupAddress || 'Donor Address',
      dropoffAddress: ex.dropoffAddress || '',
      pickupCoords: ex.pickupCoords || (ex.donation?.lat ? { lat: ex.donation.lat, lng: ex.donation.lng } : null),
      dropoffCoords: ex.dropoffCoords || null,
      volunteerCoords: ex.volunteerCoords || null,
      pickupWindow: ex.pickupWindow || 'Standard Window',
      handoverCode: codeForReceiver,
      deliveryCode: codeForReceiver,
      stage: ex.stage || (ex.status === 'in_transit' ? 4 : ex.status === 'completed' ? 5 : 3),
      status: ex.status,
      imageUrl: ex.donation?.imageUrl || '',
      feedback: ex.feedback,
      donorFeedback: ex.receiverToDonorFeedback,
      volunteerFeedback: ex.receiverToVolunteerFeedback || ex.receiverFeedback,
      donorReviewStatus: ex.receiverToDonorFeedback?.rating ? 'submitted' : 'pending',
      volunteerReviewStatus: (ex.receiverToVolunteerFeedback?.rating || ex.receiverFeedback?.rating) ? 'submitted' : 'pending',
      deliveredAt: ex.deliveredAt,
    }
  })

  return res.status(200).json(
    new ApiResponse(
      200,
      { pickups: formatted, counts: { in_progress: inProgressCount, completed: completedCount } },
      'Pickups fetched.'
    )
  )
})

// 8b. POST /api/receiver/orders/:id/verify-pickup — receiver verifies pickup from donor in direct pickup flow
export const verifyDirectPickup = asyncHandler(async (req, res) => {
  const { code } = req.body
  const order = await Exchange.findOne({ _id: req.params.id, receiver: req.user._id }).populate('donation')
  if (!order) throw new ApiError(404, 'Order not found.')

  if (order.deliveryType !== 'direct_pickup') {
    throw new ApiError(400, 'This order is not a direct pickup.')
  }

  if (order.status === 'completed') {
    return res.status(200).json(new ApiResponse(200, { order }, 'Pickup has already been verified and completed.'))
  }

  const cleanEntered = (code || '').toString().replace(/[^0-9]/g, '')
  const cleanExpected = (order.pickupCode || '').toString().replace(/[^0-9]/g, '')

  if (!cleanEntered || cleanEntered !== cleanExpected) {
    throw new ApiError(400, 'Incorrect verification code. Please ask the donor for the correct code.')
  }

  // Verification successful!
  order.status = 'completed'
  order.stage = 5
  order.handoverConfirmed = true
  order.pickedUpAt = new Date()
  order.deliveredAt = new Date()
  order.pickedUpBy = req.user._id
  order.deliveredBy = req.user._id

  order.timeline.push({
    step: 'completed',
    title: 'Pickup Verified & Handover Completed',
    time: new Date(),
    actor: 'Receiver',
    note: 'Receiver entered matching 4-digit pickup code from donor and confirmed safe collection.',
  })

  if (order.donation) {
    const donationId = order.donation._id || order.donation
    await FoodDonation.findByIdAndUpdate(donationId, { status: 'completed' })
  }

  await order.save()

  // Update receiver metrics
  await ReceiverProfile.findOneAndUpdate(
    { user: req.user._id },
    { $inc: { totalDonationsReceived: 1 } }
  )

  // Update donor metrics
  await DonorProfile.findOneAndUpdate(
    { user: order.donor },
    { $inc: { totalMealsShared: order.donation?.quantity || 1 } }
  )

  // In-app notifications (safe, non-blocking)
  await safeCreateNotification({
    user: req.user._id,
    title: 'Pickup Confirmed',
    message: `You successfully verified pickup for ${order.donation?.title || 'Order #' + order.orderNo}.`,
    type: 'order',
    link: '/receiver/history',
  })

  // Notify donor (respects donor's exchangeCompleted preference)
  await createDonorNotification(order.donor, {
    title: 'Food Pickup Completed',
    message: `The receiver entered your pickup code and completed collection of ${order.donation?.title || 'food donation'}. Handover complete!`,
    category: 'exchangeCompleted',
    type: 'exchange_completed',
    link: '/donor/exchanges',
    relatedId: order._id,
  })

  return res.status(200).json(new ApiResponse(200, { order }, 'Pickup verified successfully!'))
})

// 9. PATCH /api/receiver/orders/:id/received
export const markOrderReceived = asyncHandler(async (req, res) => {
  const order = await Exchange.findOne({ _id: req.params.id, receiver: req.user._id }).populate('donation')
  if (!order) throw new ApiError(404, 'Order not found.')

  order.status = 'completed'
  order.stage = 5
  order.handoverConfirmed = true
  order.deliveredAt = new Date()
  order.timeline.push({
    step: 'completed',
    title: 'Order Confirmed Received by Receiver',
    time: new Date(),
    actor: 'Receiver',
    note: 'Receiver confirmed safe handover of food donation.',
  })
  await order.save()

  // Update receiver profile metrics
  await ReceiverProfile.findOneAndUpdate(
    { user: req.user._id },
    { $inc: { totalDonationsReceived: 1 } }
  )

  // In-app notification
  await safeCreateNotification({
    user: req.user._id,
    title: 'Delivery Received',
    message: `You confirmed receipt of ${order.donation?.title || 'Order #' + order.orderNo}. Thank you for rescuing food!`,
    type: 'delivery',
    link: '/receiver/history',
  })

  return res.status(200).json(new ApiResponse(200, order, 'Order marked as received.'))
})

// 10. POST /api/receiver/orders/:id/rating
export const rateOrder = asyncHandler(async (req, res) => {
  const { target = 'donor', rating, comment } = req.body
  const order = await Exchange.findOne({ _id: req.params.id, receiver: req.user._id })
  if (!order) throw new ApiError(404, 'Order not found.')

  if (order.status !== 'completed' && order.status !== 'delivered') {
    throw new ApiError(400, 'Feedback can only be submitted for completed exchanges.')
  }

  const numRating = Number(rating)
  if (!numRating || numRating < 1 || numRating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5.')
  }

  const feedbackData = {
    rating: numRating,
    comment: (comment || '').trim(),
    submittedAt: new Date(),
    submittedBy: req.user._id,
  }

  if (target === 'volunteer') {
    if (order.deliveryType !== 'volunteer_delivery' || !order.volunteer) {
      throw new ApiError(400, 'This exchange did not involve volunteer assistance.')
    }
    // Prevent duplicate volunteer review
    if (order.receiverToVolunteerFeedback?.rating || order.receiverFeedback?.rating) {
      throw new ApiError(400, 'You have already submitted a review for the volunteer of this exchange.')
    }

    order.receiverToVolunteerFeedback = feedbackData
    order.receiverFeedback = feedbackData
    order.feedback = {
      ...feedbackData,
      role: 'receiver',
    }
    await order.save()

    // Immediately synchronize volunteer's rating & review statistics
    await syncVolunteerRating(order.volunteer).catch((err) => {
      console.error('Failed to sync volunteer rating:', err.message)
    })

    return res.status(200).json(
      new ApiResponse(200, { target: 'volunteer', feedback: feedbackData }, 'Volunteer rating submitted successfully.')
    )
  } else {
    // Target is 'donor'
    // Prevent duplicate donor review
    if (order.receiverToDonorFeedback?.rating) {
      throw new ApiError(400, 'You have already submitted a review for the donor of this exchange.')
    }

    order.receiverToDonorFeedback = feedbackData
    if (order.deliveryType === 'direct_pickup' && !order.feedback?.rating) {
      order.feedback = {
        ...feedbackData,
        role: 'receiver',
      }
    }
    await order.save()

    return res.status(200).json(
      new ApiResponse(200, { target: 'donor', feedback: feedbackData }, 'Donor rating submitted successfully.')
    )
  }
})

// 11. POST /api/receiver/orders/:id/issue
export const reportOrderIssue = asyncHandler(async (req, res) => {
  const { issueType, description, photoUrl } = req.body
  const order = await Exchange.findOne({ _id: req.params.id, receiver: req.user._id })
  if (!order) throw new ApiError(404, 'Order not found.')

  if (!description || !description.trim()) {
    throw new ApiError(400, 'Please provide a description of the issue.')
  }

  const issue = await OrderIssue.create({
    order: order._id,
    receiver: req.user._id,
    issueType: issueType || 'other',
    description: description.trim(),
    photoUrl: photoUrl || '',
    status: 'open',
  })

  await safeCreateNotification({
    user: req.user._id,
    title: 'Issue Reported',
    message: `Your issue regarding Order #${order.orderNo || order._id} has been logged. Our support team is investigating.`,
    type: 'system',
    link: '/receiver/pickups',
  })

  return res.status(201).json(new ApiResponse(201, issue, 'Issue reported successfully.'))
})

// 12. PATCH /api/receiver/orders/:id/status (courier/donor advancement endpoint)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { stage, status } = req.body
  const order = await Exchange.findById(req.params.id)
  if (!order) throw new ApiError(404, 'Order not found.')

  if (stage) order.stage = Number(stage)
  if (status) order.status = status

  order.timeline.push({
    step: status || `stage_${stage}`,
    title: `Order advanced to stage ${stage || status}`,
    time: new Date(),
    actor: 'System',
    note: `Order status updated to ${status || 'stage ' + stage}`,
  })

  await order.save()
  return res.status(200).json(new ApiResponse(200, order, 'Order status updated.'))
})

// 13. GET /api/receiver/history
export const getReceiverHistory = asyncHandler(async (req, res) => {
  const { q, sort = 'desc', page = 1, limit = 20 } = req.query
  const userId = req.user._id

  const filter = {
    receiver: userId,
    status: { $in: ['completed', 'delivered'] },
  }

  const completedOrders = await Exchange.find(filter)
    .populate('donation')
    .populate('donor', 'fullName organizationName')
    .sort({ updatedAt: sort === 'asc' ? 1 : -1 })

  let formatted = completedOrders.map((ex) => ({
    _id: ex._id,
    orderNo: ex.orderNo || `FD-${ex._id.toString().slice(-8).toUpperCase()}`,
    foodItem: ex.donation?.title || 'Food Donation',
    donor: ex.donation?.donorOrganization || ex.donor?.fullName || 'Local Donor',
    qty: `${ex.donation?.quantity || ex.donation?.servings || 1} ${ex.donation?.unit || 'Servings'}`,
    date: ex.deliveredAt
      ? new Date(ex.deliveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : new Date(ex.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    rawDate: ex.deliveredAt || ex.updatedAt,
    method: ex.deliveryType === 'volunteer_delivery' ? 'Volunteer' : 'Self-Pickup',
    status: 'Completed',
    category: ex.donation?.category || 'Cooked Meals',
  }))

  if (q && q.trim()) {
    const term = q.trim().toLowerCase()
    formatted = formatted.filter(
      (item) =>
        item.foodItem.toLowerCase().includes(term) ||
        item.donor.toLowerCase().includes(term) ||
        item.orderNo.toLowerCase().includes(term)
    )
  }

  return res.status(200).json(
    new ApiResponse(200, { history: formatted, total: formatted.length }, 'History fetched.')
  )
})

// 14. GET /api/receiver/history/stats
export const getReceiverHistoryStats = asyncHandler(async (req, res) => {
  const userId = req.user._id

  const completed = await Exchange.find({
    receiver: userId,
    status: { $in: ['completed', 'delivered'] },
  }).populate('donation')

  // 1. Total Meals Claimed (servings/portions claimed by the receiver)
  let totalMealsClaimed = 0
  const donorsSet = new Set()
  let volunteerAssisted = 0

  const categoryCounts = {
    'Cooked Meals': 0,
    'Fresh Produce': 0,
    Bakery: 0,
    'Packaged Goods': 0,
  }
  let totalCategoryItems = 0

  completed.forEach((ex) => {
    const qty = ex.donation?.quantity || ex.donation?.servings || 0
    totalMealsClaimed += qty

    // Donor tracking
    const donorKey = ex.donor?.toString() || ex.donation?.donorOrganization || ex.donation?.donor?.toString()
    if (donorKey) donorsSet.add(donorKey)

    // Volunteer-assisted tracking
    if (ex.deliveryType === 'volunteer_delivery' || ex.volunteer != null) {
      volunteerAssisted++
    }

    // Category tracking (by completed food item/exchange to avoid mixing physical units)
    const cat = ex.donation?.category
    totalCategoryItems++
    if (cat === 'Cooked Meal' || cat === 'Cooked Meals') categoryCounts['Cooked Meals']++
    else if (cat === 'Fresh Produce') categoryCounts['Fresh Produce']++
    else if (cat === 'Bakery') categoryCounts['Bakery']++
    else categoryCounts['Packaged Goods']++
  })

  // 2. Total Collections (count of successfully completed food collections: self-pickup + volunteer)
  const totalCollections = completed.length

  // 3. Donors Connected (count of unique donors)
  const donorsConnected = donorsSet.size

  // 5. Category Breakdown: dynamically calculated percentage of food items received by category
  const breakdown = {
    cookedMeals: totalCategoryItems > 0 ? Math.round((categoryCounts['Cooked Meals'] / totalCategoryItems) * 100) : 0,
    freshProduce: totalCategoryItems > 0 ? Math.round((categoryCounts['Fresh Produce'] / totalCategoryItems) * 100) : 0,
    bakery: totalCategoryItems > 0 ? Math.round((categoryCounts['Bakery'] / totalCategoryItems) * 100) : 0,
    packagedGoods: totalCategoryItems > 0 ? Math.round((categoryCounts['Packaged Goods'] / totalCategoryItems) * 100) : 0,
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalMealsClaimed,
        totalCollections,
        donorsConnected,
        volunteerAssisted,
        breakdown,
        // Compatibility fallbacks
        donorsSupported: donorsConnected,
        foodRescuedKg: Math.round(totalMealsClaimed * 0.4),
      },
      'History stats computed.'
    )
  )
})

// 15. GET /api/receiver/orders/:id/receipt
export const getOrderReceipt = asyncHandler(async (req, res) => {
  const order = await Exchange.findOne({ _id: req.params.id, receiver: req.user._id })
    .populate('donation')
    .populate('donor', 'fullName city')

  if (!order) throw new ApiError(404, 'Order not found.')

  const profile = await ReceiverProfile.findOne({ user: req.user._id })

  const receiptData = {
    orderNo: order.orderNo || `FD-${order._id.toString().slice(-8).toUpperCase()}`,
    foodItem: order.donation?.title || 'Nutritious Meals',
    donor: order.donation?.donorOrganization || order.donor?.fullName || 'Local Community Partner',
    donorAddress: order.donation?.pickupAddress || 'San Francisco, CA',
    receiverOrg: profile?.organizationName || req.user.fullName || 'Receiver Organization',
    receiverTaxId: profile?.taxId || '84-2948102',
    receiverAddress: profile?.dropoffAddress || req.user.city || '87 Elm Street, Downtown, CA 90210',
    quantity: `${order.donation?.quantity || order.donation?.servings || 40} servings`,
    date: order.deliveredAt
      ? new Date(order.deliveredAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    deliveryMethod: order.deliveryType === 'volunteer_delivery' ? 'Volunteer Courier' : 'Self-Pickup',
    taxExemptNote:
      'This non-profit food donation receipt confirms the transfer of surplus edible food directly to a verified 501(c)(3) charitable organization under the Bill Emerson Good Samaritan Food Donation Act.',
  }

  return res.status(200).json(new ApiResponse(200, receiptData, 'Receipt details fetched.'))
})

// 16. GET /api/receiver/profile
export const getReceiverProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id
  let profile = await ReceiverProfile.findOne({ user: userId })
  if (!profile) {
    profile = await ReceiverProfile.create({
      user: userId,
      organizationName: req.user.fullName ? `${req.user.fullName}'s Organization` : 'Receiver Organization',
      contactPerson: req.user.fullName || 'Receiver Contact',
      organizationAddress: req.user.city || '87 Elm Street, Downtown, CA 90210',
      storageCapacity: 'Refrigerated & Dry',
      operatingHours: '08:00 - 18:00',
      phone: req.user.phone || '+1 (555) 280-4400',
      email: req.user.email || 'receiver@foodshare.org',
      website: '',
      dropoffAddress: req.user.city || '87 Elm Street, Downtown, CA 90210',
    })
  }

  const user = await User.findById(userId).select('-passwordHash')

  return res.status(200).json(
    new ApiResponse(200, { profile, user: user.toSafeObject ? user.toSafeObject() : user }, 'Profile retrieved.')
  )
})

// 17. PUT /api/receiver/profile
export const updateReceiverProfile = asyncHandler(async (req, res) => {
  const { organizationName, contactPerson, phone, email, website, dropoffAddress, about, lat, lng } = req.body
  const userId = req.user._id

  if (!organizationName || !contactPerson || !email) {
    throw new ApiError(400, 'Organization name, contact person, and email are required.')
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Please provide a valid email address.')
  }

  const profile = await ReceiverProfile.findOneAndUpdate(
    { user: userId },
    {
      organizationName: organizationName.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone ? phone.trim() : '+1 (555) 280-4400',
      email: email.trim().toLowerCase(),
      dropoffAddress: dropoffAddress ? dropoffAddress.trim() : '',
      ...(about !== undefined && { about: (about || '').trim() }),
      ...(website !== undefined && { website: (website || '').trim() }),
      ...(lat != null && !isNaN(Number(lat)) && { lat: Number(lat) }),
      ...(lng != null && !isNaN(Number(lng)) && { lng: Number(lng) }),
    },
    { new: true, upsert: true }
  )

  await User.findByIdAndUpdate(userId, {
    fullName: contactPerson.trim(),
    phone: phone ? phone.trim() : req.user.phone,
    email: email.trim().toLowerCase(),
  })

  return res.status(200).json(new ApiResponse(200, profile, 'Profile updated successfully.'))
})

// 18. PUT /api/receiver/profile/capacity
export const updateReceiverCapacity = asyncHandler(async (req, res) => {
  const {
    storageTypes,
    maxServingsPerPickup,
    peopleServedPerDay,
    preferredPickupWindows,
    vehicleAvailable,
    dietaryPrefs,
    preferredCategories,
  } = req.body

  const profile = await ReceiverProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      capacity: {
        storageTypes: storageTypes || ['refrigerated', 'dry'],
        maxServingsPerPickup: Number(maxServingsPerPickup) || 100,
        peopleServedPerDay: Number(peopleServedPerDay) || 150,
        preferredPickupWindows: preferredPickupWindows || ['Morning (09:00 - 12:00)'],
        vehicleAvailable: Boolean(vehicleAvailable),
      },
      ...(dietaryPrefs && { dietaryPrefs }),
      ...(preferredCategories && { preferredCategories }),
    },
    { new: true, upsert: true }
  )

  return res.status(200).json(new ApiResponse(200, profile, 'Capacity preferences saved.'))
})

// 19. PUT /api/receiver/profile/notifications
export const updateReceiverNotificationPrefs = asyncHandler(async (req, res) => {
  const {
    newFoodAvailable,
    requestStatusUpdates,
    deliveryAlerts,
    urgentExpiryAlerts,
    weeklyImpactDigest,
    smsNotifications,
  } = req.body

  const profile = await ReceiverProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      notificationPrefs: {
        newFoodAvailable: Boolean(newFoodAvailable),
        requestStatusUpdates: Boolean(requestStatusUpdates),
        deliveryAlerts: Boolean(deliveryAlerts),
        urgentExpiryAlerts: Boolean(urgentExpiryAlerts),
        weeklyImpactDigest: Boolean(weeklyImpactDigest),
        smsNotifications: Boolean(smsNotifications),
      },
    },
    { new: true, upsert: true }
  )

  return res.status(200).json(
    new ApiResponse(200, profile.notificationPrefs, 'Notification preferences saved.')
  )
})

// 20. GET /api/receiver/notifications
export const getReceiverNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)

  return res.status(200).json(new ApiResponse(200, notifications, 'Notifications fetched.'))
})

// 21. PATCH /api/receiver/notifications/:id/read
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  )
  return res.status(200).json(new ApiResponse(200, notif, 'Notification marked as read.'))
})

// 22. PATCH /api/receiver/notifications/read-all
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true })
  return res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read.'))
})
