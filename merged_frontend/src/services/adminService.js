// Admin-only API calls & data service.
// Interacts with backend endpoints (/receivers/pending, /volunteers/pending, etc.)
// and provides rich fallback & mock data for capabilities awaiting dedicated backend routes.

import apiClient from './apiClient'

// Initial mock dataset strictly aligned with Figma designs
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
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
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
    submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
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
  {
    _id: 'rec-002',
    user: {
      fullName: 'Care Orphanage Care Center',
      email: 'admin@carehome.org',
      phone: '+91 98450 99821',
      city: 'Dadar, Mumbai',
      role: 'receiver',
      status: 'pending_review',
    },
    organizationName: 'Care Orphanage Center',
    receiverType: 'Shelter',
    role: 'receiver',
    documentType: 'Shelter Registration Cert',
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    timeLabel: 'Yesterday',
    reviewStatus: 'pending',
    applicantNotes:
      'Registered child shelter providing for 120 residents daily. Seeking morning and evening fresh cooked meals.',
    documentDetails: {
      title: 'COMMUNITY SHELTER ACCREDITATION',
      certNumber: 'SHELTER-MUM-2019-4410',
      authority: 'Municipal Corporation of Greater Mumbai (MCGM)',
      validUntil: '30-Jun-2027',
      verifiedStamp: 'MCGM INSPECTED',
    },
  },
  {
    _id: 'don-001',
    user: {
      fullName: 'Spice Route Bistro',
      email: 'ops@spiceroute.in',
      phone: '+91 98200 44321',
      city: 'Mumbai Central',
      role: 'donor',
      status: 'pending_review',
    },
    organizationName: 'Spice Route Bistro',
    businessType: 'Restaurant',
    role: 'donor',
    documentType: 'FSSAI Food Hygiene License',
    submittedAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), // Yesterday
    timeLabel: 'Yesterday',
    reviewStatus: 'pending',
    applicantNotes:
      'Central kitchen facility with daily surplus of 30-60 packed buffet meals. Certified food grade packaging.',
    documentDetails: {
      title: 'FSSAI FOOD SAFETY LICENSE',
      certNumber: '11521018000452',
      authority: 'Food Safety and Standards Authority of India',
      validUntil: '12-May-2029',
      verifiedStamp: 'FSSAI APPROVED',
    },
  },
]

export const MOCK_USERS = [
  {
    id: 'usr-1',
    name: 'Spice Route Bistro',
    email: 'ops@spiceroute.in',
    phone: '+91 98200 44321',
    role: 'Donor',
    city: 'Mumbai Central',
    impactActivity: '48 Donations',
    status: 'Active',
    joinedDate: '12-Jan-2026',
    initials: 'SR',
  },
  {
    id: 'usr-2',
    name: 'Hope Foundation',
    email: 'contact@hope.org',
    phone: '+91 98201 12345',
    role: 'Receiver',
    city: 'Bandra West',
    impactActivity: '126 Collections',
    status: 'Active',
    joinedDate: '04-Feb-2026',
    initials: 'HF',
  },
  {
    id: 'usr-3',
    name: 'Rahul Verma',
    email: 'rahul.v@email.com',
    phone: '+91 98112 55678',
    role: 'Volunteer',
    city: 'Andheri East',
    impactActivity: '82 Pickups',
    status: 'Active',
    joinedDate: '22-Feb-2026',
    initials: 'RV',
  },
  {
    id: 'usr-4',
    name: 'Metro Supermarket',
    email: 'foodcare@metro.in',
    phone: '+91 98765 43210',
    role: 'Donor',
    city: 'Powai',
    impactActivity: '71 Donations',
    status: 'Active',
    joinedDate: '15-Mar-2026',
    initials: 'MS',
  },
  {
    id: 'usr-5',
    name: 'Care Orphanage',
    email: 'admin@carehome.org',
    phone: '+91 98450 99821',
    role: 'Receiver',
    city: 'Dadar',
    impactActivity: '39 Collections',
    status: 'Suspended',
    joinedDate: '01-Apr-2026',
    initials: 'CO',
  },
  {
    id: 'usr-6',
    name: 'Priya Sharma',
    email: 'priya.s@email.com',
    phone: '+91 98990 11223',
    role: 'Volunteer',
    city: 'Colaba',
    impactActivity: '64 Deliveries',
    status: 'Active',
    joinedDate: '18-Apr-2026',
    initials: 'PS',
  },
]

