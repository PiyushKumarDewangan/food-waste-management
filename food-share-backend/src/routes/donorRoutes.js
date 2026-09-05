import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import {
  getMyDonorProfile,
  updateMyDonorProfile,
  getMyDonations,
  createDonation,
} from '../controllers/donorController.js'

const router = Router()

// Every route here requires a logged-in donor.
router.use(authenticate, authorize('donor'))

router.get('/me', getMyDonorProfile)
router.patch('/me', updateMyDonorProfile)
router.get('/me/donations', getMyDonations)
router.post('/me/donations', createDonation)

export default router
