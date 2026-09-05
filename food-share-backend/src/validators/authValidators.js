import { body } from 'express-validator'

// Shared account-detail rules (Step 1 of registration) reused by all three
// role-specific register endpoints.
const accountDetailRules = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('phone')
    .trim()
    .matches(/^[0-9+\s-]{6,15}$/)
    .withMessage('Enter a valid phone number.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
  body('city').trim().notEmpty().withMessage('City or service area is required.'),
]

export const registerDonorValidator = [
  ...accountDetailRules,
  body('donorType').isIn(['individual', 'business']).withMessage('Invalid account type.'),
  body('organizationName')
    .if(body('donorType').equals('business'))
    .trim()
    .notEmpty()
    .withMessage('Organization or business name is required for a business account.'),
  body('pickupAddress').trim().notEmpty().withMessage('Pickup address is required.'),
  body('pickupAvailability').trim().notEmpty().withMessage('Preferred pickup time is required.'),
  body('foodSafetyAccepted')
    .custom((value) => value === true || value === 'true')
    .withMessage('You must confirm the food safety statement.'),
]

export const registerReceiverValidator = [
  ...accountDetailRules,
  body('organizationName').trim().notEmpty().withMessage('Organization name is required.'),
  body('contactPerson').trim().notEmpty().withMessage('Contact person name is required.'),
  body('organizationAddress').trim().notEmpty().withMessage('Organization address is required.'),
  body('storageCapacity').trim().notEmpty().withMessage('Storage capacity is required.'),
  body('operatingHours').trim().notEmpty().withMessage('Operating hours are required.'),
]

export const registerVolunteerValidator = [
  ...accountDetailRules,
  body('availableDays').custom((value) => {
    const days = Array.isArray(value) ? value : JSON.parse(value || '[]')
    if (!days.length) throw new Error('Select at least one available day.')
    return true
  }),
  body('preferredTime').trim().notEmpty().withMessage('Preferred time slots are required.'),
  body('serviceRadius').trim().notEmpty().withMessage('Service area / travel radius is required.'),
  body('transportType')
    .isIn(['walking', 'bicycle', 'motorcycle', 'car', 'other'])
    .withMessage('Select a valid transport type.'),
  body('vehicleNumber')
    .if(body('transportType').isIn(['motorcycle', 'car']))
    .trim()
    .notEmpty()
    .withMessage('Vehicle number is required for motorcycle or car.'),
  body('guidelinesAccepted')
    .custom((value) => value === true || value === 'true')
    .withMessage('You must agree to the food handling and delivery guidelines.'),
]

export const loginValidator = [
  body('identifier').trim().notEmpty().withMessage('Email or phone number is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
]

export const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
]

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
]
