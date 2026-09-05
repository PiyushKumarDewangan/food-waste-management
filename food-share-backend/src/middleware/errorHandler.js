import { ApiError } from '../utils/ApiError.js'
import { logger } from '../utils/logger.js'
import { env } from '../config/env.js'

/**
 * Centralized error handler — the LAST middleware registered in app.js.
 * Every thrown ApiError (or unexpected error) ends up here via asyncHandler's
 * next(error) call, and gets turned into one consistent JSON error shape.
 */
export function errorHandler(err, req, res, next) {
  let error = err

  if (!(error instanceof ApiError)) {
    // An error we didn't deliberately throw (a bug, a DB hiccup, etc).
    // Never leak internals to the client — log the real thing, respond generically.
    const statusCode = error.statusCode || 500
    const message = error.message || 'Internal server error'
    error = new ApiError(statusCode, message, [], err.stack)
  }

  logger.error(`${req.method} ${req.originalUrl} -`, error.message)
  if (env.NODE_ENV !== 'production') {
    logger.error(error.stack)
  }

  return res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    // Stack traces only ever exposed in non-production environments.
    ...(env.NODE_ENV !== 'production' && { stack: error.stack }),
  })
}

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`))
}

export default errorHandler
