import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Notification } from '../models/Notification.js'
import { DonorProfile } from '../models/DonorProfile.js'
import { ReceiverProfile } from '../models/ReceiverProfile.js'
import { VolunteerProfile } from '../models/VolunteerProfile.js'

// GET /api/notifications — list notifications for current authenticated user
export const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const limit = Math.min(Number(req.query.limit) || 30, 100)

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit),
    Notification.countDocuments({ user: userId, isRead: false }),
  ])

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications,
        unreadCount,
        total: notifications.length,
      },
      'Notifications fetched successfully.'
    )
  )
})

// GET /api/notifications/unread-count — quick badge query
export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  })

  return res.status(200).json(
    new ApiResponse(200, { unreadCount: count }, 'Unread count fetched.')
  )
})

// PATCH /api/notifications/:id/read — mark one notification as read
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { isRead: true } },
    { new: true }
  )

  if (!notif) {
    throw new ApiError(404, 'Notification not found or access denied.')
  }

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  })

  return res.status(200).json(
    new ApiResponse(200, { notification: notif, unreadCount }, 'Notification marked as read.')
  )
})

// PATCH /api/notifications/read-all — mark all notifications as read
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  )

  return res.status(200).json(
    new ApiResponse(200, { unreadCount: 0 }, 'All notifications marked as read.')
  )
})

// GET /api/notifications/preferences — get notification settings for current user
export const getNotificationPreferences = asyncHandler(async (req, res) => {
  if (req.user.role === 'donor') {
    let profile = await DonorProfile.findOne({ user: req.user._id })
    if (!profile) {
      profile = await DonorProfile.create({
        user: req.user._id,
        pickupAddress: req.user.city || 'Default Address',
        pickupAvailability: 'Daily (9am - 6pm)',
        foodSafetyAccepted: true,
      })
    }

    const prefs = profile.notificationPreferences || {
      newFoodRequest: true,
      volunteerCourierUpdates: true,
      exchangeCompleted: true,
    }

    return res.status(200).json(
      new ApiResponse(200, prefs, 'Notification preferences fetched.')
    )
  }

  if (req.user.role === 'receiver') {
    const profile = await ReceiverProfile.findOne({ user: req.user._id })
    return res.status(200).json(
      new ApiResponse(200, profile?.notificationPrefs || {}, 'Notification preferences fetched.')
    )
  }

  if (req.user.role === 'volunteer') {
    const profile = await VolunteerProfile.findOne({ user: req.user._id })
    const prefs = profile?.notificationPreferences || {
      nearbyPickups: true,
      urgentExpiryAlerts: true,
      exchangeStatusUpdates: true,
      weeklyImpactDigest: true,
    }
    return res.status(200).json(
      new ApiResponse(200, prefs, 'Notification preferences fetched.')
    )
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { newFoodRequest: true, volunteerCourierUpdates: true, exchangeCompleted: true },
      'Default notification preferences.'
    )
  )
})

// PUT /api/notifications/preferences — update notification preferences for current user
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { newFoodRequest, volunteerCourierUpdates, exchangeCompleted } = req.body

  if (req.user.role === 'donor') {
    let profile = await DonorProfile.findOne({ user: req.user._id })
    if (!profile) {
      profile = await DonorProfile.create({
        user: req.user._id,
        pickupAddress: req.user.city || 'Default Address',
        pickupAvailability: 'Daily (9am - 6pm)',
        foodSafetyAccepted: true,
      })
    }

    if (!profile.notificationPreferences) {
      profile.notificationPreferences = {
        newFoodRequest: true,
        volunteerCourierUpdates: true,
        exchangeCompleted: true,
      }
    }

    if (typeof newFoodRequest === 'boolean') {
      profile.notificationPreferences.newFoodRequest = newFoodRequest
    }
    if (typeof volunteerCourierUpdates === 'boolean') {
      profile.notificationPreferences.volunteerCourierUpdates = volunteerCourierUpdates
    }
    if (typeof exchangeCompleted === 'boolean') {
      profile.notificationPreferences.exchangeCompleted = exchangeCompleted
    }

    await profile.save()

    return res.status(200).json(
      new ApiResponse(200, profile.notificationPreferences, 'Notification preferences updated successfully.')
    )
  }

  if (req.user.role === 'volunteer') {
    let profile = await VolunteerProfile.findOne({ user: req.user._id })
    if (profile) {
      if (!profile.notificationPreferences) {
        profile.notificationPreferences = {
          nearbyPickups: true,
          urgentExpiryAlerts: true,
          exchangeStatusUpdates: true,
          weeklyImpactDigest: true,
        }
      }

      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === 'boolean') {
          profile.notificationPreferences[key] = req.body[key]
        }
      })

      await profile.save()

      return res.status(200).json(
        new ApiResponse(200, profile.notificationPreferences, 'Volunteer notification preferences updated successfully.')
      )
    }
  }

  return res.status(200).json(
    new ApiResponse(200, req.body, 'Preferences updated.')
  )
})
