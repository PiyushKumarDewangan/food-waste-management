import apiClient from './apiClient'

// Initial fallback datasets kept for seamless graceful degradation if network fails
export const MOCK_PENDING_APPLICATIONS = [
  {
    _id: 'rec-001',
    user: {
      fullName: 'Hope Foundation Kitchen',
      email: 'contact@hopefoundation.org',
      phone: '+91 98201 12345',
      city: 'Bandra West, Mumbai',
      role: 'receiver',
      status: 'pending_review',
    },
    organizationName: 'Hope Foundation Kitchen',
    receiverType: 'NGO',
    role: 'receiver',
    documentType: '80G NGO Certificate + PAN',
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    timeLabel: '2h ago',
    reviewStatus: 'pending',
    applicantNotes:
      'All requested supporting documents are included. Please contact us if any additional information is required.',
    documentDetails: {
      title: 'CERTIFICATE OF REGISTRATION',
      certNumber: 'NGO-80G-MH-2024-8841',
      authority: 'Department of Social Welfare & Charity Commissioner, Maharashtra',
      validUntil: '31-Dec-2028',
      verifiedStamp: 'OFFICIALLY VERIFIED',
    },
  },
  {
    _id: 'vol-001',
    user: {
      fullName: 'Rahul Verma',
      email: 'rahul.v@email.com',
      phone: '+91 98112 55678',
      city: 'Andheri East, Mumbai',
      role: 'volunteer',
      status: 'pending_review',
    },
    organizationName: 'Rahul Verma',
    vehicleType: 'Bike Courier',
    role: 'volunteer',
    documentType: 'Government ID + Driving License',
    submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    timeLabel: '4h ago',
    reviewStatus: 'pending',
    applicantNotes:
      'Available for pickup duties in Andheri, Bandra and Powai regions. Valid two-wheeler commercial permit attached.',
    documentDetails: {
      title: 'MOTOR VEHICLES DRIVING PERMIT',
      certNumber: 'DL-MH02-2021008492',
      authority: 'Regional Transport Office, Mumbai West',
      validUntil: '15-Aug-2031',
      verifiedStamp: 'RTO VALIDATED',
    },
  },
]

export const MOCK_USERS = [
  {
    id: 'usr-1',
    _id: 'usr-1',
    name: 'Piyush Kumar Dewangan',
    email: 'piyushdewangan461@gmail.com',
    phone: '+91 98200 44321',
    role: 'Donor',
    city: 'Tikrapara Raipur',
    impactActivity: '24 Donations',
    status: 'Active',
    joinedDate: '12-Oct-2026',
    initials: 'PD',
  },
  {
    id: 'usr-2',
    _id: 'usr-2',
    name: 'Preeti Dewangan',
    email: 'preetidewangan3131@gmail.com',
    phone: '+91 98201 12345',
    role: 'Receiver',
    city: 'Deopuri Raipur',
    impactActivity: '18 Collections',
    status: 'Active',
    joinedDate: '18-Oct-2026',
    initials: 'PD',
  },
  {
    id: 'usr-3',
    _id: 'usr-3',
    name: 'P Vidyashree',
    email: 'pvidyashree2005@gmail.com',
    phone: '+91 98112 55678',
    role: 'Volunteer',
    city: 'Sector 4, Bhilai',
    impactActivity: '15 Deliveries',
    status: 'Active',
    joinedDate: '20-Oct-2026',
    initials: 'PV',
  },
]

export const MOCK_FOOD_LISTINGS = [
  {
    id: 'food-001',
    _id: 'food-001',
    title: 'Hot Veg Biryani & Curry',
    donor: 'Piyush Kumar Dewangan',
    city: 'Tikrapara Raipur',
    category: 'Cooked Meals',
    isVeg: true,
    quantity: '25 Servings',
    servings: 25,
    status: 'Available',
    statusClass: 'text-[#2E7D32]',
    expiryTime: new Date(Date.now() + 105 * 60 * 1000).toISOString(),
    expiryLabel: 'Expires in 1h 45m',
    expiryUrgency: 'critical',
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
    packaging: 'Sealed eco-friendly compostable containers',
    specialInstructions: 'Keep hot. Freshly packed.',
  },
]

export const MOCK_EXCHANGES = [
  {
    id: '#EX-1042',
    _id: 'ex-1042',
    donor: { name: 'Piyush Kumar Dewangan', area: 'Tikrapara Raipur', coords: { lat: 21.1894, lng: 81.3598 } },
    receiver: { name: 'Preeti Dewangan', area: 'Deopuri Raipur', coords: { lat: 21.2514, lng: 81.6296 } },
    volunteer: {
      name: 'P Vidyashree',
      phone: '+91 98112 55678',
      vehicle: 'Bike',
      avatar: 'PV',
      coords: { lat: 21.215, lng: 81.45 },
    },
    distanceEta: '14.2 km • 25 mins',
    deliveryStage: 'In Transit',
    stageColor: 'text-[#1565C0] bg-blue-50 border-blue-200',
    foodItem: '25 Hot Veg Biryani & Curry',
  },
]