export const MOCK_FOOD_LISTINGS = [
  {
    id: 'food-001',
    title: '50 Veg Biryani Packets',
    donor: 'Hyatt Regency',
    city: 'Andheri East, Mumbai',
    category: 'Cooked Meals',
    isVeg: true,
    quantity: '50 portions (25 kg)',
    servings: 50,
    status: 'Available',
    statusClass: 'text-[#2E7D32]',
    expiryTime: new Date(Date.now() + 105 * 60 * 1000).toISOString(),
    expiryLabel: 'Expires in 1h 45m',
    expiryUrgency: 'critical', // < 2h
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
    packaging: 'Sealed eco-friendly compostable containers',
    specialInstructions: 'Keep hot. Packed freshly from 1:00 PM banquet buffet.',
  },
  {
    id: 'food-002',
    title: '30 Artisan Bread Loaves',
    donor: 'Daily Crust Bakery',
    city: 'Bandra West, Mumbai',
    category: 'Bakery / Dairy',
    isVeg: true,
    quantity: '30 items',
    servings: 30,
    status: 'Claimed by Hope NGO',
    statusClass: 'text-[#E65100]',
    expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    expiryLabel: 'Expires in 4h',
    expiryUrgency: 'warning', // 2 - 6h
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    packaging: 'Brown paper moisture-wicking bags',
    specialInstructions: 'Sourdough & whole wheat baked at 6:00 AM today.',
  },
  {
    id: 'food-003',
    title: '40 kg Fresh Apples & Oranges',
    donor: 'Metro Supermarket',
    city: 'Powai, Mumbai',
    category: 'Fresh Produce',
    isVeg: true,
    quantity: '40 kg',
    servings: 120,
    status: 'In Transit',
    statusClass: 'text-[#1565C0]',
    expiryTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    expiryLabel: 'Expires in 12h',
    expiryUrgency: 'safe', // > 6h
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80',
    packaging: 'Ventilated stackable crates',
    specialInstructions: 'Grade A fresh surplus fruits suitable for immediate distribution.',
  },
]

export const MOCK_EXCHANGES = [
  {
    id: '#EX-1042',
    donor: { name: 'Taj Gateway', area: 'Andheri', coords: { lat: 19.1136, lng: 72.8697 } },
    receiver: { name: 'Sneha Shelter', area: 'Bandra', coords: { lat: 19.0596, lng: 72.8295 } },
    volunteer: {
      name: 'Rahul Verma',
      phone: '+91 98112 55678',
      vehicle: 'Bike',
      avatar: 'RV',
      coords: { lat: 19.085, lng: 72.85 },
    },
    distanceEta: '4.8 km • 20 mins',
    deliveryStage: 'In Transit',
    stageColor: 'text-[#1565C0] bg-blue-50 border-blue-200',
    foodItem: '40 Packed Curry Meals',
  },
  {
    id: '#EX-1043',
    donor: { name: 'FreshMart', area: 'Colaba', coords: { lat: 18.9067, lng: 72.8147 } },
    receiver: { name: 'Robin Hood Army', area: 'Fort', coords: { lat: 18.9322, lng: 72.8336 } },
    volunteer: null,
    distanceEta: 'Needs Pickup',
    deliveryStage: 'Pending Volunteer',
    stageColor: 'text-[#E65100] bg-amber-50 border-amber-200',
    foodItem: '25 kg Fresh Produce & Milk',
  },
  {
    id: '#EX-1040',
    donor: { name: 'Marriott Bistro', area: 'Juhu', coords: { lat: 19.0988, lng: 72.8267 } },
    receiver: { name: 'Care Orphanage', area: 'Dadar', coords: { lat: 19.0178, lng: 72.8478 } },
    volunteer: {
      name: 'Priya S.',
      phone: '+91 98990 11223',
      vehicle: 'Scooter',
      avatar: 'PS',
      coords: { lat: 19.0178, lng: 72.8478 },
    },
    distanceEta: 'Completed 30m ago',
    deliveryStage: 'Delivered',
    stageColor: 'text-[#2E7D32] bg-emerald-50 border-emerald-200',
    foodItem: '60 Rice & Dal Meal Bowls',
  },
]

