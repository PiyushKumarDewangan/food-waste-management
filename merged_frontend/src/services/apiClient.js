// Thin fetch wrapper. Swap the implementation here (e.g. for axios) without
// touching any of the service files that consume it.
//
// Auth notes:
// - `credentials: 'include'` is required on EVERY call so the browser sends
//   the httpOnly refresh-token cookie set by the backend (see authController.js).
// - The access token is injected from memory (via setAccessTokenGetter),
//   never from localStorage — this keeps it out of reach of XSS attacks.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// The access token lives in React state (AuthContext), not here. AuthContext
// registers a getter on load so apiClient can read the *current* token
// without importing React/context into a plain JS module.
let getAccessToken = () => null
export function setAccessTokenGetter(fn) {
  getAccessToken = fn
}

// Lets AuthContext hook into "the server told me my session is dead" so it
// can clear user state and redirect to /login, without apiClient needing to
// know about React Router.
let onUnauthorized = () => {}
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

async function request(path, { method = 'GET', body, headers, isFormData = false, skipAuthRetry = false } = {}) {
  const finalHeaders = { ...headers }
  if (!isFormData) finalHeaders['Content-Type'] = 'application/json'

  const token = getAccessToken()
  if (token) finalHeaders.Authorization = `Bearer ${token}`

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    credentials: 'include', // sends/receives the httpOnly refresh-token cookie
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  let data = null
  try {
    data = await response.json()
  } catch (err) {
    // No JSON body — fine for some responses (e.g. 204s).
  }

  if (response.status === 401 && !skipAuthRetry && path !== '/auth/refresh') {
    // Access token expired — the AuthContext-registered handler will try a
    // silent refresh + retry once. If that also fails, it logs the user out.
    return onUnauthorized(() => request(path, { method, body, headers, isFormData, skipAuthRetry: true }))
  }

  if (!response.ok) {
    const message = data?.message || 'Something went wrong. Please try again.'
    const error = new Error(message)
    error.statusCode = response.status
    error.errors = data?.errors || []
    throw error
  }

  return data
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}

export default apiClient
