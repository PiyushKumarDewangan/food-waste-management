/**
 * Consistent success-response envelope. Every successful controller
 * response should be sent via `new ApiResponse(...)` so the frontend
 * can always rely on the same { statusCode, data, message, success } shape.
 */
class ApiResponse {
  constructor(statusCode, data = null, message = 'Success') {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400
  }
}

export { ApiResponse }
export default ApiResponse
