import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { verifyAccessToken } from '../utils/generateTokens.js'
import { User } from '../models/User.js'

/**
 * Protects a route: requires a valid access token in the
 * `Authorization: Bearer <token>` header. Attaches the authenticated
 * user document to req.user for downstream handlers.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    throw new ApiError(401, 'Access token missing. Please log in.')
  }

  let decoded
  try {
    decoded = verifyAccessToken(token)
  } catch (err) {
    // Distinguish "expired" from "invalid" so the frontend knows whether
    // to silently call /auth/refresh or force a full logout.
    const message = err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token'
    throw new ApiError(401, message)
  }

  const user = await User.findById(decoded.sub)
  if (!user) {
    throw new ApiError(401, 'User account no longer exists.')
  }

  req.user = user
  next()
})

export default authenticate
