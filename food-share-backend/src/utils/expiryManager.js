import { FoodDonation } from '../models/FoodDonation.js'
import { Exchange } from '../models/Exchange.js'
import { FoodRequest } from '../models/FoodRequest.js'
import { Notification } from '../models/Notification.js'
import { createDonorNotification } from './notificationService.js'

/**
 * Centrally checks for expired donations and auto-cancels any active,
 * in-progress deliveries / exchanges linked to expired food.
 * Ensures the Donor, Receiver, and Volunteer dashboards stay 100% in sync
 * and protects food safety across the platform.
 */
export async function autoCancelExpiredDonationsAndExchanges() {
  try {
    const now = new Date()

    // 1. Find all food donations that have reached expiry or bestBefore and are not completed or cancelled
    const expiredDonations = await FoodDonation.find({
      status: { $in: ['available', 'requested', 'claimed'] },
      $or: [
        { expiresAt: { $lte: now } },
        { bestBefore: { $lte: now } },
      ],
    })

    if (expiredDonations.length > 0) {
      const expiredDonationIds = expiredDonations.map((d) => d._id)

      // Mark these donations as expired
      await FoodDonation.updateMany(
        { _id: { $in: expiredDonationIds } },
        { $set: { status: 'expired' } }
      )

      // Cancel any pending / accepted food requests for these expired donations
      await FoodRequest.updateMany(
        { donation: { $in: expiredDonationIds }, status: { $in: ['pending', 'accepted'] } },
        { $set: { status: 'cancelled' } }
      )

      // Notify donors of expired food
      for (const don of expiredDonations) {
        if (don.donor) {
          await createDonorNotification(don.donor, {
            title: `Donation Expired: ${don.title}`,
            message: `Your food donation "${don.title}" reached its safe consumption window and has expired. For safety, it has been removed from active listings. Please safely discard the item.`,
            category: 'general',
            type: 'expiry',
            relatedId: don._id,
          })
        }
      }
    }

    // 2. Find any active, uncompleted exchanges where the food has expired or donation is marked expired
    const activeExchanges = await Exchange.find({
      status: {
        $in: [
          'accepted',
          'ready_for_pickup',
          'searching_for_volunteer',
          'volunteer_assigned',
          'picked_up_by_volunteer',
          'picked_up',
          'out_for_delivery',
          'in_transit',
        ],
      },
    }).populate('donation')

    for (const ex of activeExchanges) {
      if (!ex.donation) continue

      const isExpired =
        ex.donation.status === 'expired' ||
        (ex.donation.expiresAt && new Date(ex.donation.expiresAt) <= now) ||
        (ex.donation.bestBefore && new Date(ex.donation.bestBefore) <= now)

      if (isExpired) {
        await cancelExpiredExchange(ex, ex.donation)
      }
    }
  } catch (err) {
    console.error('Error in autoCancelExpiredDonationsAndExchanges:', err.message)
  }
}

/**
 * Cancels an individual exchange due to food expiration, updates timeline,
 * and notifies all three parties (Receiver, Volunteer, Donor).
 */
async function cancelExpiredExchange(exchange, donation) {
  try {
    const foodTitle = donation?.title || 'Food Donation'

    exchange.status = 'cancelled'
    exchange.volunteerStatus = 'none'
    exchange.stage = 1

    exchange.timeline.push({
      step: 'cancelled',
      title: 'Order Cancelled (Food Expired)',
      time: new Date(),
      actor: 'System',
      note: `The safe consumption window for "${foodTitle}" has passed. Order automatically cancelled for food safety.`,
    })

    await exchange.save()

    // 1. Notify Receiver
    if (exchange.receiver) {
      const recId = exchange.receiver._id || exchange.receiver
      await Notification.create({
        user: recId,
        title: `Order Cancelled: ${foodTitle} Expired`,
        message: `Your order #${exchange.orderNo} for "${foodTitle}" was automatically cancelled because the food reached its safe consumption limit. For your health and safety, expired food cannot be delivered.`,
        type: 'expiry',
        category: 'system',
        relatedId: exchange._id,
      }).catch(() => {})
    }

    // 2. Notify Volunteer (if assigned)
    if (exchange.volunteer) {
      const volId = exchange.volunteer._id || exchange.volunteer
      await Notification.create({
        user: volId,
        title: `Delivery Cancelled: ${foodTitle} Expired`,
        message: `Delivery run #${exchange.orderNo} for "${foodTitle}" was cancelled because the food reached its safe consumption limit. You do not need to collect or deliver this item.`,
        type: 'delivery',
        category: 'volunteerCourierUpdates',
        relatedId: exchange._id,
      }).catch(() => {})
    }

    // 3. Notify Donor
    if (exchange.donor) {
      const donorId = exchange.donor._id || exchange.donor
      await createDonorNotification(donorId, {
        title: `Delivery Cancelled: ${foodTitle} Expired`,
        message: `Order #${exchange.orderNo} for "${foodTitle}" was cancelled because it was not picked up before the safe consumption limit expired.`,
        category: 'general',
        type: 'expiry',
        relatedId: exchange._id,
      })
    }
  } catch (err) {
    console.error('Failed to cancel expired exchange:', err.message)
  }
}

let schedulerInterval = null

/**
 * Starts a background interval that runs every 60 seconds to clean up expired items.
 */
export function startExpiryScheduler() {
  if (schedulerInterval) return

  // Run initial pass immediately
  autoCancelExpiredDonationsAndExchanges()

  // Run periodic pass every 60 seconds
  schedulerInterval = setInterval(() => {
    autoCancelExpiredDonationsAndExchanges()
  }, 60 * 1000)
}
