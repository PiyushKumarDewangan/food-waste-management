import apiClient from './apiClient'

export const volunteerService = {
  // Profile
  getProfile: () => apiClient.get('/volunteers/me'),
  updateProfile: (data) => apiClient.patch('/volunteers/me', data),
  getReviews: () => apiClient.get('/volunteers/me/reviews'),

  // Deliveries
  getAvailableDeliveries: (params) =>
    apiClient.get('/volunteers/me/available-deliveries', { params }),
  getLatestDispatchRequest: () => apiClient.get('/volunteers/me/dispatch-request'),
  getMyDeliveries: (status = 'all') =>
    apiClient.get(`/volunteers/me/deliveries${status && status !== 'all' ? `?status=${status}` : ''}`),
  acceptDelivery: (id, payload = {}) => apiClient.post(`/volunteers/me/deliveries/${id}/accept`, payload),
  switchDeliveryTransport: (id, transportType) => apiClient.patch(`/volunteers/me/deliveries/${id}/transport`, { transportType }),
  cancelDelivery: (id) => apiClient.post(`/volunteers/me/deliveries/${id}/cancel`),
  reportIssue: (id, data) => apiClient.post(`/volunteers/me/deliveries/${id}/report-issue`, data),
  verifyPickup: (id, code) => apiClient.post(`/volunteers/me/deliveries/${id}/verify-pickup`, { code }),
  startDelivery: (id) => apiClient.post(`/volunteers/me/deliveries/${id}/start-delivery`),
  verifyDelivery: (id, code) => apiClient.post(`/volunteers/me/deliveries/${id}/verify-delivery`, { code }),
  updateLocation: (id, { lat, lng, heading }) =>
    apiClient.patch(`/volunteers/me/deliveries/${id}/location`, { lat, lng, heading }),

  // Notifications
  getNotifications: () => apiClient.get('/notifications'),
  getUnreadNotificationCount: () => apiClient.get('/notifications/unread-count'),
  markNotificationAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => apiClient.patch('/notifications/read-all'),
  getNotificationPreferences: () => apiClient.get('/notifications/preferences'),
  updateNotificationPreferences: (data) => apiClient.put('/notifications/preferences', data),
}

export default volunteerService
