import { Notification } from '../models/Notification.js'
import { DonorProfile } from '../models/DonorProfile.js'

/**
 * Creates an in-app notification for a donor respecting their notificationPreferences.
 * Checks idempotency via relatedId, category, and title to prevent duplicate notifications during retries.
 */
export async function createDonorNotification(donorUserId, {
  title,
  message,
  category = 'general',
  type = 'general',
  link = '',
  relatedId = null,
}) {
  try {
    if (!donorUserId) return null

    // 1. Check Donor Profile notification preferences
    const profile = await DonorProfile.findOne({ user: donorUserId })
    if (profile?.notificationPreferences) {
      if (category === 'newFoodRequest' && profile.notificationPreferences.newFoodRequest === false) {
        return null // Suppressed by user preference
      }
      if (category === 'volunteerCourierUpdates' && profile.notificationPreferences.volunteerCourierUpdates === false) {
        return null // Suppressed by user preference
      }
      if (category === 'exchangeCompleted' && profile.notificationPreferences.exchangeCompleted === false) {
        return null // Suppressed by user preference
      }
    }

    // 2. Idempotency check: avoid creating duplicate notifications for the same event
    if (relatedId) {
      const existing = await Notification.findOne({
        user: donorUserId,
        relatedId,
        category,
        title,
      })
      if (existing) {
        return existing
      }
    }

    // 3. Create the notification
    const notification = await Notification.create({
      user: donorUserId,
      title,
      message,
      category,
      type,
      link,
      relatedId,
      isRead: false,
    })

    return notification
  } catch (err) {
    // Fail safely: Never crash the caller or rollback the transaction solely because notification creation failed
    console.error('Failed to create donor notification safely:', err.message)
    return null
  }
}

export default createDonorNotification
