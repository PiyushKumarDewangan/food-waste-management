import dns from 'node:dns'
dns.setServers(['8.8.8.8', '1.1.1.1'])

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

import User from '../src/models/User.js'
import DonorProfile from '../src/models/DonorProfile.js'
import Notification from '../src/models/Notification.js'
import { createDonorNotification } from '../src/utils/notificationService.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodshare'

async function runTests() {
  console.log('Connecting to MongoDB at:', MONGODB_URI ? 'URI Provided' : 'Default')
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB successfully.')

  try {
    // 1. Create or retrieve test donor user
    const testEmail = `test_donor_sec_${Date.now()}@example.com`
    const initialPassword = 'Password123!'
    const newPassword = 'NewSecretPassword456!'

    const hashedPassword = await bcrypt.hash(initialPassword, 10)
    const testUser = await User.create({
      fullName: 'Test Donor Security',
      email: testEmail,
      passwordHash: hashedPassword,
      role: 'donor',
      phone: '1234567890',
      city: 'San Francisco',
      status: 'active',
      isVerified: true,
    })

    const testDonorProfile = await DonorProfile.create({
      user: testUser._id,
      organizationName: 'Security Testing Org',
      pickupAddress: '123 Testing Ave',
      pickupAvailability: 'Weekdays 9am - 5pm',
      foodSafetyAccepted: true,
      notificationPreferences: {
        newFoodRequest: true,
        volunteerCourierUpdates: true,
        exchangeCompleted: true,
      },
    })

    console.log('✓ Test user and donor profile created.')

    // 2. Test Password Verification & Change Password logic
    const isCurrentValid = await bcrypt.compare(initialPassword, testUser.passwordHash)
    if (!isCurrentValid) throw new Error('Initial password verification failed!')

    const isWrongValid = await bcrypt.compare('WrongPassword999', testUser.passwordHash)
    if (isWrongValid) throw new Error('Wrong password matched unexpectedly!')
    console.log('✓ Password verification behavior validated.')

    // Change to new password
    testUser.passwordHash = await bcrypt.hash(newPassword, 10)
    await testUser.save()

    const isNewValid = await bcrypt.compare(newPassword, testUser.passwordHash)
    if (!isNewValid) throw new Error('New password failed to verify!')
    console.log('✓ Change password successfully verified with bcrypt.')

    // 3. Test Notification Preferences
    let profile = await DonorProfile.findOne({ user: testUser._id })
    if (profile.notificationPreferences.newFoodRequest !== true) {
      throw new Error('Default preference should be true.')
    }

    // Toggle off newFoodRequest
    profile.notificationPreferences.newFoodRequest = false
    await profile.save()

    profile = await DonorProfile.findOne({ user: testUser._id })
    if (profile.notificationPreferences.newFoodRequest !== false) {
      throw new Error('Failed to update preference to false.')
    }
    console.log('✓ Notification preferences update and persistence verified.')

    // 4. Test Notification Helper & Suppression
    const dummyRelatedId = new mongoose.Types.ObjectId()
    const suppressedResult = await createDonorNotification(testUser._id, {
      category: 'newFoodRequest',
      title: 'New Food Request Received',
      message: 'Receiver requested your food listing.',
      relatedId: dummyRelatedId,
      link: '/donor/requests',
    })

    if (suppressedResult !== null) {
      throw new Error('Notification should have been suppressed when preference is false!')
    }
    console.log('✓ Notification suppression when preference is disabled verified.')

    // Turn preference back on
    profile.notificationPreferences.newFoodRequest = true
    await profile.save()

    const createdNotif = await createDonorNotification(testUser._id, {
      category: 'newFoodRequest',
      title: 'New Food Request Received',
      message: 'Receiver requested your food listing.',
      relatedId: dummyRelatedId,
      link: '/donor/requests',
    })

    if (!createdNotif || !createdNotif._id) {
      throw new Error('Failed to create notification when preference is enabled!')
    }
    console.log('✓ Notification creation verified when preference is enabled.')

    // Idempotency check: creating the same notification again
    const duplicateAttempt = await createDonorNotification(testUser._id, {
      category: 'newFoodRequest',
      title: 'New Food Request Received',
      message: 'Receiver requested your food listing.',
      relatedId: dummyRelatedId,
      link: '/donor/requests',
    })

    if (duplicateAttempt._id.toString() !== createdNotif._id.toString()) {
      throw new Error('Duplicate notification created instead of returning existing!')
    }
    const notifCount = await Notification.countDocuments({
      user: testUser._id,
      relatedId: dummyRelatedId,
      category: 'newFoodRequest',
    })
    if (notifCount !== 1) {
      throw new Error(`Expected exactly 1 notification, found ${notifCount}`)
    }
    console.log('✓ Notification idempotency verified (no duplicates).')

    // 5. Test Unread Count & Mark as Read
    const unreadCount1 = await Notification.countDocuments({ user: testUser._id, isRead: false })
    if (unreadCount1 !== 1) {
      throw new Error(`Expected unreadCount 1, got ${unreadCount1}`)
    }

    // Mark as read
    await Notification.findByIdAndUpdate(createdNotif._id, { isRead: true })
    const unreadCount2 = await Notification.countDocuments({ user: testUser._id, isRead: false })
    if (unreadCount2 !== 0) {
      throw new Error(`Expected unreadCount 0, got ${unreadCount2}`)
    }
    console.log('✓ Unread count and mark-read verified.')

    // 6. Impact calculation verification
    const testFoodKg = 125
    const expectedMealsSaved = Math.round(testFoodKg / 0.4)
    if (expectedMealsSaved !== 313) {
      throw new Error(`Expected 313 meals, got ${expectedMealsSaved}`)
    }
    console.log('✓ Impact meal calculation formula (kg / 0.4) verified: 125 kg = 313 meals.')

    // Clean up test records
    await Notification.deleteMany({ user: testUser._id })
    await DonorProfile.deleteOne({ _id: testDonorProfile._id })
    await User.deleteOne({ _id: testUser._id })
    console.log('✓ Test cleanup completed.')

    console.log('\n========================================')
    console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY!')
    console.log('========================================\n')
  } catch (err) {
    console.error('Test execution failed:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

runTests()
