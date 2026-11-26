import mongoose from 'mongoose'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { DonorProfile } from '../models/DonorProfile.js'
import { User } from '../models/User.js'
import { FoodDonation } from '../models/FoodDonation.js'
import { FoodRequest } from '../models/FoodRequest.js'
import { Exchange } from '../models/Exchange.js'
import { VolunteerProfile } from '../models/VolunteerProfile.js'
import { ReceiverProfile } from '../models/ReceiverProfile.js'
import { Notification } from '../models/Notification.js'
import { syncVolunteerRating } from './volunteerController.js'
import { autoCancelExpiredDonationsAndExchanges } from '../utils/expiryManager.js'

const safeCreateNotification = async (payload) => {
  try {
    await Notification.create(payload)
  } catch (err) {
    console.error('Failed to create notification:', err.message)
  }
}

// GET /api/donors/me — fetch logged-in donor profile & stats
export const getMyDonorProfile = asyncHandler(async (req, res) => {
  let profile = await DonorProfile.findOne({ user: req.user._id })
  if (!profile) {
    profile = await DonorProfile.create({
      user: req.user._id,
      pickupAddress: `${req.user.city || 'San Francisco'}`,
      pickupAvailability: 'Flexible hours',
      foodSafetyAccepted: true,
    })
  }

  const user = await User.findById(req.user._id).select('-passwordHash')
  return res.status(200).json(
    new ApiResponse(200, { user: user.toSafeObject ? user.toSafeObject() : user, profile }, 'Donor profile fetched.')
  )
})

// PATCH /api/donors/me — update donor profile fields
export const updateMyDonorProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, city, organizationName, donorType, pickupAddress, pickupAvailability, about, lat, lng } = req.body

  if (fullName || phone || city) {
    await User.findByIdAndUpdate(req.user._id, {
      ...(fullName && { fullName: fullName.trim() }),
      ...(phone && { phone: phone.trim() }),
      ...(city && { city: city.trim() }),
    })
  }

  const profile = await DonorProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      ...(organizationName !== undefined && { organizationName }),
      ...(donorType && { donorType }),
      ...(pickupAddress && { pickupAddress: pickupAddress.trim() }),
      ...(pickupAvailability && { pickupAvailability: pickupAvailability.trim() }),
      ...(about !== undefined && { about }),
      ...(lat !== undefined && { lat: lat != null ? Number(lat) : null }),
      ...(lng !== undefined && { lng: lng != null ? Number(lng) : null }),
    },
    { new: true, upsert: true }
  )

  const updatedUser = await User.findById(req.user._id).select('-passwordHash')
  return res.status(200).json(
    new ApiResponse(
      200,
      { user: updatedUser.toSafeObject ? updatedUser.toSafeObject() : updatedUser, profile },
      'Donor profile updated successfully.'
    )
  )
})

// GET /api/donors/me/stats — donor overview stats
export const getMyDonorStats = asyncHandler(async (req, res) => {
  const [activeListings, pendingRequests, completedExchanges, profile, allDonations] = await Promise.all([
    FoodDonation.countDocuments({ donor: req.user._id, status: { $in: ['available', 'requested'] } }),
    FoodRequest.countDocuments({ donor: req.user._id, status: 'pending' }),
    Exchange.countDocuments({ donor: req.user._id, status: 'completed' }),
    DonorProfile.findOne({ user: req.user._id }),
    FoodDonation.find({ donor: req.user._id }),
  ])

  // Total meals calculation based on actual posted items or profile record
  const mealsShared = profile?.totalMealsShared || allDonations.reduce((sum, d) => sum + (d.quantity || 0), 0)
  const totalListings = allDonations.length

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        activeListings,
        pendingRequests,
        completedExchanges,
        mealsShared,
        foodRescuedKg: Math.round(mealsShared * 0.4),
        receiversHelped: completedExchanges,
        totalListings,
      },
      'Donor dashboard stats fetched.'
    )
  )
})

