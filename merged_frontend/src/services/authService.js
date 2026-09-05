// All auth + registration network calls live here so pages/components never
// talk to fetch/axios directly. Every function below now calls the real
// backend (see food-share-backend/src/routes/authRoutes.js for the matching
// endpoints) instead of the previous mocked responses.

import apiClient from './apiClient'

export const authService = {
  // payload: { identifier, password, rememberMe }
  // Note: rememberMe is currently accepted by the UI but not yet used by the
  // backend to vary refresh-token lifetime — see backend TODO if you want
  // "stay logged in 30 days" vs a shorter session.
  async login(payload) {
    return apiClient.post('/auth/login', payload)
  },

  // payload matches the Donor registration contract (JSON — no file upload)
  async registerDonor(payload) {
    return apiClient.post('/auth/register/donor', payload)
  },

  // payload matches the Receiver registration contract.
  // verificationDocument is a File object (or null) — sent as multipart/form-data
  // because the backend's multer middleware expects a real file upload.
  async registerReceiver(payload) {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined) return
      formData.append(key, value)
    })
    return apiClient.post('/auth/register/receiver', formData, { isFormData: true })
  },

  // payload matches the Volunteer registration contract.
  // availableDays is an array — stringified since it's sent as JSON here (no file upload).
  async registerVolunteer(payload) {
    return apiClient.post('/auth/register/volunteer', payload)
  },

  async googleLogin() {
    // TODO: wire up the real Google OAuth flow using VITE_GOOGLE_CLIENT_ID
    // (e.g. Google Identity Services), then send the returned credential here:
    // return apiClient.post('/auth/google', { credential })
    throw new Error('Google sign-in is not yet configured.')
  },

  async forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email })
  },

  async resetPassword(token, newPassword) {
    return apiClient.post('/auth/reset-password', { token, newPassword })
  },

  // Used by AuthContext on app load to silently restore a session from the
  // httpOnly refresh cookie, and again whenever an access token expires.
  async refresh() {
    return apiClient.post('/auth/refresh')
  },

  async logout() {
    return apiClient.post('/auth/logout')
  },

  // Fetches the currently authenticated user — useful for confirming a
  // token is still valid, or re-hydrating user data after a refresh.
  async getMe() {
    return apiClient.get('/auth/me')
  },
}

export default authService
