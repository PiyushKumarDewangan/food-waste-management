import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { reviewActionValidator, rejectActionValidator } from '../validators/adminValidators.js'
import {
  getMyReceiverProfile,
  updateMyReceiverProfile,
  listPendingReceivers,
  approveReceiver,
  rejectReceiver,
} from '../controllers/receiverController.js'

const router = Router()

router.get('/me', authenticate, authorize('receiver'), getMyReceiverProfile)
router.patch('/me', authenticate, authorize('receiver'), updateMyReceiverProfile)

// Admin-only review endpoints
router.get('/pending', authenticate, authorize('admin'), listPendingReceivers)
router.patch(
  '/:id/approve',
  authenticate,
  authorize('admin'),
  reviewActionValidator,
  validateRequest,
  approveReceiver
)
router.patch(
  '/:id/reject',
  authenticate,
  authorize('admin'),
  rejectActionValidator,
  validateRequest,
  rejectReceiver
)

export default router
