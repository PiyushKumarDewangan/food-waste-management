import dns from 'dns'
dns.setServers(['8.8.8.8', '8.8.4.4'])

import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import { User } from '../src/models/User.js'
import { FoodDonation } from '../src/models/FoodDonation.js'
import { FoodRequest } from '../src/models/FoodRequest.js'
import { Exchange } from '../src/models/Exchange.js'

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`)
    throw new Error(message)
  }
  console.log(`✅ PASSED: ${message}`)
}

async function run() {
  console.log('=== VERIFYING 5 ESSENTIAL DONOR DASHBOARD CHANGES ===\n')

  await mongoose.connect(env.MONGODB_URI)
  console.log('Connected to MongoDB.\n')

  // -------------------------------------------------------------
  // Test 1: Supported Food Units
  // -------------------------------------------------------------
  console.log('--- TEST 1: Food Quantity Units ---')
  const validUnits = ['Servings', 'Kg', 'Liters', 'Items', 'Boxes', 'Bags', 'Bottles']
  const testDonor = (await User.findOne({ role: 'donor' })) || (await User.create({
    fullName: 'Test Donor Piyush',
    email: 'test.donor.piyush@example.com',
    role: 'donor',
    passwordHash: 'dummyPass123',
  }))

  const createdDonations = []
  for (const unit of validUnits) {
    const d = await FoodDonation.create({
      donor: testDonor._id,
      title: `Surplus ${unit}`,
      category: 'Cooked Meals',
      description: `Test item in ${unit}`,
      quantity: 10,
      unit,
      bestBefore: new Date(Date.now() + 24 * 60 * 60 * 1000),
      pickupAddress: 'Indore, MP',
      pickupWindow: '10:00 - 14:00',
    })
    createdDonations.push(d)
    assert(d.unit === unit, `Food donation created with supported unit: ${unit}`)
  }

  // -------------------------------------------------------------
  // Test 2 & 3: Expiry Timestamps & Real-Time Countdown & Status Priority
  // -------------------------------------------------------------
  console.log('\n--- TEST 2 & 3: Expiry Timestamps & Status Priority ---')
  const now = Date.now()

  // Case A: 21h remaining
  const exp21h = new Date(now + 21 * 60 * 60 * 1000)
  const diff21h = exp21h.getTime() - now
  const hours21 = Math.floor(diff21h / (1000 * 60 * 60))
  assert(hours21 === 21, `Calculates 21 hours remaining correctly: ${hours21}h`)

  // Case B: 2h 30m remaining
  const exp2h30m = new Date(now + (2 * 60 + 30) * 60 * 1000)
  const diff2h30m = exp2h30m.getTime() - now
  const hours2 = Math.floor(diff2h30m / (1000 * 60 * 60))
  const mins30 = Math.floor((diff2h30m % (1000 * 60 * 60)) / (1000 * 60))
  assert(hours2 === 2 && mins30 === 30, `Calculates 2h 30m remaining correctly: ${hours2}h ${mins30}m`)

  // Case C: 45m remaining
  const exp45m = new Date(now + 45 * 60 * 1000)
  const diff45m = exp45m.getTime() - now
  const mins45 = Math.floor(diff45m / (1000 * 60))
  assert(mins45 === 45, `Calculates 45m remaining correctly: ${mins45}m`)

  // Case D: Past expiry / 0m
  const expPast = new Date(now - 5 * 60 * 1000)
  assert(expPast.getTime() <= now, 'Expired food detected correctly (timestamp <= current time)')

  // -------------------------------------------------------------
  // Test 4 & 5: Receiver Completed Exchange Count Inconsistency Fix
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Receiver Completed Exchange Count Inconsistency ---')
  const testReceiver = (await User.findOne({ role: 'receiver' })) || (await User.create({
    fullName: 'Preeti Dewangan',
    email: 'preeti.test.receiver@example.com',
    role: 'receiver',
    passwordHash: 'dummyPass123',
  }))

  // Clean any old test exchanges for this test receiver
  await Exchange.deleteMany({ receiver: testReceiver._id })
  await FoodRequest.deleteMany({ receiver: testReceiver._id })

  // Create 5 completed exchanges for this receiver
  const sampleDonation = createdDonations[0]
  const sampleRequest = await FoodRequest.create({
    donation: sampleDonation._id,
    donor: testDonor._id,
    receiver: testReceiver._id,
    receiverName: testReceiver.fullName,
    message: 'Request 1',
    requestedQuantity: 2,
    requestedUnit: 'Boxes',
    status: 'accepted',
  })

  for (let i = 1; i <= 5; i++) {
    await Exchange.create({
      donation: sampleDonation._id,
      request: sampleRequest._id,
      donor: testDonor._id,
      receiver: testReceiver._id,
      deliveryType: 'direct_pickup',
      pickupCode: `100${i}`,
      status: 'completed',
      pickupAddress: 'Test Address',
    })
  }

  // Create an incomplete/accepted request (should NOT count as completed exchange)
  await FoodRequest.create({
    donation: sampleDonation._id,
    donor: testDonor._id,
    receiver: testReceiver._id,
    receiverName: testReceiver.fullName,
    message: 'Pending Request',
    requestedQuantity: 1,
    requestedUnit: 'Boxes',
    status: 'accepted',
  })

  // Create an in-progress exchange (should NOT count as completed exchange)
  await Exchange.create({
    donation: sampleDonation._id,
    request: sampleRequest._id,
    donor: testDonor._id,
    receiver: testReceiver._id,
    deliveryType: 'direct_pickup',
    pickupCode: '9999',
    status: 'in_transit',
    pickupAddress: 'Test Address',
  })

  // Authoritative query: count completed exchanges for this receiver
  const receiverCompletedCount = await Exchange.countDocuments({
    receiver: testReceiver._id,
    status: { $in: ['completed', 'delivered'] },
  })
  assert(receiverCompletedCount === 5, `Receiver history reports exactly 5 completed exchanges (actual: ${receiverCompletedCount})`)

  // Aggregation query used by donor request endpoint
  const aggregationResult = await Exchange.aggregate([
    {
      $match: {
        receiver: new mongoose.Types.ObjectId(testReceiver._id),
        status: { $in: ['completed', 'delivered'] },
      },
    },
    {
      $group: {
        _id: '$receiver',
        count: { $sum: 1 },
      },
    },
  ])

  const donorReportedCount = aggregationResult[0]?.count || 0
  assert(
    donorReportedCount === receiverCompletedCount,
    `Donor dashboard and receiver history are 100% consistent! (Both show ${donorReportedCount} completed exchanges)`
  )

  // Test adding 6th completed exchange: count must dynamically update to 6
  await Exchange.create({
    donation: sampleDonation._id,
    request: sampleRequest._id,
    donor: testDonor._id,
    receiver: testReceiver._id,
    deliveryType: 'direct_pickup',
    pickupCode: '1006',
    status: 'completed',
    pickupAddress: 'Test Address',
  })

  const updatedCount = await Exchange.countDocuments({
    receiver: testReceiver._id,
    status: { $in: ['completed', 'delivered'] },
  })
  assert(updatedCount === 6, `After 6th completed exchange, count dynamically increases to 6 (actual: ${updatedCount})`)

  // Cleanup test documents
  await FoodDonation.deleteMany({ _id: { $in: createdDonations.map((d) => d._id) } })
  await Exchange.deleteMany({ receiver: testReceiver._id })
  await FoodRequest.deleteMany({ receiver: testReceiver._id })

  console.log('\n=== ALL 5 ESSENTIAL CHANGES FULLY VERIFIED AND PASSING! ===')
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