export const adminService = {
  // 1. Dashboard Overview
  async getDashboard() {
    try {
      const res = await apiClient.get('/admin/dashboard')
      return res.data?.data || res.data
    } catch (err) {
      console.warn('adminService.getDashboard failed, falling back:', err.message)
      return {
        kpis: {
          totalUsers: 1248,
          donorsCount: 420,
          receiversCount: 310,
          volunteersCount: 518,
          suspendedUsersCount: 8,
          pendingVerifications: 6,
          activeFoodListings: 28,
          completedExchanges: 45,
        },
        pendingApplications: MOCK_PENDING_APPLICATIONS,
        monthlyTrends: [
          { month: 'Jun', weight: 1200, meals: 3000 },
          { month: 'Jul', weight: 1800, meals: 4500 },
          { month: 'Aug', weight: 2400, meals: 6000 },
          { month: 'Sep', weight: 3100, meals: 7750 },
          { month: 'Oct', weight: 3900, meals: 9750 },
          { month: 'Nov', weight: 4850, meals: 12800 },
        ],
        categoryBreakdown: [
          { name: 'Cooked Meals', count: 18, percentage: 55, color: '#2E7D32' },
          { name: 'Packaged Goods', count: 6, percentage: 25, color: '#6A1B9A' },
          { name: 'Fresh Produce', count: 5, percentage: 20, color: '#1565C0' },
        ],
      }
    }
  },

  // 2. Verifications / Applications
  async getAllPendingApplications(params = {}) {
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiClient.get(`/admin/applications${qs ? `?${qs}` : ''}`)
      return res.data?.data?.applications || res.data?.applications || []
    } catch (err) {
      console.warn('adminService.getAllPendingApplications failed:', err.message)
      return MOCK_PENDING_APPLICATIONS
    }
  },

  async approveReceiver(profileId) {
    try {
      return await apiClient.patch(`/admin/applications/receiver/${profileId}/approve`)
    } catch {
      // Fallback to legacy receiver route
      return await apiClient.patch(`/receivers/${profileId}/approve`)
    }
  },

  async rejectReceiver(profileId, reason = '') {
    try {
      return await apiClient.patch(`/admin/applications/receiver/${profileId}/reject`, { reason })
    } catch {
      return await apiClient.patch(`/receivers/${profileId}/reject`, { reason })
    }
  },

  async approveVolunteer(profileId) {
    try {
      return await apiClient.patch(`/admin/applications/volunteer/${profileId}/approve`)
    } catch {
      return await apiClient.patch(`/volunteers/${profileId}/approve`)
    }
  },

  async rejectVolunteer(profileId, reason = '') {
    try {
      return await apiClient.patch(`/admin/applications/volunteer/${profileId}/reject`, { reason })
    } catch {
      return await apiClient.patch(`/volunteers/${profileId}/reject`, { reason })
    }
  },

  // 3. User Directory & Management
  async getUsers(params = {}) {
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiClient.get(`/admin/users${qs ? `?${qs}` : ''}`)
      return res.data?.data || res.data
    } catch (err) {
      console.warn('adminService.getUsers failed:', err.message)
      return {
        users: MOCK_USERS,
        counts: {
          total: MOCK_USERS.length,
          donors: 1,
          receivers: 1,
          volunteers: 1,
          suspended: 0,
        },
      }
    }
  },

  async updateUserStatus(userId, status) {
    return await apiClient.patch(`/admin/users/${userId}/status`, { status })
  },

  async updateUserDetails(userId, data) {
    return await apiClient.patch(`/admin/users/${userId}`, data)
  },

  // 4. Food Inventory & SOS
  async getFoodListings(params = {}) {
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiClient.get(`/admin/food${qs ? `?${qs}` : ''}`)
      return res.data?.data || res.data
    } catch (err) {
      console.warn('adminService.getFoodListings failed:', err.message)
      return {
        listings: MOCK_FOOD_LISTINGS,
        stats: {
          active: MOCK_FOOD_LISTINGS.length,
          expiringSoon: 1,
          rescuedTodayKg: 140,
          totalDivertedKg: 4850,
        },
      }
    }
  },

  async broadcastFoodSOS(foodId) {
    return await apiClient.post(`/admin/food/${foodId}/broadcast-sos`)
  },

  async createFoodListing(data) {
    const res = await apiClient.post('/admin/food', data)
    return res.data?.data || res.data
  },

  async updateFoodListing(foodId, data) {
    const res = await apiClient.patch(`/admin/food/${foodId}`, data)
    return res.data?.data || res.data
  },

  async getFoodJourney(foodId) {
    const res = await apiClient.get(`/admin/food/${foodId}/journey`)
    return res.data?.data || res.data
  },

  async deleteFoodListing(foodId) {
    return await apiClient.delete(`/admin/food/${foodId}`)
  },

  // 5. Logistics & Deliveries
  async getDeliveries(params = {}) {
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiClient.get(`/admin/deliveries${qs ? `?${qs}` : ''}`)
      return res.data?.data || res.data
    } catch (err) {
      console.warn('adminService.getDeliveries failed:', err.message)
      return {
        exchanges: MOCK_EXCHANGES,
        stats: {
          pendingPickup: 2,
          inTransit: 1,
          completedToday: 5,
          delayedAlerts: 0,
        },
      }
    }
  },

  async getAvailableVolunteers() {
    try {
      const res = await apiClient.get('/admin/volunteers/available')
      return res.data?.data?.volunteers || []
    } catch (err) {
      console.warn('adminService.getAvailableVolunteers failed:', err.message)
      return [
        { id: 'vol-1', name: 'P Vidyashree', vehicle: 'Bike', phone: '+91 98112 55678', distance: '1.2 km away' },
        { id: 'vol-2', name: 'Rahul Verma', vehicle: 'Scooter', phone: '+91 98990 11223', distance: '2.5 km away' },
      ]
    }
  },

  async assignVolunteer(deliveryId, volunteerId) {
    return await apiClient.post(`/admin/deliveries/${deliveryId}/assign-volunteer`, { volunteerId })
  },

  // 6. Impact Reports & Analytics
  async getImpactAnalytics(timeRange = '30days') {
    try {
      const res = await apiClient.get(`/admin/reports?timeRange=${timeRange}`)
      return res.data?.data || res.data
    } catch (err) {
      console.warn('adminService.getImpactAnalytics failed:', err.message)
      return {
        stats: {
          totalMeals: '224 Meals',
          foodRescuedKg: '90 kg',
          co2Prevented: '0.2 Tons CO₂e',
          waterFootprintLiters: '14,560 Liters',
        },
        monthlyGrowth: [
          { month: 'Jun', weight: 15, heightPct: 25 },
          { month: 'Jul', weight: 28, heightPct: 40 },
          { month: 'Aug', weight: 45, heightPct: 60 },
          { month: 'Sep', weight: 62, heightPct: 75 },
          { month: 'Oct', weight: 78, heightPct: 85 },
          { month: 'Nov', weight: 90, heightPct: 100 },
        ],
        monthlyBars: [
          { month: 'Jun', weight: 15, heightPct: 25 },
          { month: 'Jul', weight: 28, heightPct: 40 },
          { month: 'Aug', weight: 45, heightPct: 60 },
          { month: 'Sep', weight: 62, heightPct: 75 },
          { month: 'Oct', weight: 78, heightPct: 85 },
          { month: 'Nov', weight: 90, heightPct: 100 },
        ],
        topDonors: [
          { rank: 1, name: 'Piyush Kumar Dewangan', weight: '88 kg', meals: '219 meals' },
          { rank: 2, name: 'Ritu Sahu', weight: '2 kg', meals: '5 meals' },
        ],
        starVolunteers: [
          { rank: 1, name: 'P Vidyashree', deliveries: 20, rating: '⭐ 5.0', badge: 'Star Courier' },
        ],
      }
    }
  },

  // 7. Notifications
  async getNotifications(params = {}) {
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiClient.get(`/admin/notifications${qs ? `?${qs}` : ''}`)
      return res.data?.data || res.data
    } catch (err) {
      console.warn('adminService.getNotifications fallback:', err.message)
      const res = await apiClient.get('/notifications')
      return res.data?.data || res.data
    }
  },

  async getUnreadNotificationCount() {
    try {
      const res = await apiClient.get('/admin/notifications/unread-count')
      return res.data?.data || res.data
    } catch {
      const res = await apiClient.get('/notifications/unread-count')
      return res.data?.data || res.data
    }
  },

  async markNotificationAsRead(id) {
    try {
      return await apiClient.patch(`/admin/notifications/${id}/read`)
    } catch {
      return await apiClient.patch(`/notifications/${id}/read`)
    }
  },

  async markAllNotificationsAsRead() {
    try {
      return await apiClient.patch('/admin/notifications/read-all')
    } catch {
      return await apiClient.patch('/notifications/read-all')
    }
  },
}

export default adminService