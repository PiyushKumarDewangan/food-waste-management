import { Router } from 'express'
import {
  registerDonor,
  registerReceiver,
  registerVolunteer,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleLogin,
} from '../controllers/authController.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { authenticate } from '../middleware/authenticate.js'
import { authRateLimiter, loginRateLimiter } from '../middleware/rateLimiter.js'
import { uploadVerificationDocument } from '../middleware/upload.js'
import {
  registerDonorValidator,
  registerReceiverValidator,
  registerVolunteerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/authValidators.js'

const router = Router()

router.post('/register/donor', authRateLimiter, registerDonorValidator, validateRequest, registerDonor)

// multer runs BEFORE validation here because the verification document arrives
// as multipart/form-data — express-validator needs req.body already parsed by multer first.
router.post(
  '/register/receiver',
  authRateLimiter,
  uploadVerificationDocument,
  registerReceiverValidator,
  validateRequest,
  registerReceiver
)

router.post('/register/volunteer', authRateLimiter, registerVolunteerValidator, validateRequest, registerVolunteer)

router.post('/login', loginRateLimiter, loginValidator, validateRequest, login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', authenticate, getMe)

router.post('/forgot-password', authRateLimiter, forgotPasswordValidator, validateRequest, forgotPassword)
router.post('/reset-password', authRateLimiter, resetPasswordValidator, validateRequest, resetPassword)

router.post('/google', authRateLimiter, googleLogin)

export default router
