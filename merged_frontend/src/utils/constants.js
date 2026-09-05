// Central place for enums / option lists used across the auth & registration flow.
// Keep these in sync with whatever your backend expects.

export const ROLES = {
  DONOR: 'donor',
  RECEIVER: 'receiver',
  VOLUNTEER: 'volunteer',
}

export const ROLE_OPTIONS = [
  {
    value: ROLES.DONOR,
    title: 'Donor',
    description: 'I have safe surplus food to donate.',
  },
  {
    value: ROLES.RECEIVER,
    title: 'Receiver',
    description: 'My organization receives and distributes food.',
  },
  {
    value: ROLES.VOLUNTEER,
    title: 'Volunteer',
    description: 'I can help collect and deliver food.',
  },
]

export const REGISTRATION_STEPS = [
  { key: 'account', label: 'Account Details', path: '/register/account' },
  { key: 'role', label: 'Role Details', path: '/register/role' },
  { key: 'details', label: 'Verification', path: '/register/details' },
  { key: 'complete', label: 'Done', path: '/register/complete' },
]

export const COUNTRY_CODES = [
  { value: '+254', label: '+254 (KE)' },
  { value: '+256', label: '+256 (UG)' },
  { value: '+255', label: '+255 (TZ)' },
  { value: '+234', label: '+234 (NG)' },
  { value: '+27', label: '+27 (ZA)' },
  { value: '+91', label: '+91 (IN)' },
  { value: '+1', label: '+1 (US)' },
  { value: '+44', label: '+44 (UK)' },
]

export const DONOR_ACCOUNT_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Business / Org' },
]

export const DAYS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
]

export const TRANSPORT_TYPES = [
  { value: 'walking', label: 'Walking' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'car', label: 'Car' },
  { value: 'other', label: 'Other' },
]

export const TRANSPORT_TYPES_REQUIRING_VEHICLE_NUMBER = ['motorcycle', 'car']

export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
export const MAX_DOCUMENT_SIZE_MB = 5
export const MAX_DOCUMENT_SIZE_BYTES = MAX_DOCUMENT_SIZE_MB * 1024 * 1024

export const PLATFORM_STATS = [
  { value: '2,400+', label: 'Donors' },
  { value: '180K', label: 'Meals Shared' },
  { value: '340', label: 'Communities' },
]

export const TESTIMONIAL = {
  quote: 'FoodBridge helped us redirect 400kg of surplus produce every week to families in our area.',
  name: 'Maria A.',
  role: 'Restaurant Donor, Nairobi',
  initials: 'MA',
}
