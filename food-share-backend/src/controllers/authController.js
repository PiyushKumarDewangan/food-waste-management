import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { User } from '../models/User.js'
import { DonorProfile } from '../models/DonorProfile.js'
import { ReceiverProfile } from '../models/ReceiverProfile.js'
import { VolunteerProfile } from '../models/VolunteerProfile.js'
import { RefreshToken } from '../models/RefreshToken.js'
import { hashPassword, comparePassword } from '../utils/hashPassword.js'
import { hashToken } from '../utils/hashToken.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateTokens.js'
import { sendEmail } from '../utils/sendEmail.js'
import { passwordResetEmail, passwordChangedEmail } from '../emails/passwordResetEmail.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import crypto from 'crypto'

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — keep in sync with JWT_REFRESH_EXPIRY
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function issueTokens(res, user, req) {
  const accessToken = generateAccessToken(user)
  const rawRefreshToken = generateRefreshToken(user)

  const decoded = verifyRefreshToken(rawRefreshToken)
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt: new Date(decoded.exp * 1000),
    createdByIp: req.ip,
  })

  res.cookie(env.REFRESH_COOKIE_NAME, rawRefreshToken, REFRESH_COOKIE_OPTIONS)
  return accessToken
}

function checkDuplicateEmailOrPhone(email, phone) {
  return User.findOne({ $or: [{ email }, { phone }] })
}

// ---------------------------------------------------------------------------
// POST /api/auth/register/donor
// ---------------------------------------------------------------------------
export const registerDonor = asyncHandler(async (req, res) => {
  const {
    fullName, email, phone, password, city,
    donorType, organizationName, pickupAddress, pickupAvailability, foodSafetyAccepted,
  } = req.body

  const existing = await checkDuplicateEmailOrPhone(email, phone)
  if (existing) throw new ApiError(409, 'An account with this email or phone already exists.')

  const passwordHash = await hashPassword(password)

  const user = await User.create({
    fullName, email, phone, city,
    passwordHash,
    role: 'donor',
    status: 'active', // Donors are auto-verified per product spec
  })

  await DonorProfile.create({
    user: user._id,
    donorType,
    organizationName: organizationName || '',
    pickupAddress,
    pickupAvailability,
    foodSafetyAccepted: foodSafetyAccepted === true || foodSafetyAccepted === 'true',
  })

  const accessToken = await issueTokens(res, user, req)

  return res
    .status(201)
    .json(new ApiResponse(201, { accessToken, user: user.toSafeObject(), status: 'active' }, 'Donor account created successfully.'))
})

// ---------------------------------------------------------------------------
// POST /api/auth/register/receiver
// ---------------------------------------------------------------------------
export const registerReceiver = asyncHandler(async (req, res) => {
  const {
    fullName, email, phone, password, city,
    organizationName, contactPerson, organizationAddress, storageCapacity, operatingHours,
  } = req.body

  const existing = await checkDuplicateEmailOrPhone(email, phone)
  if (existing) throw new ApiError(409, 'An account with this email or phone already exists.')

  const passwordHash = await hashPassword(password)

  const user = await User.create({
    fullName, email, phone, city,
    passwordHash,
    role: 'receiver',
    status: 'pending_review', // Requires admin approval before login is allowed
  })

  await ReceiverProfile.create({
    user: user._id,
    organizationName,
    contactPerson,
    organizationAddress,
    storageCapacity,
    operatingHours,
    verificationDocumentUrl: req.file ? `/uploads/verification-docs/${req.file.filename}` : null,
    verificationDocumentOriginalName: req.file ? req.file.originalname : null,
  })

  // No tokens issued yet — the account must be approved before the user can log in.
  return res
    .status(201)
    .json(new ApiResponse(201, { user: user.toSafeObject(), status: 'pending_review' }, 'Registration submitted for review.'))
})

