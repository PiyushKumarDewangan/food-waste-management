/**
 * Custom Error subclass used for every deliberately-thrown error in the app
 * (validation failures, auth failures, not-found, conflicts, etc).
 *
 * Keeping one shape for all errors means the errorHandler middleware only
 * needs to understand ONE error format, and the frontend only needs to
 * parse ONE error response shape.
 */
// 400 Bad Request
// 401 Unauthorized
// 403 Forbidden
// 404 Not Found
// 500 Internal Server Error

class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message)
    // This calls the parent Error constructor.
    // Without super(), inheritance from Error won't work properly.
    this.statusCode = statusCode
    this.data = null
    this.success = false
    this.errors = errors // array of field-level errors, e.g. from express-validator

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    // Automatically generate a stack trace.Error occurred
    // at createUser(...)
    // at registerController(...)
    // at router.post(...)
    }
  }
}

export { ApiError }
export default ApiError
