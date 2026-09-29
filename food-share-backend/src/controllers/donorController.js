import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { DonorProfile } from '../models/DonorProfile.js'
import { User } from '../models/User.js'
import { FoodDonation } from '../models/FoodDonation.js'
import { FoodRequest } from '../models/FoodRequest.js'
import { Exchange } from '../models/Exchange.js'
import { VolunteerProfile } from '../models/VolunteerProfile.js'

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
  const { fullName, phone, city, organizationName, donorType, pickupAddress, pickupAvailability, about } = req.body

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
  const { status } = req.query
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
  }

  return res.status(200).json(
    new ApiResponse(200, { donations, counts }, 'Donations fetched successfully.')
  )
})

// GET /api/donors/me/donations/:id — get single donation with interested receivers
export const getDonationById = asyncHandler(async (req, res) => {
  const donation = await FoodDonation.findOne({ _id: req.params.id, donor: req.user._id })
  if (!donation) throw new ApiError(404, 'Food donation not found.')

  const requests = await FoodRequest.find({ donation: donation._id })
    .populate('receiver', 'fullName email phone')
    .sort({ createdAt: -1 })

  return res.status(200).json(
    new ApiResponse(200, { donation, interestedReceivers: requests }, 'Donation details fetched.')
  )
})

// POST /api/donors/me/donations — create a new food donation listing
export const createDonation = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    description,
    quantity,
    unit = 'servings',
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

  const donation = await FoodDonation.create({
    donor: req.user._id,
    title: title.trim(),
    category,
    description: description.trim(),
    quantity: Number(quantity),
    unit: unit.trim(),
    bestBefore: new Date(bestBefore),
    pickupAddress: pickupAddress.trim(),
    pickupWindow: pickupWindow.trim(),
    pickupInstructions: (pickupInstructions || '').trim(),
    imageUrl: finalImageUrl,
    tags: parsedTags,
    status: 'available',
    foodSafetyAccepted: true,
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
    .populate('donation', 'title category quantity unit imageUrl pickupAddress pickupWindow status')
    .populate('receiver', 'fullName email phone')
    .sort({ createdAt: -1 })

  const counts = {
    all: await FoodRequest.countDocuments({ donor: req.user._id }),
    new: await FoodRequest.countDocuments({ donor: req.user._id, status: 'pending' }),
    accepted: await FoodRequest.countDocuments({ donor: req.user._id, status: 'accepted' }),
    declined: await FoodRequest.countDocuments({ donor: req.user._id, status: 'declined' }),
  }

  return res.status(200).json(
    new ApiResponse(200, { requests, counts }, 'Requests fetched successfully.')
  )
})

// PATCH /api/donors/me/requests/:id — accept or decline a request
export const respondToRequest = asyncHandler(async (req, res) => {
  const { action, deliveryType = 'volunteer_delivery' } = req.body
  if (!['accept', 'decline'].includes(action)) {
    throw new ApiError(400, "Action must be 'accept' or 'decline'.")
  }

  const request = await FoodRequest.findOne({ _id: req.params.id, donor: req.user._id }).populate('donation')
  if (!request) throw new ApiError(404, 'Request not found.')

  if (request.status !== 'pending') {
    throw new ApiError(400, `This request has already been ${request.status}.`)
  }

  if (action === 'decline') {
    request.status = 'declined'
    await request.save()
    return res.status(200).json(new ApiResponse(200, { request }, 'Request declined.'))
  }

  // Accept action:
  request.status = 'accepted'
  await request.save()

  // Update donation status
  await FoodDonation.findByIdAndUpdate(request.donation._id, { status: 'claimed' })

  // Find an available volunteer if deliveryType === 'volunteer_delivery'
  let volunteerUser = null
  let volunteerInfo = {
    name: 'Assigned Courier',
    phone: '',
    rating: 5.0,
    transportType: 'car',
    vehicleNumber: '',
    deliveriesCompleted: 0,
  }

  if (deliveryType === 'volunteer_delivery') {
    const volunteerUsers = await User.find({ role: 'volunteer', status: 'active' })
    if (volunteerUsers.length > 0) {
      volunteerUser = volunteerUsers[0]
      const vProfile = await VolunteerProfile.findOne({ user: volunteerUser._id })
      volunteerInfo = {
        name: volunteerUser.fullName,
        phone: volunteerUser.phone,
        rating: 4.9,
        transportType: vProfile?.transportType || 'car',
        vehicleNumber: vProfile?.vehicleNumber || '',
        deliveriesCompleted: vProfile?.totalDeliveriesCompleted || 0,
      }
    }
  }

  // Create an exchange with Volunteer integration
  const exchange = await Exchange.create({
    donation: request.donation._id,
    request: request._id,
    donor: req.user._id,
    receiver: request.receiver,
    receiverInfo: {
      name: request.receiverName,
      phone: request.receiverPhone,
      organization: request.receiverOrganization,
      exchangesCount: request.receiverExchangesCount,
    },
    deliveryType,
    volunteer: volunteerUser ? volunteerUser._id : null,
    volunteerInfo,
    volunteerStatus: deliveryType === 'volunteer_delivery' ? 'assigned' : 'not_needed',
    pickupCode: Math.floor(1000 + Math.random() * 9000).toString(),
    status: 'accepted',
    pickupAddress: request.donation.pickupAddress,
    pickupWindow: request.donation.pickupWindow,
    timeline: [
      {
        step: 'accepted',
        title: 'Request Accepted',
        time: new Date(),
        actor: 'Donor',
        note: `Donor accepted request for ${request.requestedQuantity} ${request.requestedUnit}`,
      },
      ...(deliveryType === 'volunteer_delivery' && volunteerUser
        ? [
            {
              step: 'volunteer_assigned',
              title: `Volunteer Assigned (${volunteerInfo.name})`,
              time: new Date(),
              actor: 'Volunteer',
              note: `${volunteerInfo.name} assigned via ${volunteerInfo.transportType}`,
            },
          ]
        : []),
    ],
  })

  return res.status(200).json(
    new ApiResponse(200, { request, exchange }, 'Request accepted and exchange scheduled.')
  )
})

