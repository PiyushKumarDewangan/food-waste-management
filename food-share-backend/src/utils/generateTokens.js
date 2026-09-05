import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

/**
 * Signs a short-lived ACCESS token. Sent in the Authorization header on
 * every authenticated request. Payload is intentionally minimal.
 */
export function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  )
}

/**
 * Signs a long-lived REFRESH token. Only ever transported via an httpOnly
 * cookie — never read by frontend JS, never sent in a normal API header.
 */
export function generateRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET)
}