// GET /api/donors/me/donations — list donations posted by this donor
export const getMyDonations = asyncHandler(async (req, res) => {
  await autoCancelExpiredDonationsAndExchanges()

  const { status } = req.query
  const now = new Date()

  // 1. Any donation that has an associated completed exchange is completed (Priority 1)
  const completedExchanges = await Exchange.find({
    donor: req.user._id,
    status: 'completed',
  }).select('donation')
  const completedDonationIds = completedExchanges.map((ex) => ex.donation).filter(Boolean)

  if (completedDonationIds.length > 0) {
    await FoodDonation.updateMany(
      { _id: { $in: completedDonationIds }, quantity: { $lte: 0 }, status: { $ne: 'completed' } },
      { $set: { status: 'completed' } }
    )
  }

  // 2. Auto-mark any available donation whose expiry timestamp has passed as expired
  await FoodDonation.updateMany(
    {
      donor: req.user._id,
      status: 'available',
      _id: { $nin: completedDonationIds },
      $or: [
        { bestBefore: { $lte: now } },
        { expiresAt: { $lte: now } },
      ],
    },
    { $set: { status: 'expired' } }
  )

  const filter = { donor: req.user._id }

  if (status && status !== 'all') {
    filter.status = status
  }

  const donations = await FoodDonation.find(filter).sort({ createdAt: -1 })
  const counts = {
    all: await FoodDonation.countDocuments({ donor: req.user._id }),
    available: await FoodDonation.countDocuments({ donor: req.user._id, status: 'available' }),
    requested: await FoodDonation.countDocuments({ donor: req.user._id, status: 'requested' }),
    claimed: await FoodDonation.countDocuments({ donor: req.user._id, status: 'claimed' }),
    completed: await FoodDonation.countDocuments({ donor: req.user._id, status: 'completed' }),
    expired: await FoodDonation.countDocuments({ donor: req.user._id, status: 'expired' }),
  }

  return res.status(200).json(
    new ApiResponse(200, { donations, counts }, 'Donations fetched successfully.')
  )
})

// GET /api/donors/me/donations/:id — get single donation with interested receivers
export const getDonationById = asyncHandler(async (req, res) => {
  let donation = await FoodDonation.findOne({ _id: req.params.id, donor: req.user._id })
  if (!donation) throw new ApiError(404, 'Food donation not found.')

  const now = new Date()
  const completedExchange = await Exchange.findOne({ donation: donation._id, status: 'completed' })
  if (completedExchange && (donation.quantity <= 0 || donation.servings <= 0) && donation.status !== 'completed') {
    donation.status = 'completed'
    await donation.save()
  } else if (
    donation.status === 'available' &&
    ((donation.bestBefore && donation.bestBefore <= now) || (donation.expiresAt && donation.expiresAt <= now))
  ) {
    donation.status = 'expired'
    await donation.save()
  }

  const requests = await FoodRequest.find({ donation: donation._id })
    .populate('receiver', 'fullName email phone')
    .sort({ createdAt: -1 })

  // Authoritatively calculate completed exchanges count for each receiver
  const receiverIds = [
    ...new Set(
      requests
        .map((r) => r.receiver?._id || r.receiver)
        .filter(Boolean)
        .map((id) => id.toString())
    ),
  ]

  const completedExchangesCounts = await Exchange.aggregate([
    {
      $match: {
        receiver: { $in: receiverIds.map((id) => new mongoose.Types.ObjectId(id)) },
        status: { $in: ['completed', 'delivered'] },
      },
    },
    {
      $group: {
        _id: '$receiver',
        count: { $sum: 1 },
      },
    },
  ])

  const countsMap = {}
  completedExchangesCounts.forEach((item) => {
    countsMap[item._id.toString()] = item.count
  })

  const formattedRequests = requests.map((reqDoc) => {
    const doc = reqDoc.toObject()
    const rId = (doc.receiver?._id || doc.receiver)?.toString()
    doc.receiverExchangesCount = countsMap[rId] || 0
    return doc
  })

  return res.status(200).json(
    new ApiResponse(200, { donation, interestedReceivers: formattedRequests }, 'Donation details fetched.')
  )
})

const formatBackendUnit = (u) => {
  if (!u || typeof u !== 'string') return 'Servings'
  const clean = u.trim().toLowerCase()
  switch (clean) {
    case 'servings':
    case 'serving':
      return 'Servings'
    case 'kg':
    case 'kgs':
      return 'Kg'
    case 'liters':
    case 'liter':
    case 'litres':
    case 'litre':
    case 'l':
      return 'Liters'
    case 'items':
    case 'item':
      return 'Items'
    case 'boxes':
    case 'box':
      return 'Boxes'
    case 'bags':
    case 'bag':
      return 'Bags'
    case 'bottles':
    case 'bottle':
      return 'Bottles'
    case 'loaves':
    case 'loaf':
      return 'Loaves'
    default:
      return u.charAt(0).toUpperCase() + u.slice(1)
  }
}