// ---------------------------------------------------------------------------
// POST /api/auth/register/volunteer
// ---------------------------------------------------------------------------
export const registerVolunteer = asyncHandler(async (req, res) => {
  const {
    fullName, email, phone, password, city,
    availableDays, preferredTime, serviceRadius, transportType, vehicleNumber, guidelinesAccepted,
  } = req.body

  const existing = await checkDuplicateEmailOrPhone(email, phone)
  if (existing) throw new ApiError(409, 'An account with this email or phone already exists.')

  const passwordHash = await hashPassword(password)

  const user = await User.create({
    fullName, email, phone, city,
    passwordHash,
    role: 'volunteer',
    status: 'pending_review',
  })

  const parsedDays = Array.isArray(availableDays) ? availableDays : JSON.parse(availableDays || '[]')

  await VolunteerProfile.create({
    user: user._id,
    availableDays: parsedDays,
    preferredTime,
    serviceRadius,
    transportType,
    vehicleNumber: vehicleNumber || '',
    guidelinesAccepted: guidelinesAccepted === true || guidelinesAccepted === 'true',
  })

  return res
    .status(201)
    .json(new ApiResponse(201, { user: user.toSafeObject(), status: 'pending_review' }, 'Registration submitted for review.'))
})

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body

  const isEmail = identifier.includes('@')
  const query = isEmail ? { email: identifier.toLowerCase() } : { phone: identifier }

  const user = await User.findOne(query).select('+passwordHash')
  if (!user) throw new ApiError(401, 'Invalid email/phone or password.')

  if (user.authProvider === 'google' && !user.passwordHash) {
    throw new ApiError(400, 'This account uses Google sign-in. Please continue with Google.')
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash)
  if (!isPasswordValid) throw new ApiError(401, 'Invalid email/phone or password.')

  if (user.status === 'pending_review') {
    throw new ApiError(403, 'Your account is still under review. We will notify you once approved.')
  }
  if (user.status === 'rejected') {
    throw new ApiError(403, 'Your registration was not approved. Please contact support.')
  }
  if (user.status === 'suspended') {
    throw new ApiError(403, 'Your account has been suspended. Please contact support.')
  }

  user.lastLoginAt = new Date()
  await user.save()

  const accessToken = await issueTokens(res, user, req)

  return res
    .status(200)
    .json(new ApiResponse(200, { accessToken, user: user.toSafeObject() }, 'Login successful.'))
})

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------
export const refresh = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.[env.REFRESH_COOKIE_NAME]
  if (!rawToken) throw new ApiError(401, 'No refresh token provided. Please log in again.')

  let decoded
  try {
    decoded = verifyRefreshToken(rawToken)
  } catch (err) {
    throw new ApiError(401, 'Refresh token invalid or expired. Please log in again.')
  }

  const tokenHash = hashToken(rawToken)
  const storedToken = await RefreshToken.findOne({ tokenHash })

  if (!storedToken || storedToken.revoked) {
    // Reuse of a revoked/rotated token — possible token theft. Revoke everything for this user.
    if (storedToken) {
      await RefreshToken.updateMany({ user: storedToken.user, revoked: false }, { revoked: true, revokedAt: new Date() })
    }
    res.clearCookie(env.REFRESH_COOKIE_NAME, { path: '/api/auth' })
    throw new ApiError(401, 'Session invalid. Please log in again.')
  }

  const user = await User.findById(decoded.sub)
  if (!user) throw new ApiError(401, 'User account no longer exists.')

  // Rotate: revoke the old token, issue a brand new one.
  storedToken.revoked = true
  storedToken.revokedAt = new Date()

  const newAccessToken = generateAccessToken(user)
  const newRawRefreshToken = generateRefreshToken(user)
  const newDecoded = verifyRefreshToken(newRawRefreshToken)

  const newTokenDoc = await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(newRawRefreshToken),
    expiresAt: new Date(newDecoded.exp * 1000),
    createdByIp: req.ip,
  })

  storedToken.replacedByTokenHash = newTokenDoc.tokenHash
  await storedToken.save()

  res.cookie(env.REFRESH_COOKIE_NAME, newRawRefreshToken, REFRESH_COOKIE_OPTIONS)

  return res
    .status(200)
    .json(new ApiResponse(200, { accessToken: newAccessToken, user: user.toSafeObject() }, 'Token refreshed.'))
})

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
export const logout = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.[env.REFRESH_COOKIE_NAME]

  if (rawToken) {
    const tokenHash = hashToken(rawToken)
    await RefreshToken.updateOne({ tokenHash }, { revoked: true, revokedAt: new Date() })
  }

  res.clearCookie(env.REFRESH_COOKIE_NAME, { path: '/api/auth' })
  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'))
})

// ---------------------------------------------------------------------------
// GET /api/auth/me  (protected — requires `authenticate` middleware)
// ---------------------------------------------------------------------------
export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, { user: req.user.toSafeObject() }, 'Current user fetched.'))
})

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// ---------------------------------------------------------------------------
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email: email.toLowerCase() })

  // Always respond with the same message whether or not the account exists —
  // this prevents attackers from using this endpoint to enumerate valid emails.
  const genericMessage = 'If an account exists for this email, reset instructions have been sent.'

  if (!user) {
    return res.status(200).json(new ApiResponse(200, null, genericMessage))
  }

  const rawResetToken = crypto.randomBytes(32).toString('hex')
  user.passwordResetTokenHash = hashToken(rawResetToken)
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  await user.save()

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawResetToken}`
  const { subject, html, text } = passwordResetEmail({ fullName: user.fullName, resetUrl })

  try {
    await sendEmail({ to: user.email, subject, html, text })
  } catch (err) {
    // Don't leak email-provider failures to the client — the generic
    // message is returned either way. The real error is logged server-side
    // so it's debuggable without exposing anything to a potential attacker.
    logger.error('Failed to send password reset email:', err.message)
  }

  return res.status(200).json(new ApiResponse(200, null, genericMessage))
})

// ---------------------------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------------------------
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body
  const tokenHash = hashToken(token)

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires')

  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired.')

  user.passwordHash = await hashPassword(newPassword)
  user.passwordResetTokenHash = null
  user.passwordResetExpires = null
  await user.save()

  // Invalidate all existing sessions for this user as a security measure.
  await RefreshToken.updateMany({ user: user._id, revoked: false }, { revoked: true, revokedAt: new Date() })

  try {
    const { subject, html, text } = passwordChangedEmail({ fullName: user.fullName })
    await sendEmail({ to: user.email, subject, html, text })
  } catch (err) {
    // A failed notification email should never block a successful password reset.
    logger.error('Failed to send password-changed confirmation email:', err.message)
  }

  return res.status(200).json(new ApiResponse(200, null, 'Password reset successful. Please log in.'))
})

// ---------------------------------------------------------------------------
// POST /api/auth/google  (placeholder — wire up google-auth-library later)
// ---------------------------------------------------------------------------
export const googleLogin = asyncHandler(async (req, res) => {
  // TODO: verify req.body.credential using google-auth-library's OAuth2Client,
  // extract { email, name, sub: googleId } from the verified payload, then
  // findOrCreate a User with authProvider: 'google', googleId, and issue tokens
  // via issueTokens(res, user, req) exactly like the other flows above.
  throw new ApiError(501, 'Google login is not yet implemented on the backend.')
})
