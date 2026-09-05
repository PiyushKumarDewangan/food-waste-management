import rateLimit from 'express-rate-limit'

/**
 * Throttles brute-force attempts against auth endpoints. Keyed by IP.
 * Applied to /login and /register/* routes only — not the whole API.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many attempts. Please try again in a few minutes.',
  },
})

// Slightly stricter limiter specifically for login, since it's the highest-value target.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many login attempts. Please try again in a few minutes.',
  },
})

export default authRateLimiter