// GET /api/donors/me/exchanges — list exchanges for this donor
export const getMyExchanges = asyncHandler(async (req, res) => {
  const { status } = req.query
  const filter = { donor: req.user._id }

  if (status === 'in_progress') {
    filter.status = { $in: ['accepted', 'ready_for_pickup', 'volunteer_assigned', 'picked_up', 'in_transit'] }
  } else if (status === 'completed') {
    filter.status = 'completed'
  }

  const exchanges = await Exchange.find(filter)
    .populate('donation', 'title category quantity unit imageUrl pickupAddress pickupWindow')
    .populate('receiver', 'fullName email phone')
    .populate('volunteer', 'fullName email phone')
    .sort({ createdAt: -1 })

  // Ensure all exchanges have a 4-digit pickup code
  for (const ex of exchanges) {
    if (!ex.pickupCode) {
      ex.pickupCode = Math.floor(1000 + Math.random() * 9000).toString()
      await ex.save()
    }
  }

  const counts = {
    all: await Exchange.countDocuments({ donor: req.user._id }),
    in_progress: await Exchange.countDocuments({
      donor: req.user._id,
      status: { $in: ['accepted', 'ready_for_pickup', 'volunteer_assigned', 'picked_up', 'in_transit'] },
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
    'volunteer_assigned',
    'picked_up',
    'in_transit',
    'completed',
  ]
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid exchange status.')
  }

  // Ensure exchange has a pickupCode
  if (!exchange.pickupCode) {
    exchange.pickupCode = Math.floor(1000 + Math.random() * 9000).toString()
  }

  // If marking as picked_up and verificationCode is provided, validate it
  if (status === 'picked_up' && verificationCode) {
    if (verificationCode.trim() !== exchange.pickupCode) {
      throw new ApiError(400, `Invalid verification code. The 4-digit code must match #${exchange.pickupCode}.`)
    }
    exchange.handoverCodeEntered = verificationCode.trim()
  }

  exchange.status = status

  let stepTitle = status
  let actor = 'Donor'

  if (status === 'ready_for_pickup') {
    exchange.donorConfirmedReady = true
    stepTitle = 'Ready for Pickup'
    actor = 'Donor'
  } else if (status === 'picked_up') {
    exchange.handoverConfirmed = true
    stepTitle =
      exchange.deliveryType === 'volunteer_delivery'
        ? `Picked Up by Volunteer (${exchange.volunteerInfo?.name || 'Volunteer'})`
        : 'Picked Up by Receiver'
    actor = exchange.deliveryType === 'volunteer_delivery' ? 'Volunteer' : 'Receiver'
  } else if (status === 'completed') {
    stepTitle = 'Exchange Completed & Delivered'
    actor = 'Receiver'
    await FoodDonation.findByIdAndUpdate(exchange.donation._id, { status: 'completed' })
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

  return res.status(200).json(new ApiResponse(200, { exchange }, 'Exchange status updated successfully.'))
})

// POST /api/donors/me/exchanges/:id/feedback — submit feedback for exchange
export const submitExchangeFeedback = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body
  const exchange = await Exchange.findOne({ _id: req.params.id, donor: req.user._id })
  if (!exchange) throw new ApiError(404, 'Exchange not found.')

  exchange.feedback = {
    rating: Number(rating) || 5,
    comment: comment || '',
    submittedAt: new Date(),
  }

  await exchange.save()
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
