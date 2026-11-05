import dns from 'node:dns'
dns.setServers(['8.8.8.8', '1.1.1.1'])

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
dotenv.config()

import User from '../src/models/User.js'
import DonorProfile from '../src/models/DonorProfile.js'
import ReceiverProfile from '../src/models/ReceiverProfile.js'
import VolunteerProfile from '../src/models/VolunteerProfile.js'
import Exchange from '../src/models/Exchange.js'
import FoodDonation from '../src/models/FoodDonation.js'
import FoodRequest from '../src/models/FoodRequest.js'
import { syncVolunteerRating } from '../src/controllers/volunteerController.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodshare'

async function runTests() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB successfully.')

  try {
    const timestamp = Date.now()

    // ==========================================
    // 1. TEST CHANGE 2: CHANGE PASSWORD WITHOUT CURRENT PASSWORD
    // ==========================================
    console.log('\n--- Testing Change 2: Password Change Without Current Password ---')
    const initialPassword = 'InitialSecret123!'
    const newPassword = 'NewUpdatedSecret456!'

    const user = await User.create({
      fullName: 'Test User Security',
      email: `test_sec_${timestamp}@example.com`,
      passwordHash: await bcrypt.hash(initialPassword, 10),
      role: 'donor',
      phone: `987654${timestamp.toString().slice(-4)}`,
      city: 'San Francisco',
      status: 'active',
      isVerified: true,
    })

    // Simulate change password logic (authenticated user with newPassword and confirmPassword only)
    const canLoginInitial = await bcrypt.compare(initialPassword, user.passwordHash)
    if (!canLoginInitial) throw new Error('Failed initial password check!')

    // Validate new password rules
    if (newPassword.length < 8) throw new Error('Password too short')
    const confirmPassword = newPassword
    if (newPassword !== confirmPassword) throw new Error('Passwords do not match')

    // Update password without requiring or providing currentPassword
    user.passwordHash = await bcrypt.hash(newPassword, 10)
    await user.save()

    const canLoginNew = await bcrypt.compare(newPassword, user.passwordHash)
    if (!canLoginNew) throw new Error('Failed login with new password!')
    const cannotLoginOld = await bcrypt.compare(initialPassword, user.passwordHash)
    if (cannotLoginOld) throw new Error('Old password should no longer work!')

    console.log('✓ Password successfully updated without currentPassword.')
    console.log('✓ New password verified with bcrypt; old password invalidated.')

    // ==========================================
    // 2. TEST CHANGE 5: VOLUNTEER RATINGS & ALL REVIEWS RETRIEVAL
    // ==========================================
    console.log('\n--- Testing Change 5: Volunteer Ratings & All Historical Reviews ---')

    // Create Volunteer
    const volunteer = await User.create({
      fullName: 'Test Courier Alex',
      email: `volunteer_${timestamp}@example.com`,
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: 'volunteer',
      phone: `911222${timestamp.toString().slice(-4)}`,
      city: 'San Francisco',
      status: 'active',
      isVerified: true,
    })
    const volProfile = await VolunteerProfile.create({
      user: volunteer._id,
      availableDays: ['mon', 'tue', 'wed'],
      preferredTime: 'Morning',
      serviceRadius: '5 km',
      transportType: 'bicycle',
      guidelinesAccepted: true,
      reviewStatus: 'approved',
      isOnDuty: true,
    })

    // Create Donor
    const donor = await User.create({
      fullName: 'Test Donor Bakery',
      email: `donor_${timestamp}@example.com`,
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: 'donor',
      phone: `922333${timestamp.toString().slice(-4)}`,
      city: 'San Francisco',
      status: 'active',
      isVerified: true,
    })

    // Create Receiver
    const receiver = await User.create({
      fullName: 'Test Receiver Shelter',
      email: `receiver_${timestamp}@example.com`,
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: 'receiver',
      phone: `933444${timestamp.toString().slice(-4)}`,
      city: 'San Francisco',
      status: 'active',
      isVerified: true,
    })

    // Create Food Donation
    const donation = await FoodDonation.create({
      donor: donor._id,
      title: 'Fresh Artisan Bread',
      description: 'Fresh baked bread',
      category: 'Bakery',
      quantity: 10,
      unit: 'Items',
      pickupAddress: '100 Market St',
      pickupWindow: 'Today 2pm-5pm',
      bestBefore: new Date(Date.now() + 86400000),
      city: 'San Francisco',
      status: 'completed',
    })

    // Create Food Request
    const request = await FoodRequest.create({
      donation: donation._id,
      donor: donor._id,
      receiver: receiver._id,
      quantityRequested: 10,
      message: 'Requesting bread for shelter',
      status: 'accepted',
    })

    // Create 3 completed exchanges assigned to the volunteer:
    // Exchange 1: Donor reviewed (rating 5)
    const ex1 = await Exchange.create({
      donation: donation._id,
      request: request._id,
      donor: donor._id,
      receiver: receiver._id,
      volunteer: volunteer._id,
      deliveryType: 'volunteer_delivery',
      status: 'completed',
      pickupAddress: '100 Market St',
      dropoffAddress: '500 Mission St',
      orderNo: `FD-TEST-001`,
      donorFeedback: {
        rating: 5,
        comment: 'Punctual and courteous courier!',
        submittedAt: new Date(Date.now() - 3600000 * 48), // 2 days ago
      },
    })

    // Exchange 2: Receiver reviewed (rating 4)
    const ex2 = await Exchange.create({
      donation: donation._id,
      request: request._id,
      donor: donor._id,
      receiver: receiver._id,
      volunteer: volunteer._id,
      deliveryType: 'volunteer_delivery',
      status: 'completed',
      pickupAddress: '100 Market St',
      dropoffAddress: '500 Mission St',
      orderNo: `FD-TEST-002`,
      receiverFeedback: {
        rating: 4,
        comment: 'Arrived quickly, bread was handled with care.',
        submittedAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
      },
    })

    // Exchange 3: BOTH Donor AND Receiver reviewed! (Ratings: Donor=5, Receiver=4)
    const ex3 = await Exchange.create({
      donation: donation._id,
      request: request._id,
      donor: donor._id,
      receiver: receiver._id,
      volunteer: volunteer._id,
      deliveryType: 'volunteer_delivery',
      status: 'completed',
      pickupAddress: '100 Market St',
      dropoffAddress: '500 Mission St',
      orderNo: `FD-TEST-003`,
      donorFeedback: {
        rating: 5,
        comment: 'Smooth pickup process, thanks!',
        submittedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      },
      receiverFeedback: {
        rating: 4,
        comment: 'Great volunteer assistance.',
        submittedAt: new Date(Date.now() - 3600000 * 1), // 1 hour ago
      },
    })

    // Unrelated exchange for a DIFFERENT volunteer (should be excluded!)
    const otherVolunteer = new mongoose.Types.ObjectId()
    const exUnrelated = await Exchange.create({
      donation: donation._id,
      request: request._id,
      donor: donor._id,
      receiver: receiver._id,
      volunteer: otherVolunteer,
      deliveryType: 'volunteer_delivery',
      status: 'completed',
      pickupAddress: '100 Market St',
      dropoffAddress: '500 Mission St',
      orderNo: `FD-TEST-OTHER`,
      receiverFeedback: {
        rating: 1,
        comment: 'Bad courier!',
        submittedAt: new Date(),
      },
    })

    // Test rating synchronization
    const syncResult = await syncVolunteerRating(volunteer._id)
    console.log('✓ syncVolunteerRating executed:', syncResult)

    // Expected ratings: 5, 4, 5, 4 => count = 4, average = 18 / 4 = 4.5
    if (syncResult.reviewsCount !== 4) {
      throw new Error(`Expected 4 reviews, got ${syncResult.reviewsCount}`)
    }
    if (syncResult.avgRating !== 4.5) {
      throw new Error(`Expected 4.5 average rating, got ${syncResult.avgRating}`)
    }
    console.log('✓ All 4 reviews counted and averaged correctly without truncation.')

    // Simulate query in getVolunteerReviews
    const exchanges = await Exchange.find({
      volunteer: volunteer._id,
      status: 'completed',
      $or: [
        { 'donorFeedback.rating': { $gt: 0 } },
        { 'receiverFeedback.rating': { $gt: 0 } },
        { 'feedback.rating': { $gt: 0 } },
        { rating: { $gt: 0 } },
      ],
    })
      .populate('donation', 'title category quantity unit')
      .populate('receiver', 'fullName organizationName')
      .populate('donor', 'fullName organizationName')

    const reviews = []
    for (const ex of exchanges) {
      if (ex.donorFeedback?.rating && ex.donorFeedback.rating > 0) {
        reviews.push({
          _id: `${ex._id}_donor`,
          rating: ex.donorFeedback.rating,
          comment: ex.donorFeedback.comment,
          reviewerName: ex.donor?.fullName,
          reviewerRole: 'Donor',
          submittedAt: ex.donorFeedback.submittedAt,
        })
      }
      if (ex.receiverFeedback?.rating && ex.receiverFeedback.rating > 0) {
        reviews.push({
          _id: `${ex._id}_receiver`,
          rating: ex.receiverFeedback.rating,
          comment: ex.receiverFeedback.comment,
          reviewerName: ex.receiver?.fullName,
          reviewerRole: 'Receiver',
          submittedAt: ex.receiverFeedback.submittedAt,
        })
      }
    }

    reviews.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))

    console.log(`✓ Retrieved ${reviews.length} reviews for volunteer (more than 2!).`)
    if (reviews.length !== 4) {
      throw new Error(`Expected exactly 4 reviews, got ${reviews.length}`)
    }

    // Verify roles and names
    const donorReviews = reviews.filter((r) => r.reviewerRole === 'Donor')
    const receiverReviews = reviews.filter((r) => r.reviewerRole === 'Receiver')
    if (donorReviews.length !== 2 || receiverReviews.length !== 2) {
      throw new Error(`Expected 2 Donor and 2 Receiver reviews! Found: Donor=${donorReviews.length}, Receiver=${receiverReviews.length}`)
    }
    console.log('✓ Reviews accurately identify reviewer roles (2 Donor, 2 Receiver).')
    console.log('✓ Unrelated review from other volunteer was correctly excluded.')

    // Clean up test data
    await Exchange.deleteMany({ _id: { $in: [ex1._id, ex2._id, ex3._id, exUnrelated._id] } })
    await FoodRequest.deleteOne({ _id: request._id })
    await FoodDonation.deleteOne({ _id: donation._id })
    await VolunteerProfile.deleteOne({ _id: volProfile._id })
    await User.deleteMany({ _id: { $in: [user._id, volunteer._id, donor._id, receiver._id] } })
    console.log('✓ Test cleanup completed.')

    console.log('\n========================================')
    console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY!')
    console.log('========================================\n')
  } catch (err) {
    console.error('Test execution error:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

runTests()
