import { ApiError } from '../utils/ApiError.js'

/**
 * Role guard — use AFTER `authenticate`. Restricts a route to specific
 * roles, e.g. authorize('donor') or authorize('admin', 'receiver').
 */

//...allowedRoles
// This is the rest operator.
// It collects all arguments into an array
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.')
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action.')
    }
    next()
  }
}

export default authorize
