import apiClient from './apiClient'

export const donorService = {
  // Profile
  getProfile: () => apiClient.get('/donors/me'),
  updateProfile: (data) => apiClient.patch('/donors/me', data),
  getReviews: () => apiClient.get('/donors/me/reviews'),

  // Stats & Impact
  getStats: () => apiClient.get('/donors/me/stats'),
  getImpact: () => apiClient.get('/donors/me/impact'),

  // Donations
  getDonations: (status = 'all') =>
    apiClient.get(`/donors/me/donations${status ? `?status=${status}` : ''}`),
  getDonationById: (id) => apiClient.get(`/donors/me/donations/${id}`),
  createDonation: (data, isFormData = false) =>
    apiClient.post('/donors/me/donations', data, { isFormData }),
  updateDonation: (id, data) => apiClient.patch(`/donors/me/donations/${id}`, data),
  deleteDonation: (id) => apiClient.delete(`/donors/me/donations/${id}`),

  // Requests
  getRequests: (status = 'all') =>
    apiClient.get(`/donors/me/requests${status ? `?status=${status}` : ''}`),
  respondToRequest: (id, action, deliveryType = 'volunteer_delivery') =>
    apiClient.patch(`/donors/me/requests/${id}`, { action, deliveryType }),

  // Exchanges
  getExchanges: (status = 'all') =>
    apiClient.get(`/donors/me/exchanges${status ? `?status=${status}` : ''}`),
  updateExchangeStatus: (id, status, note = '', verificationCode = '') =>
    apiClient.patch(`/donors/me/exchanges/${id}/status`, { status, note, verificationCode }),
  submitFeedback: (id, rating, comment) =>
    apiClient.post(`/donors/me/exchanges/${id}/feedback`, { rating, comment }),

  // Notifications
  getNotifications: () => apiClient.get('/notifications'),
  getUnreadNotificationCount: () => apiClient.get('/notifications/unread-count'),
  markNotificationAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => apiClient.patch('/notifications/read-all'),
  getNotificationPreferences: () => apiClient.get('/notifications/preferences'),
  updateNotificationPreferences: (preferences) => apiClient.put('/notifications/preferences', preferences),
}

export default donorService