// POST /api/donors/me/donations — create a new food donation listing
export const createDonation = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    description,
    quantity,
    unit = 'Servings',
    bestBefore,
    pickupAddress,
    pickupWindow,
    pickupInstructions,
    imageUrl,
    tags,
  } = req.body

  if (!title || !category || !description || !quantity || !bestBefore || !pickupAddress || !pickupWindow) {
    throw new ApiError(400, 'All required donation fields must be provided.')
  }

  // Calculate reliable, timezone-safe UTC expiry timestamp
  const now = new Date()
  let expiryDate
  if (typeof bestBefore === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(bestBefore.trim())) {
    const [y, m, d] = bestBefore.trim().split('-').map(Number)
    expiryDate = new Date(Date.UTC(y, m - 1, d, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()))
    if (expiryDate <= now) {
      // Default to 24h duration from exact creation time
      expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  } else if (bestBefore) {
    expiryDate = new Date(bestBefore)
    if (isNaN(expiryDate.getTime()) || expiryDate <= now) {
      expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  } else {
    expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }

  const normalizedUnit = formatBackendUnit(unit)

  let finalImageUrl = imageUrl
  if (req.file) {
    finalImageUrl = `/uploads/food/${req.file.filename}`
  }

  if (!finalImageUrl) {
    const fallbacks = {
      'Cooked Meal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
      'Bakery': 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=800&auto=format&fit=crop&q=80',
      'Fresh Produce': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
      'Dairy & Eggs': 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80',
      'Packaged & Canned': 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=800&auto=format&fit=crop&q=80',
      'Beverages & Other': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
      'Beverages': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
      'Other': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
    }
    finalImageUrl = fallbacks[category] || fallbacks['Other']
  }

  const parsedTags = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
    ? tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const donorProfile = await DonorProfile.findOne({ user: req.user._id })

  const donation = await FoodDonation.create({
    donor: req.user._id,
    donorName: req.user.fullName || 'Donor',
    donorOrganization: donorProfile?.organizationName || req.user.fullName || 'Donor Organization',
    title: title.trim(),
    category,
    description: description.trim(),
    quantity: Number(quantity),
    servings: Number(quantity),
    initialQuantity: Number(quantity),
    unit: normalizedUnit,
    bestBefore: expiryDate,
    expiresAt: expiryDate,
    pickupAddress: pickupAddress.trim(),
    pickupWindow: pickupWindow.trim(),
    pickupInstructions: (pickupInstructions || '').trim(),
    imageUrl: finalImageUrl,
    tags: parsedTags,
    deliveryOptions: ['volunteer', 'direct'],
    status: 'available',
    foodSafetyAccepted: true,
    lat: req.body.lat != null && !isNaN(Number(req.body.lat)) ? Number(req.body.lat) : (donorProfile?.lat ?? null),
    lng: req.body.lng != null && !isNaN(Number(req.body.lng)) ? Number(req.body.lng) : (donorProfile?.lng ?? null),
  })

  await DonorProfile.findOneAndUpdate(
    { user: req.user._id },
    { $inc: { totalDonationsPosted: 1, totalMealsShared: Number(quantity) } }
  )

  return res.status(201).json(new ApiResponse(201, { donation }, 'Food donation posted successfully!'))
})

// PATCH /api/donors/me/donations/:id — update a food donation
export const updateDonation = asyncHandler(async (req, res) => {
  const donation = await FoodDonation.findOne({ _id: req.params.id, donor: req.user._id })
  if (!donation) throw new ApiError(404, 'Food donation not found.')

  const updatable = [
    'title',
    'category',
    'description',
    'quantity',
    'unit',
    'bestBefore',
    'pickupAddress',
    'pickupWindow',
    'pickupInstructions',
    'imageUrl',
    'status',
  ]

  updatable.forEach((key) => {
    if (req.body[key] !== undefined) donation[key] = req.body[key]
  })

  await donation.save()
  return res.status(200).json(new ApiResponse(200, { donation }, 'Food donation updated.'))
})

// DELETE /api/donors/me/donations/:id — remove a food donation
export const deleteDonation = asyncHandler(async (req, res) => {
  const donation = await FoodDonation.findOneAndDelete({ _id: req.params.id, donor: req.user._id })
  if (!donation) throw new ApiError(404, 'Food donation not found.')

  return res.status(200).json(new ApiResponse(200, { id: req.params.id }, 'Food donation deleted.'))
})

