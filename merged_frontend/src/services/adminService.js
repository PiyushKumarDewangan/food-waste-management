// Admin-only API calls (list/approve/reject pending receiver & volunteer
// registrations). Every function here requires the caller to already be
// authenticated as an 'admin' — apiClient attaches the access token
// automatically; the backend's `authorize('admin')` middleware enforces
// the role server-side regardless of what the frontend does.

import apiClient from './apiClient'

export const adminService = {
  async getPendingReceivers(page = 1, limit = 20) {
    return apiClient.get(`/receivers/pending?page=${page}&limit=${limit}`)
  },

  async approveReceiver(profileId) {
    return apiClient.patch(`/receivers/${profileId}/approve`)
  },

  async rejectReceiver(profileId, reason = '') {
    return apiClient.patch(`/receivers/${profileId}/reject`, { reason })
  },

  async getPendingVolunteers(page = 1, limit = 20) {
    return apiClient.get(`/volunteers/pending?page=${page}&limit=${limit}`)
  },

  async approveVolunteer(profileId) {
    return apiClient.patch(`/volunteers/${profileId}/approve`)
  },

  async rejectVolunteer(profileId, reason = '') {
    return apiClient.patch(`/volunteers/${profileId}/reject`, { reason })
  },
}

export default adminService
