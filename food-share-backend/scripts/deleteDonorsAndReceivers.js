import dns from 'dns'
dns.setServers(['8.8.8.8', '8.8.4.4'])

import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import { User } from '../src/models/User.js'
import { DonorProfile } from '../src/models/DonorProfile.js'
import { ReceiverProfile } from '../src/models/ReceiverProfile.js'
import { FoodDonation } from '../src/models/FoodDonation.js'
import { FoodRequest } from '../src/models/FoodRequest.js'
import { Exchange } from '../src/models/Exchange.js'
import { Notification } from '../src/models/Notification.js'
import { OrderIssue } from '../src/models/OrderIssue.js'
import { RefreshToken } from '../src/models/RefreshToken.js'

async function cleanup() {
  await mongoose.connect(env.MONGODB_URI)
  console.log('Connected to MongoDB:', env.MONGODB_URI.split('@')[1] || 'Atlas')

  // Find all donor and receiver users
  const usersToDelete = await User.find({ role: { $in: ['donor', 'receiver'] } })
  const userIds = usersToDelete.map((u) => u._id)
  console.log(`Found ${usersToDelete.length} donor/receiver accounts to delete:`)
  usersToDelete.forEach((u) => console.log(` - [${u.role.toUpperCase()}] ${u.fullName} (${u.email}) [ID: ${u._id}]`))

  if (userIds.length > 0) {
    const delUsers = await User.deleteMany({ _id: { $in: userIds } })
    console.log(`Successfully deleted ${delUsers.deletedCount} donor and receiver user accounts.`)
  } else {
    console.log('No donor or receiver accounts currently in User collection.')
  }

  // Find all remaining valid user IDs (admin and volunteer)
  const remainingUsers = await User.find({}, '_id')
  const validUserIds = remainingUsers.map((u) => u._id)

  // Delete DonorProfiles and ReceiverProfiles whose user is not in validUserIds
  const delDonorProfiles = await DonorProfile.deleteMany({ user: { $nin: validUserIds } })
  const delReceiverProfiles = await ReceiverProfile.deleteMany({ user: { $nin: validUserIds } })
  console.log(`Deleted ${delDonorProfiles.deletedCount} donor profiles`)
  console.log(`Deleted ${delReceiverProfiles.deletedCount} receiver profiles`)

  // Delete FoodDonations whose donor is not in validUserIds
  const delFood = await FoodDonation.deleteMany({ donor: { $nin: validUserIds } })
  console.log(`Deleted ${delFood.deletedCount} food donations`)

  // Delete FoodRequests whose donor or receiver is not in validUserIds
  const delRequests = await FoodRequest.deleteMany({
    $or: [{ receiver: { $nin: validUserIds } }, { donor: { $nin: validUserIds } }],
  })
  console.log(`Deleted ${delRequests.deletedCount} food requests`)

  // Delete Exchanges whose donor or receiver is not in validUserIds
  const delExchanges = await Exchange.deleteMany({
    $or: [{ donor: { $nin: validUserIds } }, { receiver: { $nin: validUserIds } }],
  })
  console.log(`Deleted ${delExchanges.deletedCount} exchanges`)

  // Delete Notifications whose user is not in validUserIds
  const delNotifications = await Notification.deleteMany({ user: { $nin: validUserIds } })
  console.log(`Deleted ${delNotifications.deletedCount} notifications`)

  // Delete RefreshTokens whose user is not in validUserIds
  const delTokens = await RefreshToken.deleteMany({ user: { $nin: validUserIds } })
  console.log(`Deleted ${delTokens.deletedCount} refresh tokens`)

  // Delete OrderIssues if any
  const delIssues = await OrderIssue.deleteMany({
    $or: [{ reporter: { $nin: validUserIds } }, { receiver: { $nin: validUserIds } }, { donor: { $nin: validUserIds } }],
  })
  console.log(`Deleted ${delIssues.deletedCount} order issues`)


  // Report remaining users
  const remaining = await User.find({})
  console.log(`\nRemaining users in database (${remaining.length}):`)
  remaining.forEach((u) => console.log(` - [${u.role.toUpperCase()}] ${u.fullName} (${u.email})`))

  await mongoose.disconnect()
}

cleanup().catch((err) => {
  console.error('Cleanup error:', err)
  process.exit(1)
})