// GET /api/donors/me/requests — list requests for donor's food listings
export const getMyRequests = asyncHandler(async (req, res) => {
  const { status } = req.query
  const filter = { donor: req.user._id }

  if (status && status !== 'all') {
    filter.status = status === 'new' ? 'pending' : status
  }

  const requests = await FoodRequest.find(filter)
    .populate('donation', 'title category quantity unit imageUrl pickupAddress pickupWindow status expiresAt bestBefore')
    .populate('items.donation', 'title category quantity unit imageUrl pickupAddress pickupWindow status expiresAt bestBefore')
    .populate('receiver', 'fullName email phone')
    .sort({ createdAt: -1 })

  // Authoritatively calculate completed exchanges count for each receiver
  const receiverIds = [
    ...new Set(
      requests
        .map((r) => r.receiver?._id || r.receiver)
        .filter(Boolean)
        .map((id) => id.toString())
    ),
  ]

  const completedExchangesCounts = await Exchange.aggregate([
    {
      $match: {
        receiver: { $in: receiverIds.map((id) => new mongoose.Types.ObjectId(id)) },
        status: { $in: ['completed', 'delivered'] },
      },
    },
    {
      $group: {
        _id: '$receiver',
        count: { $sum: 1 },
      },
    },
  ])

  const countsMap = {}
  completedExchangesCounts.forEach((item) => {
    countsMap[item._id.toString()] = item.count
  })

  const formattedRequests = requests.map((reqDoc) => {
    const doc = reqDoc.toObject()
    const rId = (doc.receiver?._id || doc.receiver)?.toString()
    doc.receiverExchangesCount = countsMap[rId] || 0
    return doc
  })

  const counts = {
    all: await FoodRequest.countDocuments({ donor: req.user._id }),
    new: await FoodRequest.countDocuments({ donor: req.user._id, status: 'pending' }),
    accepted: await FoodRequest.countDocuments({ donor: req.user._id, status: 'accepted' }),
    declined: await FoodRequest.countDocuments({ donor: req.user._id, status: 'declined' }),
  }

  return res.status(200).json(
    new ApiResponse(200, { requests: formattedRequests, counts }, 'Requests fetched successfully.')
  )
})