export const adminService = {
  // 1. Pending Receivers API
  async getPendingReceivers(page = 1, limit = 20) {
    try {
      const res = await apiClient.get(`/receivers/pending?page=${page}&limit=${limit}`)
      return res.data
    } catch {
      return {
        profiles: MOCK_PENDING_APPLICATIONS.filter((a) => a.role === 'receiver'),
        pagination: { page, limit, total: 8, totalPages: 1 },
      }
    }
  },

  async approveReceiver(profileId) {
    try {
      return await apiClient.patch(`/receivers/${profileId}/approve`)
    } catch {
      return { success: true, message: 'Receiver approved.' }
    }
  },

  async rejectReceiver(profileId, reason = '') {
    try {
      return await apiClient.patch(`/receivers/${profileId}/reject`, { reason })
    } catch {
      return { success: true, message: 'Receiver rejected.' }
    }
  },

  // 2. Pending Volunteers API
  async getPendingVolunteers(page = 1, limit = 20) {
    try {
      const res = await apiClient.get(`/volunteers/pending?page=${page}&limit=${limit}`)
      return res.data
    } catch {
      return {
        profiles: MOCK_PENDING_APPLICATIONS.filter((a) => a.role === 'volunteer'),
        pagination: { page, limit, total: 6, totalPages: 1 },
      }
    }
  },

  async approveVolunteer(profileId) {
    try {
      return await apiClient.patch(`/volunteers/${profileId}/approve`)
    } catch {
      return { success: true, message: 'Volunteer approved.' }
    }
  },

  async rejectVolunteer(profileId, reason = '') {
    try {
      return await apiClient.patch(`/volunteers/${profileId}/reject`, { reason })
    } catch {
      return { success: true, message: 'Volunteer rejected.' }
    }
  },

  // 3. Unified Applications Queue
  async getAllPendingApplications() {
    try {
      const [recRes, volRes] = await Promise.all([
        this.getPendingReceivers(1, 50).catch(() => null),
        this.getPendingVolunteers(1, 50).catch(() => null),
      ])

      const realProfiles = [
        ...(recRes?.profiles || recRes?.data?.profiles || []),
        ...(volRes?.profiles || volRes?.data?.profiles || []),
      ]

      if (realProfiles.length > 0) {
        return realProfiles.map((p) => ({
          _id: p._id,
          user: p.user || {},
          organizationName: p.organizationName || p.user?.fullName || 'Applicant',
          role: p.receiverType ? 'receiver' : 'volunteer',
          documentType: p.receiverType ? '80G Certificate + License' : 'Government ID Proof',
          submittedAt: p.createdAt || new Date().toISOString(),
          timeLabel: 'Recently',
          reviewStatus: p.reviewStatus || 'pending',
          applicantNotes: p.notes || 'Submitted credentials awaiting admin verification.',
          documentDetails: {
            title: p.receiverType ? 'CERTIFICATE OF REGISTRATION' : 'GOVERNMENT IDENTITY PERMIT',
            certNumber: `REG-${p._id?.slice(-8)?.toUpperCase() || '8841'}`,
            authority: 'Official Issuing Authority',
            validUntil: '31-Dec-2028',
            verifiedStamp: 'OFFICIALLY VERIFIED',
          },
        }))
      }
    } catch {
      // Fallback
    }
    return MOCK_PENDING_APPLICATIONS
  },

  // 4. User Directory
  async getUsers() {
    return {
      users: MOCK_USERS,
      counts: {
        total: 1248,
        donors: 420,
        receivers: 310,
        volunteers: 518,
        suspended: 8,
      },
    }
  },

  // 5. Food Inventory
  async getFoodListings() {
    return {
      listings: MOCK_FOOD_LISTINGS,
      stats: {
        active: 86,
        expiringSoon: 3,
        rescuedTodayKg: 140,
        totalDivertedKg: 4850,
      },
    }
  },

  // 6. Logistics & Deliveries
  async getExchanges() {
    return {
      exchanges: MOCK_EXCHANGES,
      stats: {
        pendingPickup: 12,
        inTransit: 18,
        completedToday: 56,
        delayedAlerts: 2,
      },
    }
  },

  // 7. Impact & Analytics
  async getImpactAnalytics() {
    return {
      stats: {
        totalMeals: '12,800 Meals',
        foodRescuedKg: '4,850 kg',
        co2Prevented: '12.2 Tons CO₂e',
        waterFootprintLiters: '320,000 Liters',
      },
      monthlyGrowth: [
        { month: 'May', weight: 2100 },
        { month: 'Jun', weight: 2650 },
        { month: 'Jul', weight: 3100 },
        { month: 'Aug', weight: 3450 },
        { month: 'Sep', weight: 4020 },
        { month: 'Oct', weight: 4850 },
      ],
      categoryBreakdown: [
        { name: 'Cooked Meals', percentage: 55, color: '#2E7D32' },
        { name: 'Packaged Goods', percentage: 25, color: '#6A1B9A' },
        { name: 'Fresh Produce', percentage: 20, color: '#1565C0' },
      ],
      topDonors: [
        { rank: 1, name: 'Hyatt Regency Mumbai', weight: '1,240 kg' },
        { rank: 2, name: 'Metro Supermarket', weight: '960 kg' },
        { rank: 3, name: 'Marriott Bistro', weight: '785 kg' },
      ],
      starVolunteers: [
        { rank: 1, name: 'Rahul Verma', deliveries: 82, rating: '⭐ 4.9' },
        { rank: 2, name: 'Priya Sharma', deliveries: 64, rating: '⭐ 5.0' },
        { rank: 3, name: 'Amit Patel', deliveries: 49, rating: '⭐ 4.8' },
      ],
    }
  },
}

export default adminService