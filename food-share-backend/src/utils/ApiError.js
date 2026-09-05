/**
 * Custom Error subclass used for every deliberately-thrown error in the app
 * (validation failures, auth failures, not-found, conflicts, etc).
 *
 * Keeping one shape for all errors means the errorHandler middleware only
 * needs to understand ONE error format, and the frontend only needs to
 * parse ONE error response shape.
 */
class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message)
    this.statusCode = statusCode
    this.data = null
    this.success = false
    this.errors = errors // array of field-level errors, e.g. from express-validator

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export { ApiError }
export default ApiError