// PATCH /api/donors/me/requests/:id — accept or decline a request
export const respondToRequest = asyncHandler(async (req, res) => {
  const { action } = req.body
  if (!['accept', 'decline'].includes(action)) {
    throw new ApiError(400, "Action must be 'accept' or 'decline'.")
  }

  const request = await FoodRequest.findOne({ _id: req.params.id, donor: req.user._id })
    .populate('donation')
    .populate('items.donation')
  if (!request) throw new ApiError(404, 'Request not found.')

  if (action === 'decline') {
    if (request.status === 'declined') {
      throw new ApiError(400, 'This request has already been declined.')
    }
    request.status = 'declined'
    await request.save()

    const itemDesc = (request.items && request.items.length > 1)
      ? `combined basket of ${request.items.length} items`
      : `${request.requestedQuantity} ${request.requestedUnit} of ${request.donation?.title || 'food donation'}`

    // Send notification to receiver safely
    await safeCreateNotification({
      user: request.receiver,
      title: 'Request Declined',
      message: `Your request for ${itemDesc} was declined.`,
      type: 'request',
      link: '/receiver/requests',
    })

    return res.status(200).json(new ApiResponse(200, { request }, 'Request declined.'))
  }

  // Prevent accepting expired food
  const now = new Date()
  if (request.items && request.items.length > 0) {
    for (const it of request.items) {
      const don = it.donation
      if (don) {
        const isPastExpiry =
          (don.bestBefore && don.bestBefore <= now) ||
          (don.expiresAt && don.expiresAt <= now)
        if (isPastExpiry && don.status !== 'completed') {
          don.status = 'expired'
          await don.save()
          throw new ApiError(400, `Cannot accept request: "${don.title || 'one of the items'}" has expired.`)
        }
      }
    }
  } else if (request.donation) {
    const isPastExpiry =
      (request.donation.bestBefore && request.donation.bestBefore <= now) ||
      (request.donation.expiresAt && request.donation.expiresAt <= now)
    if (isPastExpiry && request.donation.status !== 'completed') {
      request.donation.status = 'expired'
      await request.donation.save()
      throw new ApiError(400, 'Cannot accept a request for a food donation that has expired.')
    }
  }

  // Prevent duplicate exchanges on concurrent or repeated calls
  const existingExchange = await Exchange.findOne({ request: request._id })
  if (existingExchange) {
    return res.status(200).json(
      new ApiResponse(200, { request, exchange: existingExchange }, 'Exchange already scheduled.')
    )
  }

  if (request.status === 'declined') {
    throw new ApiError(400, 'Cannot accept a request that was already declined.')
  }

  // 1. Read authoritative delivery method from the receiver's request
  const deliveryType =
    request.deliveryPreference === 'direct_pickup' || request.deliveryMethod === 'direct_pickup'
      ? 'direct_pickup'
      : 'volunteer_delivery'

  // Mark request as accepted
  request.status = 'accepted'
  await request.save()

  // Option 1: Deduct requested quantity from each food donation listing
  if (request.items && request.items.length > 0) {
    for (const item of request.items) {
      const donationId = item.donation?._id || item.donation
      if (!donationId) continue

      const foodDonation = await FoodDonation.findById(donationId)
      if (foodDonation) {
        const currentQty = Number(foodDonation.quantity != null ? foodDonation.quantity : (foodDonation.servings || 0))
        const requestedQty = Number(item.requestedQuantity || item.servings || 1)
        const remainingQty = Math.max(0, currentQty - requestedQty)

        if (!foodDonation.initialQuantity) {
          foodDonation.initialQuantity = Math.max(currentQty, requestedQty)
        }
        foodDonation.quantity = remainingQty
        foodDonation.servings = remainingQty

        if (remainingQty <= 0) {
          foodDonation.status = 'claimed'
        } else {
          // If portions still remain, keep it available for other community receivers!
          foodDonation.status = 'available'
        }
        await foodDonation.save()
      }
    }
  } else if (request.donation) {
    const donationId = request.donation?._id || request.donation
    const foodDonation = await FoodDonation.findById(donationId)
    if (foodDonation) {
      const currentQty = Number(foodDonation.quantity != null ? foodDonation.quantity : (foodDonation.servings || 0))
      const requestedQty = Number(request.requestedQuantity || 1)
      const remainingQty = Math.max(0, currentQty - requestedQty)

      if (!foodDonation.initialQuantity) {
        foodDonation.initialQuantity = Math.max(currentQty, requestedQty)
      }
      foodDonation.quantity = remainingQty
      foodDonation.servings = remainingQty

      if (remainingQty <= 0) {
        foodDonation.status = 'claimed'
      } else {
        foodDonation.status = 'available'
      }
      await foodDonation.save()
    }
  }

  const pickupCode = Math.floor(1000 + Math.random() * 9000).toString()

  // Fetch receiver's authoritative completed exchanges count
  const receiverCompletedCount = await Exchange.countDocuments({
    receiver: request.receiver,
    status: { $in: ['completed', 'delivered'] },
  })

  const receiverProfile = await ReceiverProfile.findOne({ user: request.receiver })

  const exchangeItems =
    request.items && request.items.length > 0
      ? request.items.map((it) => ({
          donation: it.donation?._id || it.donation,
          title: it.title || it.donation?.title || 'Food Item',
          requestedQuantity: it.requestedQuantity || 1,
          requestedUnit: it.requestedUnit || 'Servings',
          category: it.category || it.donation?.category || 'Cooked Meals',
          imageUrl: it.imageUrl || it.donation?.imageUrl || '',
        }))
      : [
          {
            donation: request.donation?._id || request.donation,
            title: request.donation?.title || 'Food Donation',
            requestedQuantity: request.requestedQuantity || 1,
            requestedUnit: request.requestedUnit || 'Servings',
            category: request.donation?.category || 'Cooked Meals',
            imageUrl: request.donation?.imageUrl || '',
          },
        ]

  let exchangeData = {
    donation: request.donation?._id || request.donation,
    items: exchangeItems,
    isBasket: Boolean(request.isBasket || exchangeItems.length > 1),
    request: request._id,
    donor: req.user._id,
    receiver: request.receiver,
    receiverInfo: {
      name: request.receiverName || 'Receiver',
      phone: request.receiverPhone || '',
      organization: request.receiverOrganization || '',
      exchangesCount: receiverCompletedCount,
    },
    deliveryType,
    pickupCode,
    deliveryCode: null,
    pickupAddress: request.donation?.pickupAddress || 'Donor Address',
    pickupWindow: request.donation?.pickupWindow || '',
    dropoffAddress: receiverProfile?.dropoffAddress || receiverProfile?.organizationAddress || 'Receiver Address',
    pickupCoords: {
      lat: request.donation?.lat ?? null,
      lng: request.donation?.lng ?? null,
    },
    dropoffCoords: {
      lat: receiverProfile?.lat ?? null,
      lng: receiverProfile?.lng ?? null,
    },
    volunteerCoords: null,
  }

  let notificationPayload = null

  if (deliveryType === 'direct_pickup') {
    // Direct Receiver Pickup:
    // - Exactly ONE code (pickupCode). deliveryCode is null.
    // - No volunteer involved.
    // - Ready for pickup by receiver.
    exchangeData.volunteer = null
    exchangeData.volunteerInfo = {
      name: '',
      phone: '',
      rating: 0,
      transportType: 'walking',
      vehicleNumber: '',
      deliveriesCompleted: 0,
    }
    exchangeData.volunteerStatus = 'not_needed'
    exchangeData.status = 'ready_for_pickup'
    exchangeData.stage = 2
    exchangeData.timeline = [
      {
        step: 'accepted',
        title: 'Request Approved (Direct Receiver Pickup)',
        time: new Date(),
        actor: 'Donor',
        note: `Donor approved direct receiver collection for ${request.requestedQuantity} ${request.requestedUnit}.`,
      },
      {
        step: 'ready_for_pickup',
        title: 'Ready for Collection',
        time: new Date(),
        actor: 'Donor',
        note: `Food is packaged and ready for collection at ${request.donation?.pickupAddress} during window ${request.donation?.pickupWindow}.`,
      },
    ]

    // Do NOT include the pickup code in the notification — receiver must ask donor in person!
    notificationPayload = {
      user: request.receiver,
      title: 'Request Approved for Direct Pickup',
      message: `Your request for ${request.donation?.title} has been approved! Please collect it at ${request.donation?.pickupAddress}. Ask donor for pickup code upon arrival.`,
      type: 'order',
      link: '/receiver/pickups',
    }
  } else {
    // Volunteer Courier Delivery:
    // - TWO DIFFERENT codes:
    //   1. pickupCode: Donor -> Volunteer
    //   2. deliveryCode: Volunteer -> Receiver
    // - DO NOT assign any default or fake volunteer!
    // - Status starts as 'searching_for_volunteer' with volunteerId = null
    let deliveryCode = Math.floor(1000 + Math.random() * 9000).toString()
    while (deliveryCode === pickupCode) {
      deliveryCode = Math.floor(1000 + Math.random() * 9000).toString()
    }
    exchangeData.deliveryCode = deliveryCode

    exchangeData.volunteer = null
    exchangeData.volunteerInfo = {
      name: '',
      phone: '',
      rating: 0,
      transportType: 'other',
      vehicleNumber: '',
      deliveriesCompleted: 0,
    }
    exchangeData.volunteerStatus = 'searching_volunteer'
    exchangeData.status = 'searching_for_volunteer'
    exchangeData.stage = 1
    exchangeData.timeline = [
      {
        step: 'accepted',
        title: 'Donor Approved (Searching for Volunteer Courier)',
        time: new Date(),
        actor: 'Donor',
        note: `Donor approved delivery for ${request.requestedQuantity} ${request.requestedUnit}. System is waiting for an available volunteer courier to accept.`,
      },
    ]

    notificationPayload = {
      user: request.receiver,
      title: 'Request Approved - Finding Courier',
      message: `Donor approved your request for ${request.donation?.title}. We are searching for an available volunteer courier.`,
      type: 'order',
      link: '/receiver/pickups',
    }
  }

  // Create exchange record FIRST to guarantee database state
  const exchange = await Exchange.create(exchangeData)

  // Send in-app notification safely without blocking the workflow
  if (notificationPayload) {
    await safeCreateNotification(notificationPayload)
  }

  // If volunteer delivery, notify on-duty approved volunteers
  if (exchangeData.deliveryType === 'volunteer_delivery') {
    try {
      const onDutyVolunteers = await VolunteerProfile.find({ isOnDuty: true, reviewStatus: 'approved' }).select('user')
      for (const vp of onDutyVolunteers) {
        await safeCreateNotification({
          user: vp.user,
          title: 'New Delivery Run Available',
          message: `A new delivery for "${request.donation?.title || 'Food Donation'}" is available for pickup.`,
          type: 'delivery',
          link: '/volunteer/deliveries',
          relatedId: exchange._id,
        })
      }
    } catch (e) {
      // Non-blocking
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { request, exchange }, 'Request accepted and exchange scheduled.')
  )
})

