import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { reviewActionValidator, rejectActionValidator } from '../validators/adminValidators.js'
import {
  getMyVolunteerProfile,
  updateMyVolunteerProfile,
  getVolunteerReviews,
  listPendingVolunteers,
  approveVolunteer,
  rejectVolunteer,
  getMyDeliveries,
  getAvailableDeliveries,
  getLatestDispatchRequest,
  acceptDelivery,
  cancelDelivery,
  reportIssueAndReassign,
  verifyVolunteerPickup,
  startVolunteerDelivery,
  verifyVolunteerDelivery,
  updateDeliveryLocation,
  switchDeliveryTransport,
} from '../controllers/volunteerController.js'

const router = Router()

router.get('/me', authenticate, authorize('volunteer'), getMyVolunteerProfile)
router.patch('/me', authenticate, authorize('volunteer'), updateMyVolunteerProfile)
router.get('/me/reviews', authenticate, authorize('volunteer'), getVolunteerReviews)

// Volunteer Delivery Operations
router.get('/me/available-deliveries', authenticate, authorize('volunteer'), getAvailableDeliveries)
router.get('/me/dispatch-request', authenticate, authorize('volunteer'), getLatestDispatchRequest)
router.get('/me/deliveries', authenticate, authorize('volunteer'), getMyDeliveries)
router.post('/me/deliveries/:id/accept', authenticate, authorize('volunteer'), acceptDelivery)
router.patch('/me/deliveries/:id/transport', authenticate, authorize('volunteer'), switchDeliveryTransport)
router.post('/me/deliveries/:id/cancel', authenticate, authorize('volunteer'), cancelDelivery)
router.post('/me/deliveries/:id/report-issue', authenticate, authorize('volunteer'), reportIssueAndReassign)
router.post('/me/deliveries/:id/verify-pickup', authenticate, authorize('volunteer'), verifyVolunteerPickup)
router.post('/me/deliveries/:id/start-delivery', authenticate, authorize('volunteer'), startVolunteerDelivery)
router.post('/me/deliveries/:id/verify-delivery', authenticate, authorize('volunteer'), verifyVolunteerDelivery)
router.patch('/me/deliveries/:id/location', authenticate, authorize('volunteer'), updateDeliveryLocation)

// Admin-only review endpoints
router.get('/pending', authenticate, authorize('admin'), listPendingVolunteers)
router.patch(
  '/:id/approve',
  authenticate,
  authorize('admin'),
  reviewActionValidator,
  validateRequest,
  approveVolunteer
)
router.patch(
  '/:id/reject',
  authenticate,
  authorize('admin'),
  rejectActionValidator,
  validateRequest,
  rejectVolunteer
)

export default router
