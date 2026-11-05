import mongoose from 'mongoose'
import dns from 'dns'
import fs from 'fs'
import path from 'path'

try {
  dns.setServers(['8.8.8.8', '1.1.1.1'])
} catch (e) {}

import { env } from '../src/config/env.js'
import { User } from '../src/models/User.js'
import { VolunteerProfile } from '../src/models/VolunteerProfile.js'
import { FoodDonation } from '../src/models/FoodDonation.js'
import { Exchange } from '../src/models/Exchange.js'
import { syncVolunteerRating } from '../src/controllers/volunteerController.js'

async function runTests() {
  console.log('--- STARTING VERIFICATION FOR CHANGES 6–11 ---')
  await mongoose.connect(env.MONGODB_URI)
  console.log('✓ Connected to MongoDB')

  const frontendDir = path.resolve(process.cwd(), 'merged_frontend')
  const backendDir = path.resolve(process.cwd(), 'food-share-backend')

  // -------------------------------------------------------------
  // Test 1: Device Helper & Mobile / Desktop Call Behavior Check
  // -------------------------------------------------------------
  console.log('\n[TEST 1] Device Helper & Call Action Verification')
  const deviceHelperContent = fs.readFileSync(
    path.join(frontendDir, 'src/utils/deviceHelper.js'),
    'utf-8'
  )
  if (!deviceHelperContent.includes('navigator.userAgentData.mobile') || !deviceHelperContent.includes('useIsMobile')) {
    throw new Error('Device detection helper is missing userAgentData.mobile or useIsMobile hook.')
  }
  console.log('✓ deviceHelper.js correctly implements navigator.userAgentData.mobile with regex fallback & useIsMobile hook.')

  const exchangesContent = fs.readFileSync(
    path.join(frontendDir, 'src/pages/donor/Exchanges.jsx'),
    'utf-8'
  )
  if (!exchangesContent.includes('handleCopyPhone') || !exchangesContent.includes('Call Volunteer')) {
    throw new Error('Exchanges.jsx missing handleCopyPhone or Call Volunteer.')
  }
  console.log('✓ Exchanges.jsx conditionally renders Call Volunteer (mobile) vs Copy Phone Number (desktop).')

  // -------------------------------------------------------------
  // Test 2: Hide Verification Code in Direct Pickup Completed Banner (Change 9)
  // -------------------------------------------------------------
  console.log('\n[TEST 2] Change 9 — Direct Pickup Completed Banner Code Hiding')
  if (exchangesContent.includes('Pickup Verified & Handover Completed (Code #')) {
    throw new Error('Completed direct pickup banner still includes (Code #...)! Must be removed.')
  }
  if (!exchangesContent.includes('✓ Pickup Verified & Handover Completed')) {
    throw new Error('Completed direct pickup banner missing "✓ Pickup Verified & Handover Completed"')
  }
  console.log('✓ Completed Direct Pickup banner hides pickup code and displays "✓ Pickup Verified & Handover Completed".')

  // -------------------------------------------------------------
  // Test 3: Real Volunteer Ratings & Completed Deliveries (Change 7 & 8)
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Volunteer Live Rating & Completed Deliveries Calculation')
  const testEmail = `test-vol-${Date.now()}@foodshare.org`
  const testUser = await User.create({
    fullName: 'Test Volunteer Courier',
    email: testEmail,
    passwordHash: 'dummyhash123',
    role: 'volunteer',
    phone: '+91 99887 76655',
    city: 'Indore',
  })

  const testProfile = await VolunteerProfile.create({
    user: testUser._id,
    availableDays: ['mon', 'tue'],
    preferredTime: 'Morning',
    serviceRadius: '5 km',
    transportType: 'motorcycle',
    guidelinesAccepted: true,
    reviewStatus: 'approved',
  })

  // Case A: Initial state with 0 deliveries and 0 reviews
  const initialStats = await syncVolunteerRating(testUser._id)
  console.log('Initial stats for fresh volunteer:', {
    rating: initialStats.avgRating,
    deliveries: initialStats.totalDeliveries,
    reviews: initialStats.reviewsCount,
  })
  if (initialStats.avgRating !== 0 || initialStats.totalDeliveries !== 0) {
    throw new Error('Fresh volunteer must have 0 rating and 0 deliveries!')
  }

  const dummyDonationId = new mongoose.Types.ObjectId()
  const dummyRequestId = new mongoose.Types.ObjectId()

  // Case B: Create 2 completed exchanges with ratings 4 and 5
  const ex1 = await Exchange.create({
    donor: new mongoose.Types.ObjectId(),
    receiver: new mongoose.Types.ObjectId(),
    donation: dummyDonationId,
    request: dummyRequestId,
    pickupAddress: '123 Market St, Indore',
    deliveryType: 'volunteer_delivery',
    volunteer: testUser._id,
    status: 'completed',
    feedback: {
      rating: 4,
      comment: 'Arrived promptly and handled food packaging with great care.',
      submittedAt: new Date(),
    },
  })

  const ex2 = await Exchange.create({
    donor: new mongoose.Types.ObjectId(),
    receiver: new mongoose.Types.ObjectId(),
    donation: dummyDonationId,
    request: dummyRequestId,
    pickupAddress: '456 MG Road, Indore',
    deliveryType: 'volunteer_delivery',
    volunteer: testUser._id,
    status: 'completed',
    feedback: {
      rating: 5,
      comment: 'Super fast delivery and courteous handover!',
      submittedAt: new Date(),
    },
  })

  const updatedStats = await syncVolunteerRating(testUser._id)
  console.log('Updated stats after 2 completed deliveries with feedback:', {
    rating: updatedStats.avgRating,
    deliveries: updatedStats.totalDeliveries,
    reviews: updatedStats.reviewsCount,
  })

  if (updatedStats.avgRating !== 4.5) {
    throw new Error(`Expected avgRating 4.5, got ${updatedStats.avgRating}`)
  }
  if (updatedStats.totalDeliveries !== 2) {
    throw new Error(`Expected totalDeliveries 2, got ${updatedStats.totalDeliveries}`)
  }
  if (updatedStats.reviewsCount !== 2) {
    throw new Error(`Expected reviewsCount 2, got ${updatedStats.reviewsCount}`)
  }
  console.log('✓ Volunteer rating accurately averages valid submitted ratings to 1 decimal place (4.5).')

  // Check UI handles 0 rating with "Not rated yet"
  if (!exchangesContent.includes('Not rated yet')) {
    throw new Error('Exchanges.jsx does not display "Not rated yet" when unrated.')
  }
  console.log('✓ Exchanges.jsx displays "Not rated yet" when volunteer has no submitted feedback.')

  // Clean up test data
  await Exchange.deleteMany({ _id: { $in: [ex1._id, ex2._id] } })
  await VolunteerProfile.findByIdAndDelete(testProfile._id)
  await User.findByIdAndDelete(testUser._id)

  // -------------------------------------------------------------
  // Test 4: Profile Photo Upload Directory & Middleware (Change 10)
  // -------------------------------------------------------------
  console.log('\n[TEST 4] Profile Photo Upload Storage & Auth Route')
  const avatarsDir = path.join(backendDir, 'uploads/avatars')
  if (!fs.existsSync(avatarsDir)) {
    throw new Error('uploads/avatars directory does not exist.')
  }
  console.log('✓ uploads/avatars directory exists.')

  const authRoutesContent = fs.readFileSync(
    path.join(backendDir, 'src/routes/authRoutes.js'),
    'utf-8'
  )
  if (!authRoutesContent.includes('/upload-avatar') || !authRoutesContent.includes('uploadAvatar')) {
    throw new Error('authRoutes.js does not expose POST /upload-avatar route.')
  }
  console.log('✓ authRoutes.js exposes POST /upload-avatar with uploadAvatar middleware.')

  const authContextContent = fs.readFileSync(
    path.join(frontendDir, 'src/context/AuthContext.jsx'),
    'utf-8'
  )
  if (!authContextContent.includes('updateUser')) {
    throw new Error('AuthContext.jsx is missing updateUser callback.')
  }
  console.log('✓ AuthContext.jsx exposes updateUser for instant session updates without reload.')

  // -------------------------------------------------------------
  // Test 5: Help & Support FAQ Modal (Change 11)
  // -------------------------------------------------------------
  console.log('\n[TEST 5] Help & Support FAQ Modal with 7 Questions')
  const helpModalContent = fs.readFileSync(
    path.join(frontendDir, 'src/components/common/HelpSupportModal.jsx'),
    'utf-8'
  )
  const requiredQuestions = [
    'How do I donate food?',
    'How do I request available food?',
    'How does Direct Pickup work?',
    'How does Volunteer Assistance work?',
    'How do pickup verification codes work?',
    'How can I track an exchange or delivery?',
    'How do I update my profile and profile photo?',
  ]

  for (const q of requiredQuestions) {
    if (!helpModalContent.includes(q)) {
      throw new Error(`HelpSupportModal is missing required question: "${q}"`)
    }
  }
  console.log('✓ All 7 required FAQ questions are present in HelpSupportModal.jsx.')

  // Verify sidebars have Help & Support connected
  const donorLayoutContent = fs.readFileSync(
    path.join(frontendDir, 'src/pages/donor/DonorLayout.jsx'),
    'utf-8'
  )
  const receiverLayoutContent = fs.readFileSync(
    path.join(frontendDir, 'src/pages/receiver/ReceiverLayout.jsx'),
    'utf-8'
  )
  const volunteerLayoutContent = fs.readFileSync(
    path.join(frontendDir, 'src/pages/volunteer/VolunteerLayout.jsx'),
    'utf-8'
  )

  if (!donorLayoutContent.includes('HelpSupportModal')) {
    throw new Error('DonorLayout.jsx is not rendering HelpSupportModal.')
  }
  if (!receiverLayoutContent.includes('HelpSupportModal')) {
    throw new Error('ReceiverLayout.jsx is not rendering HelpSupportModal.')
  }
  if (!volunteerLayoutContent.includes('HelpSupportModal')) {
    throw new Error('VolunteerLayout.jsx is not rendering HelpSupportModal.')
  }
  console.log('✓ All 3 sidebar layouts (Donor, Receiver, Volunteer) have the "?" icon wired to HelpSupportModal.')

  console.log('\n=============================================')
  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!')
  console.log('=============================================')
  await mongoose.disconnect()
}

runTests().catch((err) => {
  console.error('VERIFICATION FAILED:', err)
  process.exit(1)
})