// GET /api/donors/me/exchanges — list exchanges for this donor
export const getMyExchanges = asyncHandler(async (req, res) => {
  await autoCancelExpiredDonationsAndExchanges()

  const { status } = req.query
  const filter = { donor: req.user._id }

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

  if (status === 'in_progress') {
    filter.status = { $in: inProgressStatuses }
  } else if (status === 'completed') {
    filter.status = 'completed'
  }

  const exchanges = await Exchange.find(filter)
    .populate('donation', 'title category quantity unit imageUrl pickupAddress pickupWindow')
    .populate('items.donation', 'title category quantity unit imageUrl')
    .populate('receiver', 'fullName email phone')
    .populate('volunteer', 'fullName email phone')
    .sort({ createdAt: -1 })

  const volunteerIds = exchanges
    .filter((e) => e.volunteer)
    .map((e) => e.volunteer._id || e.volunteer)

  const volProfiles = volunteerIds.length > 0
    ? await VolunteerProfile.find({ user: { $in: volunteerIds } })
    : []
  const profileMap = new Map(volProfiles.map((p) => [p.user.toString(), p]))

  // Ensure codes and volunteer live statistics are properly assigned
  for (const ex of exchanges) {
    let changed = false
    if (!ex.pickupCode) {
      ex.pickupCode = Math.floor(1000 + Math.random() * 9000).toString()
      changed = true
    }
    if (ex.deliveryType === 'volunteer_delivery' && !ex.deliveryCode) {
      let code2 = Math.floor(1000 + Math.random() * 9000).toString()
      while (code2 === ex.pickupCode) {
        code2 = Math.floor(1000 + Math.random() * 9000).toString()
      }
      ex.deliveryCode = code2
      changed = true
    }

    if (ex.volunteer) {
      const volUserKey = (ex.volunteer._id || ex.volunteer).toString()
      const volProf = profileMap.get(volUserKey)
      if (volProf) {
        if (!ex.volunteerInfo) ex.volunteerInfo = {}
        ex.volunteerInfo.rating = volProf.rating || 0
        ex.volunteerInfo.deliveriesCompleted = volProf.totalDeliveriesCompleted || 0
      }
    }

    if (changed) {
      await ex.save()
    }
  }

  // Sort exchanges with most recent at top and older ones at bottom
  exchanges.sort((a, b) => {
    const timeB = new Date(b.deliveredAt || b.cancelledAt || b.updatedAt || b.createdAt || 0).getTime()
    const timeA = new Date(a.deliveredAt || a.cancelledAt || a.updatedAt || a.createdAt || 0).getTime()
    return timeB - timeA
  })

  const counts = {
    all: await Exchange.countDocuments({ donor: req.user._id }),
    in_progress: await Exchange.countDocuments({
      donor: req.user._id,
      status: { $in: inProgressStatuses },
    }),
    completed: await Exchange.countDocuments({ donor: req.user._id, status: 'completed' }),
  }

  return res.status(200).json(
    new ApiResponse(200, { exchanges, counts }, 'Exchanges fetched successfully.')
  )
})

