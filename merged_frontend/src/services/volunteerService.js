import apiClient from './apiClient'

export const volunteerService = {
  // Profile
  getProfile: () => apiClient.get('/volunteers/me'),
  updateProfile: (data) => apiClient.patch('/volunteers/me', data),
  getReviews: () => apiClient.get('/volunteers/me/reviews'),

  // Deliveries
  getAvailableDeliveries: () => apiClient.get('/volunteers/me/available-deliveries'),
  getMyDeliveries: (status = 'all') =>
    apiClient.get(`/volunteers/me/deliveries${status && status !== 'all' ? `?status=${status}` : ''}`),
  acceptDelivery: (id) => apiClient.post(`/volunteers/me/deliveries/${id}/accept`),
  cancelDelivery: (id) => apiClient.post(`/volunteers/me/deliveries/${id}/cancel`),
  reportIssue: (id, data) => apiClient.post(`/volunteers/me/deliveries/${id}/report-issue`, data),
  verifyPickup: (id, code) => apiClient.post(`/volunteers/me/deliveries/${id}/verify-pickup`, { code }),
  startDelivery: (id) => apiClient.post(`/volunteers/me/deliveries/${id}/start-delivery`),
  verifyDelivery: (id, code) => apiClient.post(`/volunteers/me/deliveries/${id}/verify-delivery`, { code }),
  updateLocation: (id, { lat, lng, heading }) =>
    apiClient.patch(`/volunteers/me/deliveries/${id}/location`, { lat, lng, heading }),
}

export default volunteerService
