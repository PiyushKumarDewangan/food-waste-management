import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import {
  getAdminDashboard,
  getAdminApplications,
  getAdminUsers,
  toggleUserStatus,
  updateUserDetails,
  getAdminFoodListings,
  createAdminFoodListing,
  updateAdminFoodListing,
  getAdminFoodJourney,
  broadcastFoodSOS,
  deleteFoodListing,
  getAdminDeliveries,
  getAvailableVolunteers,
  assignVolunteerToDelivery,
  getAdminReports,
  getAdminNotifications,
  getAdminUnreadNotificationCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
} from '../controllers/adminController.js'
import { approveReceiver, rejectReceiver } from '../controllers/receiverController.js'
import { approveVolunteer, rejectVolunteer } from '../controllers/volunteerController.js'

const router = Router()

// All routes require authenticated Admin
router.use(authenticate, authorize('admin'))

// 1. Dashboard
router.get('/dashboard', getAdminDashboard)

// 2. Applications (Unified Verifications Queue)
router.get('/applications', getAdminApplications)
router.patch('/applications/receiver/:id/approve', approveReceiver)
router.post('/applications/receiver/:id/approve', approveReceiver)
router.patch('/applications/receiver/:id/reject', rejectReceiver)
router.post('/applications/receiver/:id/reject', rejectReceiver)
router.patch('/applications/volunteer/:id/approve', approveVolunteer)
router.post('/applications/volunteer/:id/approve', approveVolunteer)
router.patch('/applications/volunteer/:id/reject', rejectVolunteer)
router.post('/applications/volunteer/:id/reject', rejectVolunteer)

// 3. User Directory & Management
router.get('/users', getAdminUsers)
router.patch('/users/:id/status', toggleUserStatus)
router.patch('/users/:id', updateUserDetails)

// 4. Food Management & Inventory
router.get('/food', getAdminFoodListings)
router.post('/food', createAdminFoodListing)
router.patch('/food/:id', updateAdminFoodListing)
router.get('/food/:id/journey', getAdminFoodJourney)
router.post('/food/:id/broadcast-sos', broadcastFoodSOS)
router.delete('/food/:id', deleteFoodListing)

// 5. Logistics & Deliveries
router.get('/deliveries', getAdminDeliveries)
router.get('/volunteers/available', getAvailableVolunteers)
router.post('/deliveries/:id/assign-volunteer', assignVolunteerToDelivery)

// 6. Impact Reports & Analytics
router.get('/reports', getAdminReports)

// 7. Admin Notifications
router.get('/notifications', getAdminNotifications)
router.get('/notifications/unread-count', getAdminUnreadNotificationCount)
router.patch('/notifications/read-all', markAllAdminNotificationsAsRead)
router.patch('/notifications/:id/read', markAdminNotificationAsRead)

export default router