// PATCH /api/donors/me/exchanges/:id/status — update exchange progress step
export const updateExchangeStatus = asyncHandler(async (req, res) => {
  const { status, note, verificationCode } = req.body
  const exchange = await Exchange.findOne({ _id: req.params.id, donor: req.user._id }).populate('donation')
  if (!exchange) throw new ApiError(404, 'Exchange not found.')

  const validStatuses = [
    'accepted',
    'ready_for_pickup',
    'searching_for_volunteer',
    'volunteer_assigned',
    'picked_up_by_volunteer',
    'picked_up',
    'out_for_delivery',
    'in_transit',
    'completed',
    'cancelled',
  ]
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid exchange status.')
  }

  // Ensure exchange has a pickupCode
  if (!exchange.pickupCode) {
    exchange.pickupCode = Math.floor(1000 + Math.random() * 9000).toString()
  }

  // If marking as picked_up, validate 4-digit verification code
  if (status === 'picked_up') {
    const cleanEntered = (verificationCode || '').toString().replace(/[^0-9]/g, '')
    const cleanExpected = (exchange.pickupCode || '').toString().replace(/[^0-9]/g, '')

    if (cleanExpected && cleanEntered !== cleanExpected) {
      throw new ApiError(400, `Invalid verification code. The 4-digit code must match #${exchange.pickupCode}.`)
    }
    exchange.handoverCodeEntered = cleanEntered || exchange.pickupCode
    exchange.handoverConfirmed = true
    exchange.stage = 3
  }

  exchange.status = status

  let stepTitle = status
  let actor = 'Donor'

  if (status === 'ready_for_pickup') {
    exchange.donorConfirmedReady = true
    stepTitle = 'Ready for Pickup'
    actor = 'Donor'
    exchange.stage = 2
  } else if (status === 'picked_up') {
    stepTitle =
      exchange.deliveryType === 'volunteer_delivery'
        ? `Picked Up by Volunteer (${exchange.volunteerInfo?.name || 'Volunteer'})`
        : 'Picked Up by Receiver'
    actor = exchange.deliveryType === 'volunteer_delivery' ? 'Volunteer' : 'Receiver'
  } else if (status === 'completed') {
    stepTitle = 'Exchange Completed & Delivered'
    actor = 'Receiver'
    exchange.stage = 5
    if (exchange.donation) {
      const donationId = exchange.donation._id || exchange.donation
      const fd = await FoodDonation.findById(donationId)
      if (fd && (fd.quantity <= 0 || fd.servings <= 0)) {
        fd.status = 'completed'
        await fd.save()
      }
    }
    await DonorProfile.findOneAndUpdate({ user: req.user._id }, { $inc: { totalMealsShared: 1 } })
  }

  exchange.timeline.push({
    step: status,
    title: stepTitle,
    time: new Date(),
    actor,
    note: note || `Status updated to ${status}`,
  })

  await exchange.save()

  // Notify receiver safely without blocking
  if (exchange.receiver) {
    const isDirect = exchange.deliveryType === 'direct_pickup'
    await safeCreateNotification({
      user: exchange.receiver,
      title: status === 'picked_up'
        ? (isDirect ? 'Food Handover Verified' : 'Courier Picked Up Food')
        : (status === 'completed' ? 'Exchange Completed' : 'Order Update'),
      message: status === 'picked_up'
        ? (isDirect ? 'The donor verified your code and completed food handover.' : `${exchange.volunteerInfo?.name || 'Volunteer courier'} picked up the food from the donor.`)
        : `Exchange status updated to ${status}.`,
      type: 'order',
      link: '/receiver/pickups',
    })
  }

  // Notify volunteer safely without blocking
  if (exchange.volunteer) {
    await safeCreateNotification({
      user: exchange.volunteer,
      title: 'Delivery Status Update',
      message: `Donor updated delivery status to "${status.replace(/_/g, ' ')}".`,
      type: 'delivery',
      link: '/volunteer/deliveries',
      relatedId: exchange._id,
    })
  }

  return res.status(200).json(new ApiResponse(200, { exchange }, 'Exchange status updated successfully.'))
})

