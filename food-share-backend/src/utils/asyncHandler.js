/**
 * Wraps an async Express route/controller so any rejected promise (or
 * thrown error, including ApiError) is forwarded to next(), where the
 * centralized errorHandler middleware takes over.
 *
 * Without this, every controller would need its own try/catch block.
 *
 * Usage:
 *   const loginUser = asyncHandler(async (req, res) => { ... })
 */
const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch(next)
}

export { asyncHandler }
export default asyncHandler
