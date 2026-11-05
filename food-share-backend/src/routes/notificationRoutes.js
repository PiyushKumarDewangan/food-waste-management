import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../controllers/notificationController.js'

const router = Router()

// All notification operations require authentication
router.use(authenticate)

// 1. Preferences
router.get('/preferences', getNotificationPreferences)
router.put('/preferences', updateNotificationPreferences)
router.patch('/preferences', updateNotificationPreferences)

// 2. Listing & Count
router.get('/', getMyNotifications)
router.get('/unread-count', getUnreadNotificationCount)

// 3. Mark Read
router.patch('/read-all', markAllNotificationsAsRead)
router.patch('/:id/read', markNotificationAsRead)

export default router
