import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { reviewActionValidator, rejectActionValidator } from '../validators/adminValidators.js'
import {
  getMyVolunteerProfile,
  updateMyVolunteerProfile,
  listPendingVolunteers,
  approveVolunteer,
  rejectVolunteer,
  getMyDeliveries,
} from '../controllers/volunteerController.js'

const router = Router()

router.get('/me', authenticate, authorize('volunteer'), getMyVolunteerProfile)
router.patch('/me', authenticate, authorize('volunteer'), updateMyVolunteerProfile)
router.get('/me/deliveries', authenticate, authorize('volunteer'), getMyDeliveries)

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
