import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import {
  getReceiverDashboard,
  getReceiverBadges,
  getReceiverListings,
  getListingById,
  createFoodRequest,
  getReceiverRequests,
  cancelFoodRequest,
  getReceiverPickups,
  verifyDirectPickup,
  markOrderReceived,
  rateOrder,
  reportOrderIssue,
  updateOrderStatus,
  getReceiverHistory,
  getReceiverHistoryStats,
  getOrderReceipt,
  getReceiverProfile,
  updateReceiverProfile,
  updateReceiverCapacity,
  updateReceiverNotificationPrefs,
  getReceiverNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/receiverDashboardController.js'

const router = Router()

// All routes require authentication and receiver role
router.use(authenticate)

// 1. Dashboard & Badges
router.get('/dashboard', authorize('receiver'), getReceiverDashboard)
router.get('/badges', authorize('receiver'), getReceiverBadges)

// 2. Browse Food & Listings
router.get('/listings', authorize('receiver'), getReceiverListings)
router.get('/listings/:id', authorize('receiver'), getListingById)

// 3. Requests
router.post('/requests', authorize('receiver'), createFoodRequest)
router.get('/requests', authorize('receiver'), getReceiverRequests)
router.patch('/requests/:id/cancel', authorize('receiver'), cancelFoodRequest)

// 4. Pickups / Deliveries / Orders
router.get('/pickups', authorize('receiver'), getReceiverPickups)
router.post('/orders/:id/verify-pickup', authorize('receiver'), verifyDirectPickup)
router.patch('/orders/:id/received', authorize('receiver'), markOrderReceived)
router.post('/orders/:id/rating', authorize('receiver'), rateOrder)
router.post('/orders/:id/issue', authorize('receiver'), reportOrderIssue)
// Status update endpoint (allow courier, donor, or admin/receiver to advance orders for testing)
router.patch('/orders/:id/status', updateOrderStatus)

// 5. History, Impact & Receipt
router.get('/history', authorize('receiver'), getReceiverHistory)
router.get('/history/stats', authorize('receiver'), getReceiverHistoryStats)
router.get('/orders/:id/receipt', authorize('receiver'), getOrderReceipt)

// 6. Profile & Preferences
router.get('/profile', authorize('receiver'), getReceiverProfile)
router.put('/profile', authorize('receiver'), updateReceiverProfile)
router.put('/profile/capacity', authorize('receiver'), updateReceiverCapacity)
router.put('/profile/notifications', authorize('receiver'), updateReceiverNotificationPrefs)

// 7. Notifications
router.get('/notifications', authorize('receiver'), getReceiverNotifications)
router.patch('/notifications/read-all', authorize('receiver'), markAllNotificationsAsRead)
router.patch('/notifications/:id/read', authorize('receiver'), markNotificationAsRead)

export default router