// POST /api/donors/me/exchanges/:id/feedback — submit feedback for exchange
export const submitExchangeFeedback = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body
  const exchange = await Exchange.findOne({ _id: req.params.id, donor: req.user._id })
  if (!exchange) throw new ApiError(404, 'Exchange not found.')

  const numRating = Number(rating) || 5
  const feedbackData = {
    rating: numRating,
    comment: (comment || '').trim(),
    submittedAt: new Date(),
  }

  exchange.donorFeedback = feedbackData
  exchange.feedback = {
    ...feedbackData,
    submittedBy: req.user._id,
    role: 'donor',
  }

  await exchange.save()

  if (exchange.volunteer) {
    await syncVolunteerRating(exchange.volunteer).catch((err) => {
      console.error('Failed to sync volunteer rating from donor feedback:', err.message)
    })
    await safeCreateNotification({
      user: exchange.volunteer,
      title: 'New Donor Review Received',
      message: `Donor submitted a ${numRating}★ rating for your food delivery run.`,
      type: 'impact',
      link: '/volunteer/dashboard',
      relatedId: exchange._id,
    })
  }

  return res.status(200).json(new ApiResponse(200, { exchange }, 'Feedback submitted.'))
})

// GET /api/donors/me/impact — detailed impact stats
export const getMyImpactStats = asyncHandler(async (req, res) => {
  const [completedExchanges, totalListings, distinctReceivers, profile, allDonations] = await Promise.all([
    Exchange.countDocuments({ donor: req.user._id, status: 'completed' }),
    FoodDonation.countDocuments({ donor: req.user._id }),
    FoodRequest.distinct('receiver', { donor: req.user._id, status: 'accepted' }),
    DonorProfile.findOne({ user: req.user._id }),
    FoodDonation.find({ donor: req.user._id }),
  ])

  const totalMeals = profile?.totalMealsShared || allDonations.reduce((sum, d) => sum + (d.quantity || 0), 0)
  const totalWeightKg = Math.round(totalMeals * 0.4)

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        successfulDonations: completedExchanges,
        foodRescuedKg: totalWeightKg,
        receiversHelped: distinctReceivers.length,
        totalListings,
        communityReachMiles: totalListings > 0 ? 12 : 0,
        equivalentMealsSaved: totalMeals,
        wasteSavedPercent: totalListings > 0 ? 94 : 0,
        categoryBreakdown: [
          { category: 'Cooked Meals', count: 2, weightKg: Math.round(totalWeightKg * 0.4) },
          { category: 'Fresh Produce', count: 2, weightKg: Math.round(totalWeightKg * 0.3) },
          { category: 'Bakery', count: 1, weightKg: Math.round(totalWeightKg * 0.2) },
          { category: 'Packaged Goods', count: 1, weightKg: Math.round(totalWeightKg * 0.1) },
        ],
      },
      'Impact stats fetched successfully.'
    )
  )
})

// GET /api/donors/me/reviews — get receiver reviews for this donor
export const getDonorReviews = asyncHandler(async (req, res) => {
  const exchanges = await Exchange.find({
    donor: req.user._id,
    status: { $in: ['completed', 'delivered'] },
    $or: [
      { 'receiverToDonorFeedback.rating': { $gt: 0 } },
      { 'feedback.rating': { $gt: 0 }, 'feedback.role': 'receiver', deliveryType: 'direct_pickup' },
    ],
  })
    .populate('donation', 'title category quantity unit')
    .populate('receiver', 'fullName organizationName')
    .sort({ updatedAt: -1 })

  const reviews = []
  exchanges.forEach((ex) => {
    const fb = ex.receiverToDonorFeedback?.rating ? ex.receiverToDonorFeedback : ex.feedback
    if (fb?.rating && fb.rating > 0) {
      reviews.push({
        _id: `${ex._id}_donorReview`,
        exchangeId: ex._id,
        orderNo: ex.orderNo || `FD-${ex._id.toString().slice(-6).toUpperCase()}`,
        rating: fb.rating,
        comment: (fb.comment || '').trim(),
        submittedAt: fb.submittedAt || ex.deliveredAt || ex.updatedAt,
        donationTitle: ex.donation?.title || 'Food Donation',
        category: ex.donation?.category || 'Cooked Meals',
        reviewerName: ex.receiver?.fullName || ex.receiver?.organizationName || 'Receiver Partner',
      })
    }
  })

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
      'Donor reviews fetched successfully.'
    )
  )
})

