import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { uploadFoodPhoto } from '../middleware/upload.js'
import {
  getMyDonorProfile,
  updateMyDonorProfile,
  getMyDonorStats,
  getMyDonations,
  getDonationById,
  createDonation,
  updateDonation,
  deleteDonation,
  getMyRequests,
  respondToRequest,
  getMyExchanges,
  updateExchangeStatus,
  submitExchangeFeedback,
  getMyImpactStats,
} from '../controllers/donorController.js'

const router = Router()

// Every route here requires a logged-in donor.
router.use(authenticate, authorize('donor'))

// Profile & stats
router.get('/me', getMyDonorProfile)
router.patch('/me', updateMyDonorProfile)
router.get('/me/stats', getMyDonorStats)
router.get('/me/impact', getMyImpactStats)

// Donations
router.get('/me/donations', getMyDonations)
router.get('/me/donations/:id', getDonationById)
router.post('/me/donations', uploadFoodPhoto, createDonation)
router.patch('/me/donations/:id', updateDonation)
router.delete('/me/donations/:id', deleteDonation)

// Requests from receivers
router.get('/me/requests', getMyRequests)
router.patch('/me/requests/:id', respondToRequest)

// Exchanges (with volunteer tracking!)
router.get('/me/exchanges', getMyExchanges)
router.patch('/me/exchanges/:id/status', updateExchangeStatus)
router.post('/me/exchanges/:id/feedback', submitExchangeFeedback)

export default router
