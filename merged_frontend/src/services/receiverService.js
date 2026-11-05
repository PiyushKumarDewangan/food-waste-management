import apiClient from './apiClient'

export const receiverService = {
  // Dashboard & Badges
  getDashboard: () => apiClient.get('/receiver/dashboard'),
  getBadges: () => apiClient.get('/receiver/badges'),

  // Listings / Browse Food
  getListings: ({ q = '', category = 'All', radius = 10, sort = 'distance', lat = null, lng = null } = {}) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category && category !== 'All') params.set('category', category)
    if (radius) params.set('radius', radius)
    if (sort) params.set('sort', sort)
    if (lat != null && lat !== '') params.set('lat', lat)
    if (lng != null && lng !== '') params.set('lng', lng)

    const queryStr = params.toString()
    return apiClient.get(`/receiver/listings${queryStr ? `?${queryStr}` : ''}`)
  },
  getListingById: (id) => apiClient.get(`/receiver/listings/${id}`),

  // Requests
  createRequest: (data) => apiClient.post('/receiver/requests', data),
  getRequests: (status = 'all') =>
    apiClient.get(`/receiver/requests${status ? `?status=${status}` : ''}`),
  cancelRequest: (id) => apiClient.patch(`/receiver/requests/${id}/cancel`),

  // Pickups & Orders
  getPickups: (tab = 'in_progress') =>
    apiClient.get(`/receiver/pickups${tab ? `?tab=${tab}` : ''}`),
  verifyDirectPickup: (id, code) =>
    apiClient.post(`/receiver/orders/${id}/verify-pickup`, { code }),
  markOrderReceived: (id) => apiClient.patch(`/receiver/orders/${id}/received`),
  rateOrder: (id, { target = 'donor', rating, comment }) =>
    apiClient.post(`/receiver/orders/${id}/rating`, { target, rating, comment }),
  reportIssue: (id, { issueType, description, photoUrl }) =>
    apiClient.post(`/receiver/orders/${id}/issue`, { issueType, description, photoUrl }),
  updateOrderStatus: (id, { stage, status }) =>
    apiClient.patch(`/receiver/orders/${id}/status`, { stage, status }),

  // History & Impact
  getHistory: ({ q = '', sort = 'desc' } = {}) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (sort) params.set('sort', sort)
    const queryStr = params.toString()
    return apiClient.get(`/receiver/history${queryStr ? `?${queryStr}` : ''}`)
  },
  getHistoryStats: () => apiClient.get('/receiver/history/stats'),
  getOrderReceipt: (id) => apiClient.get(`/receiver/orders/${id}/receipt`),

  // Profile & Settings
  getProfile: () => apiClient.get('/receiver/profile'),
  updateProfile: (data) => apiClient.put('/receiver/profile', data),
  updateCapacity: (data) => apiClient.put('/receiver/profile/capacity', data),
  updateNotifications: (data) => apiClient.put('/receiver/profile/notifications', data),

  // In-app Notifications
  getNotifications: () => apiClient.get('/receiver/notifications'),
  markNotificationRead: (id) => apiClient.patch(`/receiver/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.patch('/receiver/notifications/read-all'),
}

export default receiverService
