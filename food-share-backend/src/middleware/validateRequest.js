import { validationResult } from 'express-validator'
import { ApiError } from '../utils/ApiError.js'

/**
 * Runs after an express-validator rule chain (see validators/authValidators.js).
 * Collects any rule failures into a clean { field, message } array and throws
 * a single 400 ApiError — controllers never need to check validation manually.
 */
export function validateRequest(req, res, next) {
  const result = validationResult(req)
  if (result.isEmpty()) return next()

  const formattedErrors = result.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }))

  next(new ApiError(400, 'Validation failed', formattedErrors))
}

export default validateRequest
